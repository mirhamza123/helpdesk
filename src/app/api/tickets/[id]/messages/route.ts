import { NextResponse } from "next/server";
import { requireApiUser, route, type IdCtx } from "@/lib/guard";
import { messageSchema } from "@/lib/validators";
import { addMessage } from "@/lib/tickets/service";

export const POST = route<IdCtx>(async (req, { params }) => {
  const user = await requireApiUser();
  await addMessage(user, (await params).id, messageSchema.parse(await req.json()));
  return NextResponse.json({ ok: true }, { status: 201 });
});
