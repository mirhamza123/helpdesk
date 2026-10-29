import { NextResponse } from "next/server";
import { ApiError } from "@/lib/errors";
import { requireApiUser, route, type IdCtx } from "@/lib/guard";
import { ticketUpdateSchema } from "@/lib/validators";
import { getTicketDetail } from "@/lib/tickets/queries";
import { updateTicket } from "@/lib/tickets/service";

export const GET = route<IdCtx>(async (_req, { params }) => {
  const user = await requireApiUser();
  const data = await getTicketDetail(user, (await params).id);
  if (!data) throw new ApiError(404, "Ticket not found");
  return NextResponse.json(data);
});

export const PATCH = route<IdCtx>(async (req, { params }) => {
  const user = await requireApiUser();
  await updateTicket(user, (await params).id, ticketUpdateSchema.parse(await req.json()));
  return NextResponse.json({ ok: true });
});
