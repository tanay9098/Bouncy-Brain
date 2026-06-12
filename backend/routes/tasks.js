const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Task = require('../models/Task');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');

const { chunkTask, parseBrainDump } = require('../services/aiService');

// Rate limit AI-powered endpoints: 20 requests per hour per IP
const aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many AI requests, please try again later' },
});


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

// ─── WHAT NEXT ──────────────────────────────────────────────────────
router.get('/what-next', auth, async (req, res) => {
  const energyLevel = parseInt(req.query.energyLevel || '3', 10);

  const tasks = await Task.find({ userId: req.userId, completed: false });
  if (!tasks.length) return res.json({ task: null });

  const completedTasks = await Task.find({ userId: req.userId, completed: true }).limit(50).lean();
  const totalTasks = await Task.countDocuments({ userId: req.userId });
  const completionRate = totalTasks > 0 ? completedTasks.length / totalTasks : 0.5;
  const lateCount = completedTasks.filter((ct) => ct.completedAt && ct.dueAt && new Date(ct.completedAt) > new Date(ct.dueAt)).length;
  const procRate = completedTasks.length > 0 ? lateCount / completedTasks.length : 0.3;

  const ranked = tasks.map((t) => {
    const payload = {
      completion_rate: completionRate,
      deadline_days: t.dueAt ? (new Date(t.dueAt) - new Date()) / (1000 * 60 * 60 * 24) : 30,
      estimated_time: t.estimateMins || 30,
      urgency_self: t.importance || 1,
      historical_procrastination_rate: procRate,
      energy_level: energyLevel,
      dread_score: t.dreadScore || 3,
      title: t.title,
    };
    const result = predictPriority(payload);
    return { task: t, score: result.score, reason: result.reason, category: result.category };
  });

  ranked.sort((a, b) => b.score - a.score);
  const top = ranked[0];

  res.json({ task: top.task, reason: top.reason, category: top.category });
});

// ─── AI SUGGESTIONS ─────────────────────────────────────────────────
router.get('/ai/suggestions', auth, async (req, res) => {
  try {
    const tasks = await Task.find({
      userId: req.userId,
      completed: false,
    }).sort({ dueAt: 1 });

    if (tasks.length === 0) {
      return res.json({ suggestions: [] });
    }

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

    const energyLevel = parseInt(req.query.energyLevel || '3', 10);

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
        energy_level: energyLevel,
        dread_score: t.dreadScore || 3,
        title: t.title,
      };

      const result = predictPriority(payload);

      return {
        taskId: t._id,
        title: t.title,
        priority: result.priority,
        score: result.score,
        reason: result.reason,
        category: result.category,
      };
    });

    ranked.sort((a, b) => b.score - a.score);

    if (ranked.length > 0) {
      const top = ranked[0];
      suggestions.push({
        id: 'priority_' + Date.now(),
        type: 'priority',
        title: `🎯 Start with "${top.title}"`,
        description: top.reason || 'This task fits your current situation and should be your top priority.',
        taskId: top.taskId,
        action: 'prioritize',
        category: top.category,
      });
    }

    // Energy-aware nudge: high-dread tasks at high energy
    if (energyLevel >= 4) {
      const dreadyTask = tasks.filter((t) => (t.dreadScore || 3) >= 4).sort((a, b) => (b.dreadScore || 3) - (a.dreadScore || 3))[0];
      if (dreadyTask && dreadyTask._id.toString() !== (ranked[0]?.taskId?.toString())) {
        suggestions.push({
          id: 'energy_' + Date.now(),
          type: 'nudge',
          title: `💪 High energy: tackle "${dreadyTask.title}"`,
          description: 'Your energy is high — perfect time to face this challenging task before it drains you.',
          taskId: dreadyTask._id,
          action: 'prioritize',
          category: 'high-dread',
        });
      }
    }

    const quickTask = tasks.find((t) => (t.estimateMins || 30) <= 15);
    if (quickTask) {
      suggestions.push({
        id: 'quick_' + Date.now(),
        type: 'quick-win',
        title: `⚡ Quick win: "${quickTask.title}"`,
        description: 'Finish this in ~15 minutes to build momentum.',
        taskId: quickTask._id,
        action: 'complete',
      });
    }

    // Procrastination alert
    if (procrastinationRate > 0.5 && ranked.length > 0) {
      suggestions.push({
        id: 'proc_' + Date.now(),
        type: 'nudge',
        title: '⏰ Pattern detected',
        description: `You complete ${Math.round(procrastinationRate * 100)}% of tasks late. Try the 2-minute rule: if it takes less than 2 minutes, do it now.`,
        action: 'none',
      });
    }

    res.json({ suggestions });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to generate suggestions' });
  }
});

// ─── BRAIN DUMP ──────────────────────────────────────────────────────
router.post('/brain-dump', auth, aiLimiter, async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || typeof text !== 'string') return res.status(400).json({ error: 'No text provided' });
    if (text.length > 5000) return res.status(400).json({ error: 'Brain dump text must be 5000 characters or fewer' });

    const suggestions = await parseBrainDump(text);

    if (!suggestions.length) {
      return res.status(422).json({ error: 'No actionable tasks found' });
    }

    const tasks = [];

    for (const item of suggestions) {
      const task = await Task.create({
        userId: req.userId,
        title: item.title,
        dueAt: item.dueAt ? new Date(item.dueAt) : null,
        estimateMins: item.estimateMins ?? 30,
        dreadScore: item.dreadScore ?? 3,
        importance: item.importance ?? 3,
      });

      tasks.push(task);
    }

    res.json({ tasks, source: process.env.OPENAI_API_KEY ? 'openai' : 'fallback' });

  } catch (err) {
    console.error("BRAIN DUMP ERROR:", err);
    res.status(500).json({ error: "Failed to process brain dump" });
  }
});

// ─── GET TASK ───────────────────────────────────────────────────────
router.get('/:id', auth, async (req, res) => {
  if (!isValidObjectId(req.params.id)) {
    return res.status(400).json({ error: 'Invalid task id' });
  }

  const t = await Task.findOne({ _id: req.params.id, userId: req.userId });
  if (!t) return res.status(404).json({ error: 'Task not found' });
  res.json({ task: t });
});

// ─── CREATE TASK ────────────────────────────────────────────────────
router.post('/', auth, async (req, res) => {
  const { title, dueAt, estimateMins, dreadScore } = req.body;

  if (!title || typeof title !== 'string' || title.trim().length === 0) {
    return res.status(400).json({ error: 'Task title is required' });
  }
  if (title.length > 500) {
    return res.status(400).json({ error: 'Task title must be 500 characters or fewer' });
  }

  const doc = await Task.create({
    userId: req.userId,
    title: title.trim(),
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

  if (title !== undefined) {
    if (typeof title !== 'string' || title.trim().length === 0) {
      return res.status(400).json({ error: 'Task title cannot be empty' });
    }
    if (title.length > 500) {
      return res.status(400).json({ error: 'Task title must be 500 characters or fewer' });
    }
  }

  const update = {};
  if (title !== undefined) update.title = title.trim();
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

  const task = await Task.findOneAndUpdate(
    { _id: req.params.id, userId: req.userId },
    { completed: true, completedAt: new Date() },
    { new: true }
  );

  if (!task) return res.status(404).json({ error: 'Task not found' });

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

router.post('/:id/auto-chunk', auth, aiLimiter, async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: 'Invalid task id' });
    }

    const task = await Task.findOne({ _id: req.params.id, userId: req.userId });
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


module.exports = router;
