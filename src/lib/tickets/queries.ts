import { Types } from "mongoose";
import { connectDB } from "@/lib/db";
import { ActivityLog, Category, Message, Ticket, User } from "@/models";
import { MESSAGE_PAGE_SIZE, PAGE_SIZE, USER_VISIBLE_ACTIONS } from "@/lib/constants";
import { escapeRegex, isObjectId, iso } from "@/lib/utils";
import type { ListQuery } from "@/lib/validators";
import type { ActivityDTO, MessageDTO, Paginated, SessionUser, TicketDetail, TicketRow } from "@/lib/types";
import { syncSlaBreaches } from "./maintenance";

/**
 * THE access-control rule for tickets. Every ticket read/write goes through this filter,
 * so a user can never reach another user's ticket — by page, API call, or guessed id.
 */
export function ticketScope(user: SessionUser): Record<string, unknown> {
  const id = new Types.ObjectId(user.id);
  if (user.role === "admin") return {};
  if (user.role === "agent") return { assignedAgent: id };
  return { createdBy: id };
}

export async function listTickets(user: SessionUser, q: ListQuery): Promise<Paginated<TicketRow>> {
  await connectDB();
  await syncSlaBreaches();
  const filter: Record<string, unknown> = { ...ticketScope(user) };
  if (q.status) filter.status = q.status;
  if (q.priority) filter.priority = q.priority;
  if (q.category) filter.category = new Types.ObjectId(q.category);
  if (q.assigned && user.role === "admin") {
    filter.assignedAgent = q.assigned === "unassigned" ? null : new Types.ObjectId(q.assigned);
  }
  if (q.q) {
    const rx = new RegExp(escapeRegex(q.q), "i");
    filter.$or = [{ title: rx }, { ticketNumber: rx }];
  }
  const [docs, total] = await Promise.all([
    Ticket.find(filter)
      .sort({ createdAt: -1 })
      .skip((q.page - 1) * PAGE_SIZE)
      .limit(PAGE_SIZE)
      .populate("category", "name")
      .populate("createdBy", "name")
      .populate("assignedAgent", "name")
      .lean<any[]>(),
    Ticket.countDocuments(filter),
  ]);
  return {
    items: docs.map((t) => ({
      id: String(t._id),
      ticketNumber: t.ticketNumber,
      title: t.title,
      priority: t.priority,
      status: t.status,
      category: t.category?.name ?? "—",
      createdBy: t.createdBy?.name ?? "—",
      assignedAgent: t.assignedAgent?.name ?? null,
      createdAt: iso(t.createdAt)!,
      responseDueDate: iso(t.responseDueDate)!,
      resolutionDueDate: iso(t.resolutionDueDate)!,
      firstResponseAt: iso(t.firstResponseAt),
      slaBreached: !!t.slaBreached,
    })),
    total,
    page: q.page,
    pages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
  };
}

export async function getTicketDetail(user: SessionUser, id: string, messagePage?: number) {
  if (!isObjectId(id)) return null;
  await connectDB();
  const t = await Ticket.findOne({ _id: id, ...ticketScope(user) })
    .populate("category", "name")
    .populate("createdBy", "name email")
    .populate("assignedAgent", "name")
    .lean<any>();
  if (!t) return null; // 404 whether it doesn't exist or isn't yours — don't leak existence

  const isStaff = user.role !== "user";
  // Internal notes are filtered in the DB query itself, never sent to end-users.
  const msgFilter = { ticket: t._id, ...(isStaff ? {} : { internal: false }) };
  const totalMessages = await Message.countDocuments(msgFilter);
  const pages = Math.max(1, Math.ceil(totalMessages / MESSAGE_PAGE_SIZE));
  const page = Math.min(Math.max(messagePage ?? pages, 1), pages);

  const [msgs, acts] = await Promise.all([
    Message.find(msgFilter)
      .sort({ createdAt: 1 })
      .skip((page - 1) * MESSAGE_PAGE_SIZE)
      .limit(MESSAGE_PAGE_SIZE)
      .populate("author", "name role")
      .lean<any[]>(),
    ActivityLog.find({ ticket: t._id, ...(isStaff ? {} : { action: { $in: USER_VISIBLE_ACTIONS } }) })
      .sort({ createdAt: -1 })
      .limit(50)
      .populate("actor", "name")
      .lean<any[]>(),
  ]);

  const ticket: TicketDetail = {
    id: String(t._id),
    ticketNumber: t.ticketNumber,
    title: t.title,
    description: t.description,
    priority: t.priority,
    status: t.status,
    category: { id: String(t.category?._id), name: t.category?.name ?? "—" },
    createdBy: { id: String(t.createdBy?._id), name: t.createdBy?.name ?? "—", email: t.createdBy?.email ?? "" },
    assignedAgent: t.assignedAgent ? { id: String(t.assignedAgent._id), name: t.assignedAgent.name } : null,
    attachments: t.attachments ?? [],
    createdAt: iso(t.createdAt)!,
    updatedAt: iso(t.updatedAt)!,
    responseDueDate: iso(t.responseDueDate)!,
    resolutionDueDate: iso(t.resolutionDueDate)!,
    firstResponseAt: iso(t.firstResponseAt),
    resolvedAt: iso(t.resolvedAt),
    slaBreached: !!t.slaBreached,
  };
  const messages: MessageDTO[] = msgs.map((m) => ({
    id: String(m._id),
    author: { id: String(m.author?._id), name: m.author?.name ?? "Deleted user", role: m.author?.role ?? "user" },
    body: m.body,
    attachments: m.attachments ?? [],
    internal: !!m.internal,
    createdAt: iso(m.createdAt)!,
  }));
  const activity: ActivityDTO[] = acts.map((a) => ({
    id: String(a._id),
    actor: a.actor?.name ?? "System",
    action: a.action,
    details: a.details,
    createdAt: iso(a.createdAt)!,
  }));
  return { ticket, messages, activity, messagePage: page, messagePages: pages, totalMessages };
}

export async function listCategories() {
  await connectDB();
  const cats = await Category.find().sort({ name: 1 }).lean();
  return cats.map((c) => ({ id: String(c._id), name: c.name, description: c.description ?? "", defaultPriority: c.defaultPriority }));
}

export async function listAgents() {
  await connectDB();
  const agents = await User.find({ role: "agent", active: true }).sort({ name: 1 }).select("name").lean();
  return agents.map((a) => ({ id: String(a._id), name: a.name }));
}
