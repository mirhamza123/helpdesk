import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import { Ticket, User } from "@/models";
import { ApiError } from "@/lib/errors";
import { requireApiUser, route, type IdCtx } from "@/lib/guard";
import { adminUserUpdateSchema, objectId } from "@/lib/validators";

export const PATCH = route<IdCtx>(async (req, { params }) => {
  const admin = await requireApiUser(["admin"]);
  const id = objectId.parse((await params).id);
  const input = adminUserUpdateSchema.parse(await req.json());
  if (id === admin.id && (input.active === false || (input.role && input.role !== "admin"))) {
    throw new ApiError(400, "You can't deactivate or demote your own account");
  }
  await connectDB();
  const user = await User.findById(id);
  if (!user) throw new ApiError(404, "User not found");

  if (input.role !== undefined) user.role = input.role;
  if (input.active !== undefined) user.active = input.active;
  if (input.newPassword) user.password = await bcrypt.hash(input.newPassword, 12);
  await user.save();

  // A deactivated / demoted agent must not keep open tickets nobody can work on.
  if (input.active === false || (input.role && input.role !== "agent")) {
    await Ticket.updateMany({ assignedAgent: user._id, status: { $nin: ["Resolved", "Closed"] } }, { $unset: { assignedAgent: 1 } });
  }
  return NextResponse.json({ ok: true });
});
