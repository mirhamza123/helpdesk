import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
import { PRIORITIES } from "@/lib/constants";

const CategorySchema = new Schema({
  name: { type: String, required: true, unique: true, trim: true, maxlength: 60 },
  description: { type: String, default: "", maxlength: 300 },
  defaultPriority: { type: String, enum: PRIORITIES, default: "Medium" },
});

export type ICategory = InferSchemaType<typeof CategorySchema>;
export const Category =
  (mongoose.models.Category as Model<ICategory>) || mongoose.model<ICategory>("Category", CategorySchema);
