const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Task = require('../models/Task');
const jwt = require('jsonwebtoken');
const axios = require('axios');

const { chunkTask } = require('../src/services/aiService');


// ✅ Local ML
const { predictPriority } = require('../ml/priorityModel');

// ─── AUTH MIDDLEWARE ────────────────────────────────────────────────
function auth(req, res, next) {
  const h = req.headers.authorization || '';
  const token = h.replace('Bearer ', '');
  if (!token) return res.status(401).end();

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = payload.id;
    next();
  } catch (e) {
    return res.status(401).end();
  }
}

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

// ─── LIST TASKS ─────────────────────────────────────────────────────
router.get('/', auth, async (req, res) => {
  const tasks = await Task.find({ userId: req.userId }).sort({ dueAt: 1 });
  res.json({ tasks });
});

// ─── GET TASK ───────────────────────────────────────────────────────
router.get('/:id', auth, async (req, res) => {
  if (!isValidObjectId(req.params.id)) {
    return res.status(400).json({ error: 'Invalid task id' });
  }

  const t = await Task.findById(req.params.id);
  res.json({ task: t });
});

// ─── CREATE TASK ────────────────────────────────────────────────────
router.post('/', auth, async (req, res) => {
  const { title, dueAt, estimateMins, dreadScore } = req.body;

  const doc = await Task.create({
    userId: req.userId,
    title,
    dueAt: dueAt ? new Date(dueAt) : null,
    estimateMins,
    dreadScore: dreadScore || 3,
  });

  res.json({ task: doc });
});

// ─── UPDATE TASK ────────────────────────────────────────────────────
router.put('/:id', auth, async (req, res) => {
  if (!isValidObjectId(req.params.id)) {
    return res.status(400).json({ error: 'Invalid task id' });
  }

  const { title, dueAt, estimateMins, dreadScore } = req.body;

  const update = {};
  if (title !== undefined) update.title = title;
  if (dueAt !== undefined) update.dueAt = dueAt ? new Date(dueAt) : null;
  if (estimateMins !== undefined) update.estimateMins = estimateMins;
  if (dreadScore !== undefined) update.dreadScore = dreadScore;

  const task = await Task.findOneAndUpdate(
    { _id: req.params.id, userId: req.userId },
    update,
    { new: true }
  );

  if (!task) return res.status(404).json({ error: 'Task not found' });

  res.json({ task });
});

// ─── COMPLETE TASK ──────────────────────────────────────────────────
router.put('/:id/complete', auth, async (req, res) => {
  if (!isValidObjectId(req.params.id)) {
    return res.status(400).json({ error: 'Invalid task id' });
  }

  await Task.findByIdAndUpdate(req.params.id, {
    completed: true,
    completedAt: new Date(),
  });

  res.json({ ok: true });
});

// ─── AUTO CHUNK TASK ────────────────────────────────────────────────
// router.post('/:id/auto-chunk', auth, async (req, res) => {
//   const task = await Task.findById(req.params.id);
//   if (!task) return res.status(404).json({ error: 'not found' });

//   // Optional ML chunk API
//   if (process.env.ML_CHUNK_URL) {
//     try {
//       const r = await axios.post(process.env.ML_CHUNK_URL, {
//         text: task.title,
//         estimateMins: task.estimateMins,
//       });

//       const subs = r.data.subtasks || r.data.chunks || [];
//       task.subtasks = subs.map((s) => ({ title: s.title || s }));
//       await task.save();

//       return res.json({ task });
//     } catch (e) {
//       console.warn('ml chunk failed', e.message);
//     }
//   }

//   // Fallback chunking
//   const chunks = [
//     { title: task.title + ' — part 1', completed: false },
//     { title: task.title + ' — part 2', completed: false },
//     { title: task.title + ' — part 3', completed: false },
//   ];

//   task.subtasks = chunks;
//   await task.save();

//   res.json({ task });
// });

