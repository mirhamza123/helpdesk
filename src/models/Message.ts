import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const MessageSchema = new Schema(
  {
    ticket: { type: Schema.Types.ObjectId, ref: "Ticket", required: true },
    author: { type: Schema.Types.ObjectId, ref: "User", required: true },
    body: { type: String, required: true, maxlength: 5000 },
    attachments: { type: [String], default: [] },
    internal: { type: Boolean, default: false },
  },
  { timestamps: true },
);
MessageSchema.index({ ticket: 1, createdAt: 1 });

export type IMessage = InferSchemaType<typeof MessageSchema>;
export const Message = (mongoose.models.Message as Model<IMessage>) || mongoose.model<IMessage>("Message", MessageSchema);
