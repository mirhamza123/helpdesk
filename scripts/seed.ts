/* Usage: npm run seed   (wipes the helpdesk collections, then inserts demo data) */
import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env" });
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { ActivityLog, Category, Counter, Message, Ticket, User } from "../src/models";
import { computeDueDates } from "../src/lib/sla";
import type { Priority, Status } from "../src/lib/constants";

const H = 3_600_000;
const PASSWORD = process.env.SEED_PASSWORD ?? "ChangeMe123!";

type Msg = ["u" | "a", string, number, boolean?]; // [who, body, hours after creation, internal?]
type Def = { title: string; desc: string; cat: number; priority: Priority; status: Status; user: number; agent: number | null; ageH: number; msgs: Msg[] };

const defs: Def[] = [
  { title: "Charged twice for October subscription", desc: "I can see two identical charges of $29 on my card dated 3 October. Please refund one.", cat: 0, priority: "High", status: "In Progress", user: 0, agent: 0, ageH: 20,
    msgs: [["a", "Thanks for flagging this. I've asked finance to verify the duplicate charge.", 2], ["a", "Payment gateway shows a retry; refund approved, sending to billing.", 3, true], ["u", "Great, how long will the refund take?", 5]] },
  { title: "Cannot log in after password reset", desc: "The reset email arrives but the link says 'token expired' immediately.", cat: 2, priority: "Urgent", status: "In Progress", user: 1, agent: 1, ageH: 6,
    msgs: [["a", "Sorry about that — I'm looking into the reset token lifetime now.", 0.5], ["a", "Likely email scanner pre-clicking the link. Asking user to try a different browser.", 0.7, true]] },
  { title: "Dashboard export to CSV is empty", desc: "Exporting the monthly report downloads a file with only headers.", cat: 1, priority: "Medium", status: "Open", user: 2, agent: 0, ageH: 30, msgs: [] },
  { title: "Request: dark mode for the web app", desc: "Working late and the white background is hard on the eyes. Would love a dark theme.", cat: 3, priority: "Low", status: "Open", user: 0, agent: null, ageH: 5, msgs: [] },
  { title: "Invoice shows wrong company name", desc: "Our invoice lists the old company name. Please update to 'Northwind Traders (Pvt) Ltd'.", cat: 0, priority: "Medium", status: "Waiting on User", user: 1, agent: 1, ageH: 50,
    msgs: [["a", "Could you share your registration certificate so we can update the legal name?", 4], ["u", "Attaching it shortly.", 8], ["a", "Still waiting for the document — let us know when ready.", 30]] },
  { title: "App crashes when uploading photos", desc: "Every time I upload a photo larger than 3 MB the page goes blank. Chrome 130 on Windows.", cat: 1, priority: "High", status: "In Progress", user: 2, agent: 0, ageH: 10,
    msgs: [["a", "Reproduced on our side. Escalating to engineering.", 1.5], ["a", "Crash comes from client-side resize on large HEIC files.", 2, true]] },
  { title: "Two-factor codes not arriving by SMS", desc: "I'm in Karachi and none of the 2FA SMS codes arrive. Authenticator app is not an option for me.", cat: 2, priority: "High", status: "Open", user: 1, agent: null, ageH: 9, msgs: [] },
  { title: "How do I change my billing email?", desc: "I'd like invoices to go to accounts@ instead of my personal address.", cat: 0, priority: "Low", status: "Resolved", user: 0, agent: 1, ageH: 40,
    msgs: [["a", "You can change it under Settings → Billing → Contacts. I've also done it for you.", 3], ["u", "Thanks!", 4]] },
  { title: "Slow page loads on the reports page", desc: "Reports take 40+ seconds to load since last week.", cat: 1, priority: "Medium", status: "Resolved", user: 2, agent: 0, ageH: 130,
    msgs: [["a", "We found a missing index and have deployed a fix.", 6], ["u", "Looks fast now, thank you.", 20], ["a", "Marking as resolved. Reply within 3 days if it returns.", 30]] },
  { title: "Account locked after too many attempts", desc: "I mistyped my password a few times and now my account is locked.", cat: 2, priority: "Urgent", status: "Resolved", user: 1, agent: 1, ageH: 28,
    msgs: [["a", "Unlocked your account. Please try again.", 0.4], ["u", "Works now. Thanks for the quick help!", 1]] },
  { title: "Feature request: bulk ticket tagging", desc: "We handle hundreds of requests; tagging them in bulk would save hours.", cat: 3, priority: "Low", status: "Closed", user: 0, agent: 0, ageH: 200,
    msgs: [["a", "Great idea — added to our roadmap discussion.", 20], ["u", "Thanks for considering it.", 22]] },
  { title: "Refund for cancelled annual plan", desc: "I cancelled within the 14-day window, please refund the annual fee.", cat: 0, priority: "High", status: "Closed", user: 2, agent: 1, ageH: 160,
    msgs: [["a", "Refund processed; you'll see it in 5–7 business days.", 3], ["u", "Received, thank you.", 90]] },
  { title: "Cannot attach PDF to a reply", desc: "Attaching a 2 MB PDF gives an unknown error.", cat: 1, priority: "Medium", status: "Closed", user: 0, agent: 0, ageH: 150,
    msgs: [["a", "PDFs under 4 MB are supported; this was a temporary storage issue and is fixed.", 7], ["u", "Works now.", 9]] },
  { title: "Suggestion: email digest of ticket updates", desc: "A daily digest of all my open tickets would be handy.", cat: 3, priority: "Low", status: "Waiting on User", user: 2, agent: 1, ageH: 70,
    msgs: [["a", "Would you prefer daily or weekly digests?", 5]] },
  { title: "SSO login redirects in a loop", desc: "After signing in with Google I bounce between /login and /dashboard endlessly.", cat: 2, priority: "Urgent", status: "Open", user: 0, agent: 1, ageH: 3, msgs: [] },
  { title: "Wrong tax shown on invoice", desc: "VAT is applied but I'm tax exempt. Certificate on file since 2024.", cat: 0, priority: "Medium", status: "In Progress", user: 1, agent: 0, ageH: 26,
    msgs: [["a", "I can see the exemption on file — checking why it wasn't applied.", 6], ["a", "Exemption flag lost during plan migration; fixing manually.", 7, true]] },
  { title: "Mobile layout broken on iPhone SE", desc: "The ticket table overflows and I can't scroll to the buttons.", cat: 1, priority: "Low", status: "Open", user: 2, agent: null, ageH: 60, msgs: [] },
];

