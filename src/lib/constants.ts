export const ROLES = ["user", "agent", "admin"] as const;
export const PRIORITIES = ["Low", "Medium", "High", "Urgent"] as const;
export const STATUSES = ["Open", "In Progress", "Waiting on User", "Resolved", "Closed"] as const;
export const ACTIONS = [
  "created", "status_changed", "priority_changed", "assigned", "reassigned",
  "note_added", "sla_breached", "auto_closed",
] as const;

export type Role = (typeof ROLES)[number];
export type Priority = (typeof PRIORITIES)[number];
export type Status = (typeof STATUSES)[number];
export type ActivityAction = (typeof ACTIONS)[number];

export const PAGE_SIZE = 10;
export const MESSAGE_PAGE_SIZE = 20;
export const AUTO_CLOSE_DAYS = 3;
export const MAX_ATTACHMENTS = 3;
export const MAX_FILE_BYTES = 4 * 1024 * 1024; // keeps us under serverless body limits
export const ALLOWED_MIME = ["image/png", "image/jpeg", "image/webp", "image/gif", "application/pdf"];

/** Hours allowed for first response / resolution per priority. */
export const SLA_HOURS: Record<Priority, { response: number; resolution: number }> = {
  Urgent: { response: 1, resolution: 8 },
  High: { response: 4, resolution: 24 },
  Medium: { response: 8, resolution: 72 },
  Low: { response: 24, resolution: 120 },
};

/** Activity entries end-users are allowed to see (no internal-only events). */
export const USER_VISIBLE_ACTIONS: ActivityAction[] = ["created", "status_changed", "auto_closed"];
export const OPEN_STATUSES: Status[] = ["Open", "In Progress", "Waiting on User"];
