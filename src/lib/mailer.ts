import nodemailer from "nodemailer";
import { escapeHtml } from "./utils";

let transporter: nodemailer.Transporter | null = null;
function getTransporter() {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) return null;
  transporter ??= nodemailer.createTransport({
    host: process.env.SMTP_HOST ?? "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT ?? 465),
    secure: Number(process.env.SMTP_PORT ?? 465) === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  return transporter;
}

/** Never throws: a failed email must not fail the request that triggered it. */
export async function sendMail(to: string | string[], subject: string, html: string) {
  const t = getTransporter();
  const recipients = ([] as string[]).concat(to).filter(Boolean);
  if (!t || recipients.length === 0) {
    if (!t) console.warn("[mail] SMTP not configured — skipping:", subject);
    return;
  }
  try {
    await t.sendMail({ from: process.env.MAIL_FROM ?? process.env.SMTP_USER, to: recipients, subject, html });
  } catch (e) {
    console.error("[mail] send failed:", e);
  }
}

const appUrl = () => process.env.APP_URL ?? process.env.AUTH_URL ?? "http://localhost:3000";

export function ticketEmail(opts: { heading: string; lines: string[]; ticketId: string; ticketNumber: string; quote?: string }) {
  const url = `${appUrl()}/tickets/${opts.ticketId}`;
  return `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#16202a">
    <h2 style="margin:0 0 12px">${escapeHtml(opts.heading)}</h2>
    ${opts.lines.map((l) => `<p style="margin:6px 0">${escapeHtml(l)}</p>`).join("")}
    ${opts.quote ? `<blockquote style="margin:12px 0;padding:8px 12px;border-left:3px solid #0f766e;background:#f6f7f6">${escapeHtml(opts.quote.slice(0, 500))}</blockquote>` : ""}
    <p><a href="${url}" style="background:#0f766e;color:#fff;padding:8px 14px;border-radius:6px;text-decoration:none">Open ${escapeHtml(opts.ticketNumber)}</a></p>
  </div>`;
}
