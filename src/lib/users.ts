import { connectDB } from "@/lib/db";
import { User } from "@/models";
import { PAGE_SIZE } from "@/lib/constants";
import type { Paginated } from "@/lib/types";
import type { Role } from "@/lib/constants";

export type UserRow = { id: string; name: string; email: string; role: Role; active: boolean; createdAt: string };

export async function listUsers(page: number): Promise<Paginated<UserRow>> {
  await connectDB();
  const [docs, total] = await Promise.all([
    User.find().sort({ createdAt: -1 }).skip((page - 1) * PAGE_SIZE).limit(PAGE_SIZE).lean(),
    User.countDocuments(),
  ]);
  return {
    items: docs.map((u) => ({ id: String(u._id), name: u.name, email: u.email, role: u.role, active: u.active, createdAt: new Date(u.createdAt).toISOString() })),
    total,
    page,
    pages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
  };
}
