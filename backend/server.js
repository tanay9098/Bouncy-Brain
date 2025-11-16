require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const cron = require('node-cron');

const authRoutes = require('./routes/auth');
const taskRoutes = require('./routes/tasks');
const sessionRoutes = require('./routes/sessions');
const pushRoutes = require('./routes/push');
const googleRoutes = require('./routes/google');
const statsRoutes = require('./routes/stats');

const deadlineChecker = require('./jobs/deadlineChecker');

const app = express();
app.use(bodyParser.json());
app.use(cors({
  origin: 'http://localhost:5173', // Allow requests from your frontend origin
  credentials: true, // Allow sending and receiving cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Specify allowed methods
  allowedHeaders: ['Content-Type', 'Authorization'], // Specify allowed headers
}));

// connect mongodb
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(()=> console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error', err));

// API routes
app.use('/auth', authRoutes);
app.use('/tasks', taskRoutes);
app.use('/sessions', sessionRoutes);
app.use('/push', pushRoutes);
app.use('/google', googleRoutes);
app.use('/stats', statsRoutes);


// health
app.get('/ping', (req,res)=> res.json({ ok: true }));

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
