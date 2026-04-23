import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  listHabits,
  getHabit,
  createHabit,
  updateHabit,
  deleteHabit,
  completeHabit,
} from '../controllers/habitsController';

const router = Router();

router.use(authenticate);
router.get('/', listHabits);
router.post('/', createHabit);
router.get('/:id', getHabit);
router.put('/:id', updateHabit);
router.delete('/:id', deleteHabit);
router.post('/:id/complete', completeHabit);

export default router;
