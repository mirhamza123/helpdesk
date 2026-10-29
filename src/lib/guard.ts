import { redirect } from "next/navigation";
import { NextResponse, type NextRequest } from "next/server";
import { ZodError } from "zod";
import mongoose from "mongoose";
import { auth } from "@/auth";
import { connectDB } from "@/lib/db";
import { User } from "@/models";
import { ApiError } from "./errors";
import type { Role } from "./constants";
import type { SessionUser } from "./types";

/**
 * Resolves the signed-in user from the DB on every call (not from the JWT alone),
 * so deactivated accounts and role changes take effect immediately.
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await auth();
  if (!session?.user?.id) return null;
  await connectDB();
  const u = await User.findById(session.user.id).select("name email role active").lean();
  if (!u || !u.active) return null;
  return { id: String(u._id), name: u.name, email: u.email, role: u.role };
}

export async function requirePageUser(roles?: Role[]): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (roles && !roles.includes(user.role)) redirect("/dashboard");
  return user;
}

export async function requireApiUser(roles?: Role[]): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) throw new ApiError(401, "Authentication required");
  if (roles && !roles.includes(user.role)) throw new ApiError(403, "You don't have permission to do this");
  return user;
}

function assertSameOrigin(req: NextRequest) {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return;
  const origin = req.headers.get("origin");
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  if (origin) {
    if (new URL(origin).host !== host) throw new ApiError(403, "Cross-origin request blocked");
  } else if (req.headers.get("sec-fetch-site") === "cross-site") {
    throw new ApiError(403, "Cross-origin request blocked");
  }
}

export function errorResponse(e: unknown) {
  if (e instanceof ApiError) return NextResponse.json({ error: e.message, details: e.details }, { status: e.status });
  if (e instanceof ZodError) {
    return NextResponse.json({ error: "Validation failed", details: e.flatten().fieldErrors }, { status: 400 });
  }
  if (e instanceof SyntaxError) return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  if (e instanceof mongoose.Error.CastError) return NextResponse.json({ error: "Invalid identifier" }, { status: 400 });
  if ((e as { code?: number })?.code === 11000) return NextResponse.json({ error: "Already exists" }, { status: 409 });
  console.error("[api] unhandled error", e);
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}

/** Wraps a route handler: same-origin check + uniform error handling. */
export function route<C = unknown>(handler: (req: NextRequest, ctx: C) => Promise<Response>) {
  return async (req: NextRequest, ctx: C) => {
    try {
      assertSameOrigin(req);
      return await handler(req, ctx);
    } catch (e) {
      return errorResponse(e);
    }
  };
}

export const clientIp = (req: NextRequest) => req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
export type IdCtx = { params: Promise<{ id: string }> };
