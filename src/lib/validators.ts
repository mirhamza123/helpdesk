import { z } from "zod";
import { MAX_ATTACHMENTS, PRIORITIES, ROLES, STATUSES } from "./constants";

export const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid id");
const attachmentUrl = z
  .string()
  .url()
  .max(500)
  .refine((u) => u.startsWith("https://res.cloudinary.com/"), "Invalid attachment URL");
const attachments = z.array(attachmentUrl).max(MAX_ATTACHMENTS, `Up to ${MAX_ATTACHMENTS} files`).default([]);

const email = z.string().trim().toLowerCase().email("Enter a valid email").max(254);
const password = z
  .string()
  .min(8, "At least 8 characters")
  .max(72, "At most 72 characters")
  .regex(/[A-Za-z]/, "Include a letter")
  .regex(/\d/, "Include a number");
const name = z.string().trim().min(2, "At least 2 characters").max(80);

export const loginSchema = z.object({ email, password: z.string().min(1, "Enter your password").max(72) });

export const registerSchema = z
  .object({ name, email, password, confirmPassword: z.string() })
  .refine((v) => v.password === v.confirmPassword, { path: ["confirmPassword"], message: "Passwords don't match" });

export const ticketCreateSchema = z.object({
  title: z.string().trim().min(5, "At least 5 characters").max(150),
  description: z.string().trim().min(10, "Describe the problem in at least 10 characters").max(5000),
  category: objectId,
  priority: z.enum(PRIORITIES),
  attachments,
});

export const messageSchema = z.object({
  body: z.string().trim().min(1, "Write a message").max(5000),
  attachments,
  internal: z.boolean().default(false),
});

export const ticketUpdateSchema = z
  .object({ status: z.enum(STATUSES).optional(), priority: z.enum(PRIORITIES).optional() })
  .refine((v) => v.status || v.priority, "Nothing to update");

export const assignSchema = z.object({ agentId: objectId.nullable() });

export const categorySchema = z.object({
  name: z.string().trim().min(2).max(60),
  description: z.string().trim().max(300).default(""),
  defaultPriority: z.enum(PRIORITIES),
});

export const adminUserCreateSchema = z.object({ name, email, password, role: z.enum(ROLES) });
export const adminUserUpdateSchema = z
  .object({ role: z.enum(ROLES).optional(), active: z.boolean().optional(), newPassword: password.optional() })
  .refine((v) => v.role !== undefined || v.active !== undefined || v.newPassword, "Nothing to update");

/** Lenient: bad query-string values fall back to "no filter" instead of throwing. */
export const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(10_000).catch(1),
  status: z.enum(STATUSES).optional().catch(undefined),
  priority: z.enum(PRIORITIES).optional().catch(undefined),
  category: objectId.optional().catch(undefined),
  assigned: z.union([objectId, z.literal("unassigned")]).optional().catch(undefined),
  q: z.string().trim().max(100).optional().catch(undefined),
});
export type ListQuery = z.infer<typeof listQuerySchema>;

export function parseListQuery(raw: Record<string, string | string[] | undefined> | URLSearchParams): ListQuery {
  const obj: Record<string, string | undefined> = {};
  const get = (k: string) => {
    const v = raw instanceof URLSearchParams ? raw.get(k) : raw[k];
    return (Array.isArray(v) ? v[0] : v) || undefined;
  };
  for (const k of ["page", "status", "priority", "category", "assigned", "q"]) obj[k] = get(k);
  return listQuerySchema.parse(obj);
}

export type TicketCreateInput = z.infer<typeof ticketCreateSchema>;
export type MessageInput = z.infer<typeof messageSchema>;
export type TicketUpdateInput = z.infer<typeof ticketUpdateSchema>;
