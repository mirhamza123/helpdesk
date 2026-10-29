export const isObjectId = (v: unknown): v is string => typeof v === "string" && /^[a-f\d]{24}$/i.test(v);
export const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
export const iso = (d?: Date | string | null) => (d ? new Date(d).toISOString() : null);
export const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
export const formatDate = (d: string | Date) =>
  new Date(d).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });
