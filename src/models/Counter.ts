import mongoose, { Schema, type Model } from "mongoose";

interface ICounter { _id: string; seq: number }
const CounterSchema = new Schema<ICounter>({ _id: String, seq: { type: Number, default: 0 } });
export const Counter = (mongoose.models.Counter as Model<ICounter>) || mongoose.model<ICounter>("Counter", CounterSchema);
