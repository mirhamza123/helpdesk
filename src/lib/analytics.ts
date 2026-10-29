import { connectDB } from "@/lib/db";
import { Ticket, User } from "@/models";
import { STATUSES } from "@/lib/constants";
import { syncSlaBreaches } from "@/lib/tickets/maintenance";

export async function getAnalytics() {
  await connectDB();
  await syncSlaBreaches(true);

  const [byStatus, byCategory, response, slaBreaches, workload, agents] = await Promise.all([
    Ticket.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
    Ticket.aggregate([
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $lookup: { from: "categories", localField: "_id", foreignField: "_id", as: "c" } },
      { $project: { name: { $ifNull: [{ $arrayElemAt: ["$c.name", 0] }, "Unknown"] }, count: 1 } },
      { $sort: { count: -1 } },
    ]),
    Ticket.aggregate([
      { $match: { firstResponseAt: { $ne: null } } },
      { $group: { _id: null, avgMs: { $avg: { $subtract: ["$firstResponseAt", "$createdAt"] } }, n: { $sum: 1 } } },
    ]),
    Ticket.countDocuments({ slaBreached: true }),
    Ticket.aggregate([
      { $match: { assignedAgent: { $ne: null } } },
      {
        $group: {
          _id: "$assignedAgent",
          active: { $sum: { $cond: [{ $in: ["$status", ["Resolved", "Closed"]] }, 0, 1] } },
          done: { $sum: { $cond: [{ $in: ["$status", ["Resolved", "Closed"]] }, 1, 0] } },
        },
      },
    ]),
    User.find({ role: "agent", active: true }).select("name").lean(),
  ]);

  const statusMap = new Map<string, number>(byStatus.map((s) => [s._id, s.count]));
  const loadMap = new Map<string, { active: number; done: number }>(workload.map((w) => [String(w._id), w]));
  const statusData = STATUSES.map((s) => ({ name: s, value: statusMap.get(s) ?? 0 }));

  return {
    statusData,
    categoryData: byCategory.map((c) => ({ name: c.name as string, count: c.count as number })),
    workloadData: agents.map((a) => ({
      name: a.name,
      active: loadMap.get(String(a._id))?.active ?? 0,
      done: loadMap.get(String(a._id))?.done ?? 0,
    })),
    avgFirstResponseHours: response[0] ? response[0].avgMs / 3_600_000 : null,
    slaBreaches,
    totalTickets: statusData.reduce((n, s) => n + s.value, 0),
    openTickets: statusData.filter((s) => !["Resolved", "Closed"].includes(s.name)).reduce((n, s) => n + s.value, 0),
  };
}
