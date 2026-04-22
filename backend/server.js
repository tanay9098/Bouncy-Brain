require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const cron = require('node-cron');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/auth');
const taskRoutes = require('./routes/tasks');
const sessionRoutes = require('./routes/sessions');
const pushRoutes = require('./routes/push');

const statsRoutes = require('./routes/stats');

const deadlineChecker = require('./jobs/deadlineChecker');
const priorityRoutes = require("./routes/priority");


const app = express();

// Security headers
app.use(helmet());

// Restrict CORS to known origins
const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173')
  .split(',')
  .map(o => o.trim());

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(bodyParser.json({ limit: '50kb' }));

// connect mongodb
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(()=> console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error', err));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/push', pushRoutes);
app.use('/api/stats', statsRoutes);

app.use("/api/priority", priorityRoutes);


// health
app.get('/ping', (req,res)=> res.json({ ok: true }));

// Root route for platform checks and direct browser visits
app.get('/', (req, res) => {
  res.status(200).json({
    service: 'Bouncy Brain Backend',
    ok: true,
    message: 'API is running. Use /api/* endpoints.',
    health: '/ping',
  });
});

// Schedule cron: run deadline checker every 5 minutes
cron.schedule('*/5 * * * *', async () => {
  try {
    console.log('[cron] running deadline checker');
    await deadlineChecker();
  } catch(err) {
    console.error('[cron] checker error', err);
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, ()=> console.log(`Server running on port ${PORT}`));
