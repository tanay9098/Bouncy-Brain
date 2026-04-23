import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { authenticate } from '../middleware/auth';
import { chat, healthCheck } from '../controllers/aiController';

const router = Router();

const aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
});

router.get('/health', healthCheck);
router.post('/chat', authenticate, aiLimiter, chat);

export default router;
