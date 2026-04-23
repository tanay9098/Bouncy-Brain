import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

declare global {
  namespace Express {
    interface Request {
      user?: { userId: string };
    }
  }
}

export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const h = req.headers.authorization || '';
  const token = h.replace('Bearer ', '');
  if (!token) { res.status(401).json({ error: 'Unauthorized' }); return; }
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
    req.user = { userId: payload.userId };
    next();
  } catch {
    res.status(401).json({ error: 'Unauthorized' });
  }
}
