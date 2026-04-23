import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { Task } from '../models/Task';

const router = Router();

router.use(authenticate);

router.get('/daily', async (req: Request, res: Response): Promise<void> => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const tasks = await Task.find({ userId: req.user!.userId, status: 'completed' });
  res.json({ tasksCompleted: tasks.length });
});

router.get('/weekly', async (req: Request, res: Response): Promise<void> => {
  const start = new Date();
  start.setDate(start.getDate() - 6);
  start.setHours(0, 0, 0, 0);
  const tasks = await Task.find({ userId: req.user!.userId, status: 'completed', createdAt: { $gte: start } });
  res.json({ tasks });
});

router.get('/monthly', async (req: Request, res: Response): Promise<void> => {
  const start = new Date();
  start.setDate(start.getDate() - 29);
  start.setHours(0, 0, 0, 0);
  const tasks = await Task.find({ userId: req.user!.userId, status: 'completed', createdAt: { $gte: start } });
  res.json({ tasks });
});

export default router;
