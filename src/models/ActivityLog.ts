import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
import { ACTIONS } from "@/lib/constants";

const ActivityLogSchema = new Schema({
  ticket: { type: Schema.Types.ObjectId, ref: "Ticket", required: true },
  actor: { type: Schema.Types.ObjectId, ref: "User" }, // empty = system
  action: { type: String, enum: ACTIONS, required: true },
  details: { type: String, required: true, maxlength: 500 },
  createdAt: { type: Date, default: Date.now },
});
ActivityLogSchema.index({ ticket: 1, createdAt: -1 });

export type IActivityLog = InferSchemaType<typeof ActivityLogSchema>;
export const ActivityLog =
  (mongoose.models.ActivityLog as Model<IActivityLog>) || mongoose.model<IActivityLog>("ActivityLog", ActivityLogSchema);
