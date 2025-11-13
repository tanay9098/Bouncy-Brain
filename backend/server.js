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
const deadlineChecker = require('./jobs/deadlineChecker');

const app = express();
app.use(bodyParser.json());
app.use(cors({ origin: process.env.FRONTEND_ORIGIN || '*' }));

// connect mongodb
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(()=> console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error', err));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/push', pushRoutes);
app.use('/api/google', googleRoutes);

// health
app.get('/api/ping', (req,res)=> res.json({ ok: true }));

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
