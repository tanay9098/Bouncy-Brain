import mongoose, { Document, Schema } from 'mongoose';

interface ISubtask {
  _id?: mongoose.Types.ObjectId;
  title: string;
  done: boolean;
}

export interface ITask extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  subtasks: ISubtask[];
  tags: string[];
  dreadScore: number;
  dueDate?: Date;
  estimatedMinutes?: number;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in-progress' | 'completed';
  aiContext?: string;
  createdAt: Date;
}

const subtaskSchema = new Schema({
  title: { type: String, required: true },
  done: { type: Boolean, default: false },
});

const taskSchema = new Schema<ITask>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  description: String,
  subtasks: { type: [subtaskSchema], default: [] },
  tags: { type: [String], default: [] },
  dreadScore: { type: Number, default: 0 },
  dueDate: Date,
  estimatedMinutes: Number,
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  status: { type: String, enum: ['pending', 'in-progress', 'completed'], default: 'pending' },
  aiContext: String,
  createdAt: { type: Date, default: Date.now },
});

export const Task = mongoose.model<ITask>('Task', taskSchema);
