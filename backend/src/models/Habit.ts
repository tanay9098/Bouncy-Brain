import mongoose, { Document, Schema } from 'mongoose';

export interface IHabit extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  frequency: 'daily' | 'weekly';
  streak: number;
  completions: Date[];
  lastCompleted?: Date;
  createdAt: Date;
}

const habitSchema = new Schema<IHabit>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  frequency: { type: String, enum: ['daily', 'weekly'], required: true },
  streak: { type: Number, default: 0 },
  completions: { type: [Date], default: [] },
  lastCompleted: Date,
  createdAt: { type: Date, default: Date.now },
});

export const Habit = mongoose.model<IHabit>('Habit', habitSchema);
