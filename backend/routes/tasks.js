// const express = require('express');
// const router = express.Router();
// const Task = require('../models/Task');
// const jwt = require('jsonwebtoken');
// const axios = require('axios');

// function auth(req,res,next){
//   const h = req.headers.authorization || '';
//   const token = h.replace('Bearer ','');
//   if(!token) return res.status(401).end();
//   try { const payload = jwt.verify(token, process.env.JWT_SECRET); req.userId = payload.id; next(); } catch(e){ return res.status(401).end(); }
// }

// // list tasks (optionally ?top=3)
// router.get('/', auth, async (req,res)=>{
//   const tasks = await Task.find({ userId: req.userId }).sort({ dueAt: 1 });
//   res.json({ tasks });
// });

// // UPDATE task (edit title, dueAt, estimate)
// router.put('/:id', auth, async (req, res) => {
//   const { title, dueAt, estimateMins } = req.body;

//   const task = await Task.findOneAndUpdate(
//     { _id: req.params.id, userId: req.userId },
//     {
//       title,
//       dueAt: dueAt ? new Date(dueAt) : null,
//       estimateMins
//     },
//     { new: true }
//   );

//   if (!task) return res.status(404).json({ error: 'Task not found' });
//   res.json({ task });
// });


// router.post('/', auth, async (req,res)=>{
//   const { title, dueAt, estimateMins } = req.body;
//   const doc = await Task.create({ userId: req.userId, title, dueAt: dueAt ? new Date(dueAt) : null, estimateMins });
//   res.json({ task: doc });
// });

// router.put('/:id/complete', auth, async (req,res)=>{
//   await Task.findByIdAndUpdate(req.params.id, { 
//     completed: true ,
//     completedAt: new Date()


//   });
//   res.json({ ok: true });
// });
// router.post('/:id/auto-chunk', auth, async (req,res)=>{
//   const task = await Task.findById(req.params.id);
//   if(!task) return res.status(404).json({ error: 'not found' });

//   // If ML_CHUNK_URL provided, call it
//   if(process.env.ML_CHUNK_URL){
//     try {
//       const r = await axios.post(process.env.ML_CHUNK_URL, { text: task.title, estimateMins: task.estimateMins });
//       // expected: r.data.subtasks = [{title:...}, ...]
//       const subs = r.data.subtasks || r.data.chunks || [];
//       task.subtasks = subs.map(s => ({ title: s.title || s }));
//       await task.save();
//       return res.json({ task });
//     } catch(e){
//       console.warn('ml chunk failed', e.message);
//     }
//   }

//   // fallback: naive split into 3 parts
//   const chunks = [
//     { title: task.title + ' — part 1' },
//     { title: task.title + ' — part 2' },
//     { title: task.title + ' — part 3' }
//   ];
//   task.subtasks = chunks.map(c => ({ title: c.title, completed: false }));
//   await task.save();
//   res.json({ task });

// router.get('/:id', auth, async (req,res)=>{
//   const t = await Task.findById(req.params.id);
//   res.json({ task: t });
// });

// // auto-chunk placeholder: ideally call ML_CHUNK_URL

// });

// module.exports = router;


const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const jwt = require('jsonwebtoken');
const axios = require('axios');

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

// ─── List tasks (optionally ?top=3) ─────────────────────────────────
router.get('/', auth, async (req, res) => {
  const tasks = await Task.find({ userId: req.userId }).sort({ dueAt: 1 });
  res.json({ tasks });
});

// ─── Get single task ────────────────────────────────────────────────
router.get('/:id', auth, async (req, res) => {
  const t = await Task.findById(req.params.id);
  res.json({ task: t });
});

// ─── Create task ────────────────────────────────────────────────────
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

// ─── Update task ────────────────────────────────────────────────────
router.put('/:id', auth, async (req, res) => {
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

// ─── Complete task ──────────────────────────────────────────────────
router.put('/:id/complete', auth, async (req, res) => {
  await Task.findByIdAndUpdate(req.params.id, {
    completed: true,
    completedAt: new Date(),
  });
  res.json({ ok: true });
});

// ─── Auto-chunk a task ──────────────────────────────────────────────
router.post('/:id/auto-chunk', auth, async (req, res) => {
  const task = await Task.findById(req.params.id);
  if (!task) return res.status(404).json({ error: 'not found' });

  // If ML_CHUNK_URL provided, call it
  if (process.env.ML_CHUNK_URL) {
    try {
      const r = await axios.post(process.env.ML_CHUNK_URL, {
        text: task.title,
        estimateMins: task.estimateMins,
      });
      const subs = r.data.subtasks || r.data.chunks || [];
      task.subtasks = subs.map((s) => ({ title: s.title || s }));
      await task.save();
      return res.json({ task });
    } catch (e) {
      console.warn('ml chunk failed', e.message);
    }
  }

  // Fallback: naive split into 3 parts
  const chunks = [
    { title: task.title + ' — part 1' },
    { title: task.title + ' — part 2' },
    { title: task.title + ' — part 3' },
  ];
  task.subtasks = chunks.map((c) => ({ title: c.title, completed: false }));
  await task.save();
  res.json({ task });
});

// ─── AI Suggestions ─────────────────────────────────────────────────
// Returns smart suggestions for incomplete tasks based on ML analysis
router.get('/ai/suggestions', auth, async (req, res) => {
  try {
    const tasks = await Task.find({
      userId: req.userId,
      completed: false,
    }).sort({ dueAt: 1 });

    if (tasks.length === 0) {
      return res.json({ suggestions: [] });
    }

    // Gather user history for context
    const completedTasks = await Task.find({
      userId: req.userId,
      completed: true,
    })
      .sort({ completedAt: -1 })
      .limit(50);

    const completionRate =
      completedTasks.length > 0
        ? completedTasks.length / (completedTasks.length + tasks.length)
        : 0.5;

    // Compute late-completion (procrastination) rate
    const lateCount = completedTasks.filter((ct) => {
      if (!ct.completedAt || !ct.dueAt) return false;
      return new Date(ct.completedAt) > new Date(ct.dueAt);
    }).length;
    const procrastinationRate =
      completedTasks.length > 0
        ? lateCount / completedTasks.length
        : 0.4;

    const suggestions = [];

    // ── Suggestion 1: Task Priority Ranking ──────────────────────────
    // Try to call ML service for smart prioritization
    if (process.env.ML_PRIORITY_URL && tasks.length >= 2) {
      try {
        const ranked = [];
        for (const t of tasks) {
          const deadlineDays = t.dueAt
            ? (new Date(t.dueAt) - new Date()) / (1000 * 60 * 60 * 24)
            : 30;

          const payload = {
            completion_rate: completionRate,
            deadline_days: Math.max(deadlineDays, 0),
            estimated_time: t.estimateMins || 30,
            difficulty: Math.min(Math.ceil((t.estimateMins || 30) / 20), 5),
            urgency_self: t.importance || 1,
            self_reported_procrastination: Math.round(procrastinationRate * 5),
            energy_mismatch: 1,
            historical_procrastination_rate: procrastinationRate,
          };

          const r = await axios.post(process.env.ML_PRIORITY_URL, payload, {
            timeout: 3000,
          });

          ranked.push({
            taskId: t._id,
            title: t.title,
            priority: r.data.priority || 'Medium',
            score: r.data.score || 0.5,
            recommendation: r.data.recommendation || 'schedule_soon',
          });
        }

        // Sort by score descending (highest priority first)
        ranked.sort((a, b) => (b.score || 0) - (a.score || 0));

        if (ranked.length > 0 && ranked[0].priority === 'High') {
          suggestions.push({
            id: 'priority_' + Date.now(),
            type: 'priority',
            title: '🎯 Start with "' + ranked[0].title + '"',
            description:
              'Based on your deadlines, task complexity, and completion patterns, this task should be your top priority right now.',
            taskId: ranked[0].taskId,
            priority: ranked[0].priority,
            score: ranked[0].score,
            action: 'prioritize',
            data: { rankedTasks: ranked },
          });
        }
      } catch (e) {
        console.warn('[ai-suggestions] ML priority call failed:', e.message);
      }
    }

    // ── Suggestion 2: Break Down Long Tasks ──────────────────────────
    const longTasks = tasks.filter(
      (t) => (t.estimateMins || 0) >= 60 && (!t.subtasks || t.subtasks.length === 0)
    );
    if (longTasks.length > 0) {
      const longest = longTasks.reduce((a, b) =>
        (a.estimateMins || 0) > (b.estimateMins || 0) ? a : b
      );
      suggestions.push({
        id: 'chunk_' + Date.now(),
        type: 'chunk',
        title: '🧩 Break down "' + longest.title + '"',
        description:
          'This task is estimated at ' +
          longest.estimateMins +
          ' minutes. Breaking it into smaller chunks can help maintain focus and reduce overwhelm.',
        taskId: longest._id,
        action: 'auto-chunk',
      });
    }

    // ── Suggestion 3: Deadline Alert ─────────────────────────────────
    const urgentTasks = tasks.filter((t) => {
      if (!t.dueAt) return false;
      const hoursLeft = (new Date(t.dueAt) - new Date()) / (1000 * 60 * 60);
      return hoursLeft > 0 && hoursLeft <= 24;
    });
    if (urgentTasks.length > 0) {
      const mostUrgent = urgentTasks[0]; // already sorted by dueAt
      const hoursLeft = Math.round(
        (new Date(mostUrgent.dueAt) - new Date()) / (1000 * 60 * 60)
      );
      suggestions.push({
        id: 'deadline_' + Date.now(),
        type: 'deadline',
        title: '⏰ "' + mostUrgent.title + '" is due in ~' + hoursLeft + 'h',
        description:
          'This task has an approaching deadline. Consider starting it now or scheduling a focus session.',
        taskId: mostUrgent._id,
        action: 'focus',
      });
    }

    // ── Suggestion 4: Quick Win ──────────────────────────────────────
    const quickTasks = tasks.filter(
      (t) => (t.estimateMins || 30) <= 15 && (!t.subtasks || t.subtasks.length === 0)
    );
    if (quickTasks.length > 0) {
      suggestions.push({
        id: 'quickwin_' + Date.now(),
        type: 'quick-win',
        title: '⚡ Quick win: "' + quickTasks[0].title + '"',
        description:
          'This task only takes ~' +
          (quickTasks[0].estimateMins || 15) +
          ' minutes. Completing a small task can build momentum for bigger ones.',
        taskId: quickTasks[0]._id,
        action: 'complete',
      });
    }

    // ── Suggestion 5: Procrastination Nudge ──────────────────────────
    if (procrastinationRate > 0.5 && tasks.length > 0) {
      suggestions.push({
        id: 'procrastination_' + Date.now(),
        type: 'nudge',
        title: "💪 You've got this!",
        description:
          'You tend to complete tasks close to their deadline. Try picking one task right now and working on it for just 10 minutes — starting is the hardest part.',
        action: 'encourage',
      });
    }

    // ── Fallback: If no ML and no contextual suggestions ─────────────
    if (suggestions.length === 0 && tasks.length > 0) {
      suggestions.push({
        id: 'default_' + Date.now(),
        type: 'priority',
        title: '📋 Try "' + tasks[0].title + '" first',
        description:
          'This is your earliest task. Start here and use Auto-chunk if it feels too big.',
        taskId: tasks[0]._id,
        action: 'prioritize',
      });
    }

    res.json({ suggestions });
  } catch (err) {
    console.error('[ai-suggestions] error:', err.message);
    res.status(500).json({ error: 'Failed to generate suggestions' });
  }
});

// ─── Accept an AI suggestion ────────────────────────────────────────
router.post('/ai/suggestions/:suggestionId/accept', auth, async (req, res) => {
  const { type, taskId, data } = req.body;

  try {
    switch (type) {
      case 'priority': {
        // If we have ranked tasks data, update their aiPriority in DB
        if (data?.rankedTasks) {
          for (const ranked of data.rankedTasks) {
            await Task.findByIdAndUpdate(ranked.taskId, {
              aiPriority: ranked.priority,
            });
          }
        } else if (taskId) {
          await Task.findByIdAndUpdate(taskId, { aiPriority: 'High' });
        }
        break;
      }
      case 'chunk': {
        // Trigger auto-chunk on the task
        if (taskId) {
          const task = await Task.findById(taskId);
          if (task && (!task.subtasks || task.subtasks.length === 0)) {
            // Fallback chunking (same logic as auto-chunk endpoint)
            if (process.env.ML_CHUNK_URL) {
              try {
                const r = await axios.post(process.env.ML_CHUNK_URL, {
                  text: task.title,
                  estimateMins: task.estimateMins,
                });
                const subs = r.data.subtasks || r.data.chunks || [];
                task.subtasks = subs.map((s) => ({ title: s.title || s }));
                await task.save();
              } catch {
                const chunks = [
                  { title: task.title + ' — part 1', completed: false },
                  { title: task.title + ' — part 2', completed: false },
                  { title: task.title + ' — part 3', completed: false },
                ];
                task.subtasks = chunks;
                await task.save();
              }
            } else {
              const chunks = [
                { title: task.title + ' — part 1', completed: false },
                { title: task.title + ' — part 2', completed: false },
                { title: task.title + ' — part 3', completed: false },
              ];
              task.subtasks = chunks;
              await task.save();
            }
          }
        }
        break;
      }
      case 'deadline':
      case 'quick-win':
      case 'nudge':
      default:
        // These are informational — acceptance is just an acknowledgment
        break;
    }

    res.json({ ok: true, accepted: true });
  } catch (err) {
    console.error('[ai-suggestions] accept error:', err.message);
    res.status(500).json({ error: 'Failed to accept suggestion' });
  }
});

// ─── Reject/dismiss an AI suggestion ────────────────────────────────
router.post('/ai/suggestions/:suggestionId/reject', auth, async (req, res) => {
  res.json({ ok: true, dismissed: true });
});

// ─── Brain Dump → structured tasks ──────────────────────────────────
// Phase 1: Claude API with fallback to simple line parsing
router.post('/brain-dump', auth, async (req, res) => {
  const { text } = req.body;
  if (!text || !text.trim()) return res.status(400).json({ error: 'text required' });

  // Try Claude API via HTTP
  if (process.env.CLAUDE_API_KEY) {
    try {
      const response = await axios.post(
        'https://api.anthropic.com/v1/messages',
        {
          model: 'claude-sonnet-4-6',
          max_tokens: 1024,
          messages: [{
            role: 'user',
            content: `You are an ADHD productivity assistant. Parse this brain dump into structured tasks. Return ONLY a valid JSON array, no other text.

Brain dump: "${text.slice(0, 2000)}"

Return a JSON array like:
[{"title":"task name","estimateMins":30,"dueAt":null,"dreadScore":3}]

Rules:
- Extract up to 8 distinct actionable tasks
- estimateMins: realistic minutes (5-120)
- dreadScore: 1=easy/fun, 5=dreaded/avoided
- dueAt: ISO date string if mentioned, null otherwise
- Keep titles concise and actionable`
          }]
        },
        {
          headers: {
            'x-api-key': process.env.CLAUDE_API_KEY,
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json',
          },
          timeout: 15000,
        }
      );

      const content = response.data.content?.[0]?.text || '';
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        const tasks = [];
        for (const t of parsed.slice(0, 8)) {
          const doc = await Task.create({
            userId: req.userId,
            title: t.title,
            estimateMins: t.estimateMins || 30,
            dueAt: t.dueAt ? new Date(t.dueAt) : null,
            dreadScore: t.dreadScore || 3,
          });
          tasks.push(doc);
        }
        return res.json({ tasks, source: 'claude' });
      }
    } catch (e) {
      console.warn('[brain-dump] Claude API failed:', e.message);
    }
  }

  // Fallback: split by newlines / sentences
  const lines = text
    .split(/[\n.!?]+/)
    .map((l) => l.trim())
    .filter((l) => l.length > 3 && l.length < 200);

  const tasks = [];
  for (const line of lines.slice(0, 8)) {
    const doc = await Task.create({
      userId: req.userId,
      title: line,
      estimateMins: 30,
      dreadScore: 3,
    });
    tasks.push(doc);
  }
  res.json({ tasks, source: 'fallback' });
});

// ─── What Next — rule-based task recommendation (Phase 1) ────────────
router.get('/what-next', auth, async (req, res) => {
  const energyLevel = Math.max(1, Math.min(5, parseInt(req.query.energyLevel || '3', 10)));
  const tasks = await Task.find({ userId: req.userId, completed: false }).sort({ dueAt: 1 });
  if (!tasks.length) return res.json({ task: null });

  const now = new Date();

  function scoreTask(t) {
    // Urgency: exponential decay over 48h window
    const hoursLeft = t.dueAt ? (new Date(t.dueAt) - now) / 3600000 : 168;
    const urgency = t.dueAt ? Math.exp(-Math.max(hoursLeft, 0) / 48) + 0.1 : 0.1;

    // Energy match: task difficulty (by estimate) vs user energy
    const taskDiff = Math.min((t.estimateMins || 30) / 120, 1);
    const userE = energyLevel / 5;
    const energyMatch = 1 - Math.abs(taskDiff - userE) * 0.5;

    // Dread inverse: prefer lower-dread tasks on lower energy days
    const dreadInverse = 1 - ((t.dreadScore || 3) - 1) / 8;

    // Time fit: short tasks score higher (easier to start)
    const timeFit = (t.estimateMins || 30) <= 45 ? 1.2 : 0.9;

    // Importance boost
    const importanceBoost = 1 + (t.importance || 1) * 0.08;

    return urgency * energyMatch * dreadInverse * timeFit * importanceBoost;
  }

  const scored = tasks.map((t) => ({ task: t, score: scoreTask(t) }));
  scored.sort((a, b) => b.score - a.score);
  res.json({ task: scored[0].task, score: scored[0].score });
});

module.exports = router;
