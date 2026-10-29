import { connectDB } from "@/lib/db";
import { ActivityLog, Ticket } from "@/models";
import { AUTO_CLOSE_DAYS } from "@/lib/constants";

let lastSync = 0;

/** Flags tickets whose response/resolution timer has run out. Throttled to once per 60s per instance. */
export async function syncSlaBreaches(force = false) {
  const now = Date.now();
  if (!force && now - lastSync < 60_000) return 0;
  lastSync = now;
  await connectDB();
  const at = new Date(now);
  const filter = {
    slaBreached: false,
    status: { $nin: ["Resolved", "Closed"] },
    $or: [{ firstResponseAt: null, responseDueDate: { $lt: at } }, { resolutionDueDate: { $lt: at } }],
  };
  const breached = await Ticket.find(filter).select("_id").limit(500).lean();
  if (breached.length === 0) return 0;
  const ids = breached.map((t) => t._id);
  await Ticket.updateMany({ _id: { $in: ids }, slaBreached: false }, { $set: { slaBreached: true } });
  await ActivityLog.insertMany(
    ids.map((id) => ({ ticket: id, action: "sla_breached", details: "SLA timer expired — ticket marked as breached" })),
  );
  return ids.length;
}

/** Closes tickets that have sat in "Resolved" for AUTO_CLOSE_DAYS without a user reply (a reply reopens them). */
export async function autoCloseResolved() {
  await connectDB();
  const cutoff = new Date(Date.now() - AUTO_CLOSE_DAYS * 86_400_000);
  const candidates = await Ticket.find({ status: "Resolved", resolvedAt: { $lte: cutoff } }).select("_id").limit(500).lean();
  let closed = 0;
  for (const c of candidates) {
    // Conditional update = safe against a user replying at the same moment.
    const res = await Ticket.updateOne(
      { _id: c._id, status: "Resolved", resolvedAt: { $lte: cutoff } },
      { $set: { status: "Closed", closedAt: new Date() } },
    );
    if (res.modifiedCount) {
      closed++;
      await ActivityLog.create({
        ticket: c._id,
        action: "auto_closed",
        details: `Closed automatically after ${AUTO_CLOSE_DAYS} days in Resolved with no reply`,
      });
    }
  }
  return closed;
}
