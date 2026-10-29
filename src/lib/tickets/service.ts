import { after } from "next/server";
import { connectDB } from "@/lib/db";
import { ActivityLog, Category, Counter, Message, Ticket, User } from "@/models";
import { ApiError } from "@/lib/errors";
import { rateLimit } from "@/lib/rate-limit";
import { assertOwnAttachments } from "@/lib/cloudinary";
import { computeDueDates } from "@/lib/sla";
import { isObjectId } from "@/lib/utils";
import type { ActivityAction } from "@/lib/constants";
import type { SessionUser } from "@/lib/types";
import type { MessageInput, TicketCreateInput, TicketUpdateInput } from "@/lib/validators";
import { ticketScope } from "./queries";
import { adminEmails, notifyAssigned, notifyCreated, notifyReply, notifyResolved } from "./notify";

async function nextTicketNumber() {
  const c = await Counter.findOneAndUpdate({ _id: "ticket" }, { $inc: { seq: 1 } }, { new: true, upsert: true });
  return `TKT-${String(c.seq).padStart(4, "0")}`;
}

const log = (ticket: unknown, actor: string | null, action: ActivityAction, details: string) =>
  ActivityLog.create({ ticket, actor: actor ?? undefined, action, details });

async function loadScoped(user: SessionUser, id: string) {
  if (!isObjectId(id)) throw new ApiError(404, "Ticket not found");
  const ticket = await Ticket.findOne({ _id: id, ...ticketScope(user) });
  if (!ticket) throw new ApiError(404, "Ticket not found");
  return ticket;
}

export async function createTicket(user: SessionUser, input: TicketCreateInput) {
  if (user.role !== "user") throw new ApiError(403, "Only users can open tickets");
  if (!rateLimit(`ticket:${user.id}`, 10, 3_600_000)) throw new ApiError(429, "Too many tickets. Try again later.");
  assertOwnAttachments(input.attachments);
  await connectDB();
  const category = await Category.findById(input.category).lean();
  if (!category) throw new ApiError(400, "Invalid category");

  const ticket = await Ticket.create({
    ticketNumber: await nextTicketNumber(),
    title: input.title,
    description: input.description,
    category: category._id,
    priority: input.priority,
    status: "Open",
    createdBy: user.id,
    attachments: input.attachments,
    ...computeDueDates(input.priority),
  });
  await log(ticket._id, user.id, "created", `Ticket created with ${input.priority} priority`);

  const t = { id: ticket.id as string, ticketNumber: ticket.ticketNumber, title: ticket.title };
  after(() => notifyCreated(t, { name: user.name, email: user.email }));
  return t;
}

export async function addMessage(user: SessionUser, ticketId: string, input: MessageInput) {
  const isStaff = user.role !== "user";
  if (input.internal && !isStaff) throw new ApiError(403, "Only staff can add internal notes");
  if (!rateLimit(`msg:${user.id}`, 30, 60_000)) throw new ApiError(429, "You're sending messages too quickly");
  assertOwnAttachments(input.attachments);
  await connectDB();
  const ticket = await loadScoped(user, ticketId);
  if (ticket.status === "Closed") throw new ApiError(409, "This ticket is closed");

  await Message.create({ ticket: ticket._id, author: user.id, body: input.body, attachments: input.attachments, internal: input.internal });

  const now = new Date();
  const prev = ticket.status;
  if (input.internal) {
    await log(ticket._id, user.id, "note_added", "Internal note added");
  } else if (isStaff) {
    if (!ticket.firstResponseAt) {
      ticket.firstResponseAt = now;
      if (now > ticket.responseDueDate) ticket.slaBreached = true;
    }
    if (ticket.status === "Open") ticket.status = "In Progress";
  } else if (ticket.status === "Waiting on User" || ticket.status === "Resolved") {
    ticket.status = ticket.assignedAgent ? "In Progress" : "Open";
    ticket.resolvedAt = undefined; // reply cancels the auto-close countdown
  }
  if (ticket.status !== prev) await log(ticket._id, user.id, "status_changed", `Status changed from ${prev} to ${ticket.status}`);
  await ticket.save();

  if (!input.internal) {
    const t = { id: ticket.id as string, ticketNumber: ticket.ticketNumber, title: ticket.title };
    const [owner, agent] = await Promise.all([
      User.findById(ticket.createdBy).select("email").lean(),
      ticket.assignedAgent ? User.findById(ticket.assignedAgent).select("email").lean() : null,
    ]);
    after(async () => {
      if (isStaff) return notifyReply(t, owner?.email ?? "", user.name, input.body);
      const to = agent ? [agent.email] : await adminEmails();
      return notifyReply(t, to, user.name, input.body);
    });
  }
}

