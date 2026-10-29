import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Category, Ticket } from "@/models";
import { ApiError } from "@/lib/errors";
import { requireApiUser, route, type IdCtx } from "@/lib/guard";
import { categorySchema, objectId } from "@/lib/validators";

export const PATCH = route<IdCtx>(async (req, { params }) => {
  await requireApiUser(["admin"]);
  const id = objectId.parse((await params).id);
  await connectDB();
  const c = await Category.findByIdAndUpdate(id, categorySchema.parse(await req.json()), { new: true });
  if (!c) throw new ApiError(404, "Category not found");
  return NextResponse.json({ ok: true });
});

export const DELETE = route<IdCtx>(async (_req, { params }) => {
  await requireApiUser(["admin"]);
  const id = objectId.parse((await params).id);
  await connectDB();
  if (await Ticket.exists({ category: id })) throw new ApiError(409, "This category is used by existing tickets");
  await Category.findByIdAndDelete(id);
  return NextResponse.json({ ok: true });
});
