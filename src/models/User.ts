import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
import { ROLES } from "@/lib/constants";

const UserSchema = new Schema({
  name: { type: String, required: true, trim: true, maxlength: 80 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 254 },
  password: { type: String, required: true, select: false },
  role: { type: String, enum: ROLES, default: "user", index: true },
  active: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

export type IUser = InferSchemaType<typeof UserSchema>;
export const User = (mongoose.models.User as Model<IUser>) || mongoose.model<IUser>("User", UserSchema);
