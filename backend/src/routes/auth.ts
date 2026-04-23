import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import { User } from '../models/User';

const router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts, please try again later' },
});

function makeToken(id: string): string {
  return jwt.sign({ userId: id }, process.env.JWT_SECRET!, { expiresIn: '7d' });
}

router.post('/signup', authLimiter, async (req: Request, res: Response): Promise<void> => {
  const { email, password, name } = req.body as { email: string; password: string; name?: string };
  if (!email || !password) { res.status(400).json({ error: 'email and password required' }); return; }
  if (password.length < 8) { res.status(400).json({ error: 'Password must be at least 8 characters' }); return; }
  if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
    res.status(400).json({ error: 'Password must contain at least one letter and one number' }); return;
  }
  const exists = await User.findOne({ email });
  if (exists) { res.status(400).json({ error: 'Email already registered' }); return; }
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({ email, name, passwordHash });
  const token = makeToken(String(user._id));
  res.json({ user: { id: user._id, email: user.email, name: user.name }, token });
});

router.post('/login', authLimiter, async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body as { email: string; password: string };
  if (!email || !password) { res.status(400).json({ error: 'email and password required' }); return; }
  const user = await User.findOne({ email });
  if (!user) { res.status(400).json({ error: 'Invalid credentials' }); return; }
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) { res.status(400).json({ error: 'Invalid credentials' }); return; }
  const token = makeToken(String(user._id));
  res.json({ user: { id: user._id, email: user.email, name: user.name }, token });
});

export default router;
