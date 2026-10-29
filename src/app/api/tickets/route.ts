import { NextResponse } from "next/server";
import { requireApiUser, route } from "@/lib/guard";
import { parseListQuery, ticketCreateSchema } from "@/lib/validators";
import { listTickets } from "@/lib/tickets/queries";
import { createTicket } from "@/lib/tickets/service";

export const GET = route(async (req) => {
  const user = await requireApiUser();
  return NextResponse.json(await listTickets(user, parseListQuery(req.nextUrl.searchParams)));
});

export const POST = route(async (req) => {
  const user = await requireApiUser(["user"]);
  const ticket = await createTicket(user, ticketCreateSchema.parse(await req.json()));
  return NextResponse.json(ticket, { status: 201 });
});
