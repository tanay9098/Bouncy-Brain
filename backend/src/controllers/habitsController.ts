import { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import { Habit } from '../models/Habit';

export async function listHabits(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = new Types.ObjectId(req.user!.userId);
    const { frequency } = req.query as { frequency?: string };
    const filter: Record<string, unknown> = { userId };
    if (frequency) filter.frequency = frequency;
    const habits = await Habit.find(filter).sort({ createdAt: -1 }).lean();
    res.json({ habits });
  } catch (err) { next(err); }
}

export async function getHabit(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = new Types.ObjectId(req.user!.userId);
    const { id } = req.params as Record<string, string>;
    const habit = await Habit.findOne({ _id: new Types.ObjectId(id), userId }).lean();
    if (!habit) { res.status(404).json({ error: 'Habit not found' }); return; }
    res.json({ habit });
  } catch (err) { next(err); }
}

export async function createHabit(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = new Types.ObjectId(req.user!.userId);
    const { name, frequency } = req.body as { name: string; frequency: 'daily' | 'weekly' };
    const habit = await Habit.create({ userId, name, frequency });
    res.status(201).json({ habit });
  } catch (err) { next(err); }
}

export async function updateHabit(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = new Types.ObjectId(req.user!.userId);
    const { id } = req.params as Record<string, string>;
    const updates = req.body;
    delete updates.streak; delete updates.completions; delete updates.lastCompleted;
    const habit = await Habit.findOneAndUpdate({ _id: new Types.ObjectId(id), userId }, { $set: updates }, { new: true, runValidators: true });
    if (!habit) { res.status(404).json({ error: 'Habit not found' }); return; }
    res.json({ habit });
  } catch (err) { next(err); }
}

export async function deleteHabit(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = new Types.ObjectId(req.user!.userId);
    const { id } = req.params as Record<string, string>;
    const habit = await Habit.findOneAndDelete({ _id: new Types.ObjectId(id), userId });
    if (!habit) { res.status(404).json({ error: 'Habit not found' }); return; }
    res.json({ message: 'Habit deleted' });
  } catch (err) { next(err); }
}

export async function completeHabit(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = new Types.ObjectId(req.user!.userId);
    const { id } = req.params as Record<string, string>;
    const habit = await Habit.findOne({ _id: new Types.ObjectId(id), userId });
    if (!habit) { res.status(404).json({ error: 'Habit not found' }); return; }
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const alreadyDone = habit.completions.some((d) => { const cd = new Date(d); return cd.getFullYear() === today.getFullYear() && cd.getMonth() === today.getMonth() && cd.getDate() === today.getDate(); });
    if (alreadyDone) { res.status(409).json({ error: 'Already completed today' }); return; }
    if (habit.lastCompleted) {
      const lastDate = new Date(habit.lastCompleted);
      const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
      const isConsecutive = habit.frequency === 'daily' ? lastDate >= yesterday : lastDate >= new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      habit.streak = isConsecutive ? habit.streak + 1 : 1;
    } else { habit.streak = 1; }
    habit.lastCompleted = now;
    habit.completions.push(now);
    await habit.save();
    res.json({ habit, streak: habit.streak });
  } catch (err) { next(err); }
}
