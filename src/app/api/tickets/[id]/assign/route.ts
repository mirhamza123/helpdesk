import { NextResponse } from "next/server";
import { requireApiUser, route, type IdCtx } from "@/lib/guard";
import { assignSchema } from "@/lib/validators";
import { assignTicket } from "@/lib/tickets/service";

export const POST = route<IdCtx>(async (req, { params }) => {
  const admin = await requireApiUser(["admin"]);
  await assignTicket(admin, (await params).id, assignSchema.parse(await req.json()).agentId);
  return NextResponse.json({ ok: true });
});
