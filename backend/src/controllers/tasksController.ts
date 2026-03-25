import { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import { Task } from '../models/Task';
import { chunkTask } from '../services/ai.service';

export async function listTasks(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = new Types.ObjectId(req.user!.userId);
    const { status, priority, tag, page = '1', limit = '20' } = req.query as Record<string, string>;
    const filter: Record<string, unknown> = { userId };
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (tag) filter.tags = tag;
    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, parseInt(limit, 10));
    const skip = (pageNum - 1) * limitNum;
    const [tasks, total] = await Promise.all([Task.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limitNum).lean(), Task.countDocuments(filter)]);
    res.json({ tasks, total, page: pageNum, limit: limitNum });
  } catch (err) { next(err); }
}

export async function getTask(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = new Types.ObjectId(req.user!.userId);
    const { id } = req.params as Record<string, string>;
    const task = await Task.findOne({ _id: new Types.ObjectId(id), userId }).lean();
    if (!task) { res.status(404).json({ error: 'Task not found' }); return; }
    res.json({ task });
  } catch (err) { next(err); }
}

export async function createTask(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = new Types.ObjectId(req.user!.userId);
    const { title, description, subtasks, tags, dreadScore, dueDate, estimatedMinutes, priority, status } = req.body;
    const task = await Task.create({ userId, title, description, subtasks: subtasks || [], tags: tags || [], dreadScore: dreadScore ?? 0, dueDate: dueDate ? new Date(dueDate) : undefined, estimatedMinutes, priority: priority || 'medium', status: status || 'pending' });
    res.status(201).json({ task });
  } catch (err) { next(err); }
}

export async function updateTask(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = new Types.ObjectId(req.user!.userId);
    const { id } = req.params as Record<string, string>;
    const task = await Task.findOneAndUpdate({ _id: new Types.ObjectId(id), userId }, { $set: req.body }, { new: true, runValidators: true });
    if (!task) { res.status(404).json({ error: 'Task not found' }); return; }
    res.json({ task });
  } catch (err) { next(err); }
}

export async function deleteTask(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = new Types.ObjectId(req.user!.userId);
    const { id } = req.params as Record<string, string>;
    const task = await Task.findOneAndDelete({ _id: new Types.ObjectId(id), userId });
    if (!task) { res.status(404).json({ error: 'Task not found' }); return; }
    res.json({ message: 'Task deleted' });
  } catch (err) { next(err); }
}

export async function updateSubtask(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = new Types.ObjectId(req.user!.userId);
    const { id, subtaskId } = req.params as Record<string, string>;
    const { done } = req.body as { done: boolean };
    const task = await Task.findOneAndUpdate({ _id: new Types.ObjectId(id), userId, 'subtasks._id': new Types.ObjectId(subtaskId) }, { $set: { 'subtasks.$.done': done } }, { new: true });
    if (!task) { res.status(404).json({ error: 'Task or subtask not found' }); return; }
    res.json({ task });
  } catch (err) { next(err); }
}

export async function aiChunkTask(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = new Types.ObjectId(req.user!.userId);
    const { id } = req.params as Record<string, string>;
    const task = await Task.findOne({ _id: new Types.ObjectId(id), userId });
    if (!task) { res.status(404).json({ error: 'Task not found' }); return; }
    const chunks = await chunkTask(task.title, task.description, task.estimatedMinutes);
    const subtasks = chunks.map((c) => ({ title: c.title, done: false }));
    task.subtasks = subtasks;
    task.aiContext = `AI chunked into ${subtasks.length} subtasks on ${new Date().toISOString()}`;
    await task.save();
    res.json({ task, chunks });
  } catch (err) { next(err); }
}
