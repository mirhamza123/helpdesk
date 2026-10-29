import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
import { PRIORITIES, STATUSES } from "@/lib/constants";

const TicketSchema = new Schema(
  {
    ticketNumber: { type: String, required: true, unique: true },
    title: { type: String, required: true, trim: true, maxlength: 150 },
    description: { type: String, required: true, maxlength: 5000 },
    category: { type: Schema.Types.ObjectId, ref: "Category", required: true, index: true },
    priority: { type: String, enum: PRIORITIES, required: true, index: true },
    status: { type: String, enum: STATUSES, default: "Open", index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    assignedAgent: { type: Schema.Types.ObjectId, ref: "User", index: true },
    attachments: { type: [String], default: [] },
    responseDueDate: { type: Date, required: true },
    resolutionDueDate: { type: Date, required: true },
    firstResponseAt: { type: Date },
    resolvedAt: { type: Date },
    closedAt: { type: Date },
    slaBreached: { type: Boolean, default: false, index: true },
  },
  { timestamps: true },
);
TicketSchema.index({ createdAt: -1 });
TicketSchema.index({ status: 1, resolvedAt: 1 });

export type ITicket = InferSchemaType<typeof TicketSchema>;
export const Ticket = (mongoose.models.Ticket as Model<ITicket>) || mongoose.model<ITicket>("Ticket", TicketSchema);
