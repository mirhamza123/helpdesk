import { NextResponse, type NextRequest } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { autoCloseResolved, syncSlaBreaches } from "@/lib/tickets/maintenance";

export const dynamic = "force-dynamic";

function authorised(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false; // refuse to run unprotected
  const given = Buffer.from(req.headers.get("authorization") ?? "");
  const expected = Buffer.from(`Bearer ${secret}`);
  return given.length === expected.length && timingSafeEqual(given, expected);
}

/** Hourly/daily job: flag SLA breaches + auto-close Resolved tickets older than 3 days. */
export async function GET(req: NextRequest) {
  if (!authorised(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const [breached, closed] = [await syncSlaBreaches(true), await autoCloseResolved()];
  return NextResponse.json({ breached, closed });
}