async function main() {
  if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI is not set (see .env.example)");
  if (process.env.NODE_ENV === "production" && !process.argv.includes("--force")) throw new Error("Refusing to wipe data in production without --force");
  await mongoose.connect(process.env.MONGODB_URI);
  await Promise.all([User, Category, Ticket, Message, ActivityLog, Counter].map((m) => (m as mongoose.Model<any>).deleteMany({})));

  const hash = await bcrypt.hash(PASSWORD, 12);
  const mk = (name: string, email: string, role: "user" | "agent" | "admin") => ({ name, email, role, password: hash });
  const admin = await User.create(mk("Ayesha Khan", "admin@helpdesk.test", "admin"));
  const agents = await User.create([mk("Bilal Ahmed", "bilal@helpdesk.test", "agent"), mk("Sara Malik", "sara@helpdesk.test", "agent")]);
  const users = await User.create([mk("Hamza Raza", "hamza@example.com", "user"), mk("Zainab Ali", "zainab@example.com", "user"), mk("Usman Sheikh", "usman@example.com", "user")]);
  const cats = await Category.create([
    { name: "Billing & Payments", description: "Charges, refunds, invoices", defaultPriority: "Medium" },
    { name: "Technical Issue", description: "Bugs, errors and performance problems", defaultPriority: "High" },
    { name: "Account & Access", description: "Login, 2FA, permissions", defaultPriority: "High" },
    { name: "Feature Request", description: "Ideas and improvements", defaultPriority: "Low" },
  ]);

  const now = Date.now();
  let n = 0;
  for (const d of defs) {
    const created = new Date(now - d.ageH * H);
    const due = computeDueDates(d.priority, created);
    const staffMsgs = d.msgs.filter((m) => m[0] === "a" && !m[3]);
    const firstResp = staffMsgs.length ? new Date(created.getTime() + staffMsgs[0][2] * H) : undefined;
    const finished = d.status === "Resolved" || d.status === "Closed";
    const lastOffset = d.msgs.length ? Math.max(...d.msgs.map((m) => m[2])) : 0;
    const doneAt = finished ? new Date(created.getTime() + (lastOffset + 1) * H) : undefined;
    const lateResponse = firstResp ? firstResp > due.responseDueDate : now > due.responseDueDate.getTime();
    const lateResolution = (doneAt ?? new Date(now)) > due.resolutionDueDate;
    const breached = lateResponse || lateResolution;
    const agent = d.agent === null ? undefined : agents[d.agent];

    const ticket = await new Ticket({
      ticketNumber: `TKT-${String(++n).padStart(4, "0")}`, title: d.title, description: d.desc, category: cats[d.cat]._id,
      priority: d.priority, status: d.status, createdBy: users[d.user]._id, assignedAgent: agent?._id, attachments: [],
      ...due, firstResponseAt: firstResp, resolvedAt: finished ? doneAt : undefined, closedAt: d.status === "Closed" ? doneAt : undefined,
      slaBreached: breached, createdAt: created, updatedAt: new Date(now - Math.min(d.ageH, 1) * H),
    }).save({ timestamps: false });

    const logs: object[] = [{ ticket: ticket._id, actor: users[d.user]._id, action: "created", details: `Ticket created with ${d.priority} priority`, createdAt: created }];
    if (agent) logs.push({ ticket: ticket._id, actor: admin._id, action: "assigned", details: `Assigned to ${agent.name}`, createdAt: new Date(created.getTime() + 0.2 * H) });
    if (firstResp && d.status !== "Open") logs.push({ ticket: ticket._id, actor: agent?._id, action: "status_changed", details: "Status changed from Open to In Progress", createdAt: firstResp });
    if (finished) logs.push({ ticket: ticket._id, actor: agent?._id, action: "status_changed", details: `Status changed from In Progress to ${d.status}`, createdAt: doneAt });
    if (ticket.slaBreached) logs.push({ ticket: ticket._id, action: "sla_breached", details: "SLA timer expired — ticket marked as breached", createdAt: new Date(Math.min(now, due.responseDueDate.getTime() + H)) });

    for (const [who, body, off, internal] of d.msgs) {
      await new Message({ ticket: ticket._id, author: who === "u" ? users[d.user]._id : agent!._id, body, internal: !!internal, attachments: [],
        createdAt: new Date(created.getTime() + off * H), updatedAt: new Date(created.getTime() + off * H) }).save({ timestamps: false });
      if (internal) logs.push({ ticket: ticket._id, actor: agent!._id, action: "note_added", details: "Internal note added", createdAt: new Date(created.getTime() + off * H) });
    }
    await ActivityLog.insertMany(logs);
  }
  await Counter.create({ _id: "ticket", seq: n });

  console.log(`\n✔ Seeded: 1 admin, ${agents.length} agents, ${users.length} users, ${cats.length} categories, ${n} tickets\n`);
  console.log("Logins (password for all):", PASSWORD);
  console.table([admin, ...agents, ...users].map((u) => ({ role: u.role, email: u.email })));
  await mongoose.disconnect();
}

main().catch(async (e) => { console.error(e); await mongoose.disconnect(); process.exit(1); });
