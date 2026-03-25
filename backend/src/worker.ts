import 'dotenv/config';
import { connectMongoDB } from './lib/mongoose';
import { connectRedis } from './lib/redis';
import { startSyllabusWorker } from './workers/syllabus.worker';
import { startPatternWorker } from './workers/pattern.worker';
import { startSRWorker } from './workers/sr.worker';

async function startWorker(): Promise<void> {
  console.log('[Worker] Starting...');
  await connectMongoDB();
  console.log('[Worker] MongoDB connected');
  await connectRedis();
  console.log('[Worker] Redis connected');
  startSyllabusWorker();
  startPatternWorker();
  startSRWorker();
  console.log('[Worker] All BullMQ workers running');
}

process.on('SIGTERM', () => { console.log('[Worker] SIGTERM received'); process.exit(0); });
process.on('SIGINT', () => { console.log('[Worker] SIGINT received'); process.exit(0); });

startWorker().catch((err) => {
  console.error('[Worker] Fatal error:', err);
  process.exit(1);
});