export async function updateTicket(user: SessionUser, ticketId: string, input: TicketUpdateInput) {
  await connectDB();
  const ticket = await loadScoped(user, ticketId);
  const isUser = user.role === "user";

  if (isUser && (input.priority || (input.status && input.status !== "Closed"))) {
    throw new ApiError(403, "You can only close your own tickets");
  }
  if (input.priority && user.role !== "admin") throw new ApiError(403, "Only admins can change priority");

  const now = new Date();
  let resolvedNow = false;

  if (input.status && input.status !== ticket.status) {
    if (isUser && ticket.status === "Closed") throw new ApiError(409, "This ticket is already closed");
    const from = ticket.status;
    ticket.status = input.status;
    if (input.status === "Resolved") {
      ticket.resolvedAt = now;
      ticket.closedAt = undefined;
      if (now > ticket.resolutionDueDate) ticket.slaBreached = true;
      resolvedNow = true;
    } else if (input.status === "Closed") {
      ticket.closedAt = now;
    } else {
      ticket.resolvedAt = undefined;
      ticket.closedAt = undefined;
    }
    await log(ticket._id, user.id, "status_changed", `Status changed from ${from} to ${input.status}${isUser ? " (closed by requester)" : ""}`);
  }

  if (input.priority && input.priority !== ticket.priority) {
    const from = ticket.priority;
    ticket.priority = input.priority;
    Object.assign(ticket, computeDueDates(input.priority, ticket.createdAt)); // SLA is re-based on the new priority
    await log(ticket._id, user.id, "priority_changed", `Priority changed from ${from} to ${input.priority}`);
  }
  await ticket.save();

  if (resolvedNow) {
    const owner = await User.findById(ticket.createdBy).select("name email").lean();
    const t = { id: ticket.id as string, ticketNumber: ticket.ticketNumber, title: ticket.title };
    if (owner) after(() => notifyResolved(t, owner));
  }
}

export async function assignTicket(admin: SessionUser, ticketId: string, agentId: string | null) {
  await connectDB();
  const ticket = await loadScoped(admin, ticketId);
  const agent = agentId ? await User.findOne({ _id: agentId, role: "agent", active: true }).select("name email").lean() : null;
  if (agentId && !agent) throw new ApiError(400, "Agent not found or inactive");
  if (String(ticket.assignedAgent ?? "") === (agentId ?? "")) return;

  const prev = ticket.assignedAgent ? await User.findById(ticket.assignedAgent).select("name").lean() : null;
  ticket.assignedAgent = (agent?._id ?? undefined) as typeof ticket.assignedAgent;
  await ticket.save();

  const details = !agent ? `Unassigned from ${prev?.name ?? "agent"}` : prev ? `Reassigned from ${prev.name} to ${agent.name}` : `Assigned to ${agent.name}`;
  await log(ticket._id, admin.id, prev ? "reassigned" : "assigned", details);

  if (agent) {
    const owner = await User.findById(ticket.createdBy).select("email").lean();
    const t = { id: ticket.id as string, ticketNumber: ticket.ticketNumber, title: ticket.title };
    after(() => notifyAssigned(t, agent, { email: owner?.email ?? "" }));
  }
}
