import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Category } from "@/models";
import { requireApiUser, route } from "@/lib/guard";
import { categorySchema } from "@/lib/validators";
import { listCategories } from "@/lib/tickets/queries";

export const GET = route(async () => {
  await requireApiUser();
  return NextResponse.json({ items: await listCategories() });
});

export const POST = route(async (req) => {
  await requireApiUser(["admin"]);
  await connectDB();
  const c = await Category.create(categorySchema.parse(await req.json()));
  return NextResponse.json({ id: c.id }, { status: 201 });
});
