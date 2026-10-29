import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import { User } from "@/models";
import { ApiError } from "@/lib/errors";
import { clientIp, route } from "@/lib/guard";
import { rateLimit } from "@/lib/rate-limit";
import { registerSchema } from "@/lib/validators";

export const POST = route(async (req) => {
  if (!rateLimit(`register:${clientIp(req)}`, 5, 60 * 60_000)) throw new ApiError(429, "Too many sign-ups. Try again later.");
  const { name, email, password } = registerSchema.parse(await req.json());
  await connectDB();
  if (await User.exists({ email })) throw new ApiError(409, "An account with this email already exists");
  // Role is never taken from the request: public sign-up always creates a regular user.
  await User.create({ name, email, password: await bcrypt.hash(password, 12), role: "user" });
  return NextResponse.json({ ok: true }, { status: 201 });
});
