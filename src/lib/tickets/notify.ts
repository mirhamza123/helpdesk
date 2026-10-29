import { connectDB } from "@/lib/db";
import { User } from "@/models";
import { sendMail, ticketEmail } from "@/lib/mailer";

type T = { id: string; ticketNumber: string; title: string };
const mail = (t: T, heading: string, lines: string[], quote?: string) =>
  ticketEmail({ heading, lines, quote, ticketId: t.id, ticketNumber: t.ticketNumber });

async function adminEmails() {
  const admins = await User.find({ role: "admin", active: true }).select("email").lean();
  return admins.map((a) => a.email);
}

export async function notifyCreated(t: T, owner: { name: string; email: string }) {
  await connectDB();
  await sendMail(owner.email, `[${t.ticketNumber}] We received your ticket`, mail(t, "Ticket received", [`Hi ${owner.name}, we've logged "${t.title}" and will respond soon.`]));
  await sendMail(await adminEmails(), `[${t.ticketNumber}] New ticket: ${t.title}`, mail(t, "New ticket submitted", [`${owner.name} opened "${t.title}".`]));
}

export async function notifyAssigned(t: T, agent: { name: string; email: string }, owner: { email: string }) {
  await sendMail(agent.email, `[${t.ticketNumber}] Assigned to you`, mail(t, "Ticket assigned to you", [`"${t.title}" is now in your queue.`]));
  await sendMail(owner.email, `[${t.ticketNumber}] An agent has been assigned`, mail(t, "An agent is on it", [`${agent.name} is now handling "${t.title}".`]));
}

export async function notifyReply(t: T, to: string | string[], fromName: string, body: string) {
  await sendMail(to, `[${t.ticketNumber}] New reply on "${t.title}"`, mail(t, "New reply", [`${fromName} replied:`], body));
}

export async function notifyResolved(t: T, owner: { name: string; email: string }) {
  await sendMail(owner.email, `[${t.ticketNumber}] Resolved: ${t.title}`, mail(t, "Your ticket was resolved", [`Hi ${owner.name}, "${t.title}" is marked resolved. Reply within 3 days if it isn't fixed, otherwise it will close automatically.`]));
}

export { adminEmails };
