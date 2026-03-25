import 'dotenv/config';
import express from 'express';
import http from 'http';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import { connectMongoDB } from './lib/mongoose';
import { connectRedis } from './lib/redis';
import { initSocketIO } from './lib/socket';

import authRoutes from './routes/auth';
import tasksRoutes from './routes/tasks';
import aiRoutes from './routes/ai';
import focusRoutes from './routes/focus';
import habitsRoutes from './routes/habits';
import flashcardsRoutes from './routes/flashcards';
import analyticsRoutes from './routes/analytics';
import syllabiRoutes from './routes/syllabi';

import { errorHandler } from './middleware/errorHandler';

const app = express();
const httpServer = http.createServer(app);

const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

app.use(
  cors({
    origin: [frontendUrl, 'http://localhost:3000', 'http://localhost:5173'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', ts: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/tasks', tasksRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/focus', focusRoutes);
app.use('/api/habits', habitsRoutes);
app.use('/api/flashcards', flashcardsRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/syllabi', syllabiRoutes);

app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.use(errorHandler);

async function start(): Promise<void> {
  const PORT = parseInt(process.env.PORT || '3001', 10);

  httpServer.listen(PORT, () => {
    console.log(`[Server] Running on http://localhost:${PORT}`);
    console.log(`[Server] Environment: ${process.env.NODE_ENV || 'development'}`);
  });

  try {
    await connectMongoDB();
  } catch (err) {
    console.error('[Startup] MongoDB connection failed:', err);
    process.exit(1);
  }

  try {
    await connectRedis();
  } catch (err) {
    console.warn('[Startup] Redis connection failed:', err);
  }

  try {
    initSocketIO(httpServer);
  } catch (err) {
    console.warn('[Startup] Socket.io initialization failed:', err);
  }

  if (process.env.REDIS_URL && process.env.NODE_ENV !== 'test') {
    try {
      const { startSyllabusWorker } = await import('./workers/syllabus.worker');
      const { startPatternWorker } = await import('./workers/pattern.worker');
      const { startSRWorker } = await import('./workers/sr.worker');
      startSyllabusWorker();
      startPatternWorker();
      startSRWorker();
    } catch (err) {
      console.warn('[Startup] BullMQ workers failed to start:', err);
    }
  }
}

process.on('SIGTERM', () => {
  console.log('[Server] SIGTERM received, shutting down...');
  httpServer.close(() => { process.exit(0); });
});

process.on('SIGINT', () => {
  console.log('[Server] SIGINT received, shutting down...');
  httpServer.close(() => { process.exit(0); });
});

start().catch((err) => {
  console.error('[Startup] Fatal error:', err);
  process.exit(1);
});

export default app;
