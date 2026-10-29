import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import { User } from "@/models";
import { ApiError } from "@/lib/errors";
import { requireApiUser, route } from "@/lib/guard";
import { adminUserCreateSchema } from "@/lib/validators";
import { listUsers } from "@/lib/users";

export const GET = route(async (req) => {
  await requireApiUser(["admin"]);
  const page = Math.max(1, Number(req.nextUrl.searchParams.get("page")) || 1);
  return NextResponse.json(await listUsers(page));
});

export const POST = route(async (req) => {
  await requireApiUser(["admin"]);
  const { name, email, password, role } = adminUserCreateSchema.parse(await req.json());
  await connectDB();
  if (await User.exists({ email })) throw new ApiError(409, "An account with this email already exists");
  await User.create({ name, email, role, password: await bcrypt.hash(password, 12) });
  return NextResponse.json({ ok: true }, { status: 201 });
});