router.post('/:id/auto-chunk', auth, async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: 'Invalid task id' });
    }

    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ error: 'not found' });

    const steps = await chunkTask(task.title);

    task.subtasks = steps.map(s => ({
      title: s,
      completed: false,
    }));

    await task.save();

    res.json({ task });

  } catch (err) {
    console.error("AI CHUNK ERROR:", err);
    res.status(500).json({ error: "AI failed" });
  }
});
// ─── AI SUGGESTIONS (UPDATED WITH LOCAL ML) ─────────────────────────
router.get('/ai/suggestions', auth, async (req, res) => {
  try {
    const tasks = await Task.find({
      userId: req.userId,
      completed: false,
    }).sort({ dueAt: 1 });

    if (tasks.length === 0) {
      return res.json({ suggestions: [] });
    }

    // ── USER HISTORY ────────────────────────────────────────────────
    const completedTasks = await Task.find({
      userId: req.userId,
      completed: true,
    }).limit(50);

    const completionRate =
      completedTasks.length > 0
        ? completedTasks.length / (completedTasks.length + tasks.length)
        : 0.5;

    const lateCount = completedTasks.filter((ct) => {
      if (!ct.completedAt || !ct.dueAt) return false;
      return new Date(ct.completedAt) > new Date(ct.dueAt);
    }).length;

    const procrastinationRate =
      completedTasks.length > 0
        ? lateCount / completedTasks.length
        : 0.4;

    const suggestions = [];

    // ── LOCAL ML PRIORITY ───────────────────────────────────────────
    const ranked = tasks.map((t) => {
      const deadlineDays = t.dueAt
        ? (new Date(t.dueAt) - new Date()) / (1000 * 60 * 60 * 24)
        : 30;

      const payload = {
        completion_rate: completionRate,
        deadline_days: Math.max(deadlineDays, 0),
        estimated_time: t.estimateMins || 30,
        urgency_self: t.importance || 1,
        historical_procrastination_rate: procrastinationRate,
      };

      const result = predictPriority(payload);

      return {
        taskId: t._id,
        title: t.title,
        priority: result.priority,
        score: result.score,
      };
    });

    ranked.sort((a, b) => b.score - a.score);

    if (ranked.length > 0) {
      suggestions.push({
        id: 'priority_' + Date.now(),
        type: 'priority',
        title: `🎯 Start with "${ranked[0].title}"`,
        description:
          'This task fits your current situation and should be your top priority.',
        taskId: ranked[0].taskId,
        action: 'prioritize',
      });
    }

    // ── QUICK WIN ───────────────────────────────────────────────────
    const quickTask = tasks.find((t) => (t.estimateMins || 30) <= 15);
    if (quickTask) {
      suggestions.push({
        id: 'quick_' + Date.now(),
        type: 'quick-win',
        title: `⚡ Quick win: "${quickTask.title}"`,
        description: 'Finish this quickly to build momentum.',
        taskId: quickTask._id,
        action: 'complete',
      });
    }

    res.json({ suggestions });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to generate suggestions' });
  }
});

 router.post('/brain-dump', auth, async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) return res.status(400).json({ error: 'No text provided' });

    // Simple fallback (no AI yet)
    const lines = text.split(/,|\n/).map(t => t.trim()).filter(Boolean);

    const tasks = [];

    for (let l of lines) {
      const task = await Task.create({
        userId: req.userId,
        title: l,
        estimateMins: 30,
        dreadScore: 3,
      });
      tasks.push(task);
    }

    res.json({ tasks });

  } catch (err) {
    console.error("BRAIN DUMP ERROR:", err);
    res.status(500).json({ error: "Failed to process brain dump" });
  }
});

// ─── WHAT NEXT ──────────────────────────────────────────────────────
router.get('/what-next', auth, async (req, res) => {
  const energyLevel = Math.max(1, Math.min(5, parseInt(req.query.energyLevel || '3', 10)));

  const tasks = await Task.find({
    userId: req.userId,
    completed: false,
  });

  if (!tasks.length) return res.json({ task: null });

  const ranked = tasks.map((t) => {
    const payload = {
      completion_rate: 0.5,
      deadline_days: t.dueAt
        ? (new Date(t.dueAt) - new Date()) / (1000 * 60 * 60 * 24)
        : 30,
      estimated_time: t.estimateMins || 30,
      urgency_self: t.importance || 1,
      historical_procrastination_rate: 0.4,
    };

    return {
      task: t,
      score: predictPriority(payload).score,
    };
  });

  ranked.sort((a, b) => b.score - a.score);

  res.json({ task: ranked[0].task });
});


module.exports = router;
