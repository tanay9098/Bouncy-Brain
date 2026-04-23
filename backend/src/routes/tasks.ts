import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  listTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
  updateSubtask,
  aiChunkTask,
} from '../controllers/tasksController';

const router = Router();

router.use(authenticate);
router.get('/', listTasks);
router.post('/', createTask);
router.get('/:id', getTask);
router.put('/:id', updateTask);
router.delete('/:id', deleteTask);
router.put('/:id/subtasks/:subtaskId', updateSubtask);
router.post('/:id/chunk', aiChunkTask);

export default router;
