import { Task } from '../models/Task';

export default async function deadlineChecker(): Promise<void> {
  try {
    const now = new Date();
    const windowEnd = new Date(now.getTime() + 60 * 60 * 1000);
    const tasks = await Task.find({
      dueDate: { $gte: now, $lte: windowEnd },
      status: { $ne: 'completed' },
    });
    if (tasks.length > 0) {
      console.log(`[deadlineChecker] ${tasks.length} task(s) due within the next hour`);
    }
  } catch (err) {
    console.error('[deadlineChecker] Error:', err);
  }
}
