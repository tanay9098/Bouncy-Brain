import 'dotenv/config';
import express from 'express';
import http from 'http';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import { connectMongoDB } from './lib/mongoose';
import { initSocketIO } from './lib/socket';

import authRoutes from './routes/auth';
import tasksRoutes from './routes/tasks';
import aiRoutes from './routes/ai';
import habitsRoutes from './routes/habits';
import analyticsRoutes from './routes/analytics';

import deadlineChecker from '../jobs/deadlineChecker';
import { errorHandler } from './middleware/errorHandler';

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json());
app.use(cookieParser());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use('/api/tasks', tasksRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/habits', habitsRoutes);
app.use('/api/analytics', analyticsRoutes);

app.use(errorHandler);

async function start() {
  await connectMongoDB();

  initSocketIO(server);

  // ✅ SIMPLE CRON (NO REDIS)
  setInterval(() => {
    deadlineChecker();
  }, 5 * 60 * 1000);

  server.listen(3001, () => {
    console.log('Server running on port 3001');
  });
}

start();
