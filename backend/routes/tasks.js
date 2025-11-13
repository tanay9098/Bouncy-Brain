const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const jwt = require('jsonwebtoken');
const axios = require('axios');

function auth(req,res,next){
  const h = req.headers.authorization || '';
  const token = h.replace('Bearer ','');
  if(!token) return res.status(401).end();
  try { const payload = jwt.verify(token, process.env.JWT_SECRET); req.userId = payload.id; next(); } catch(e){ return res.status(401).end(); }
}

// list tasks (optionally ?top=3)
router.get('/', auth, async (req,res)=>{
  const tasks = await Task.find({ userId: req.userId }).sort({ dueAt: 1 });
  res.json({ tasks });
});

router.post('/', auth, async (req,res)=>{
  const { title, dueAt, estimateMins } = req.body;
  const doc = await Task.create({ userId: req.userId, title, dueAt: dueAt ? new Date(dueAt) : null, estimateMins });
  res.json({ task: doc });
});

router.put('/:id/complete', auth, async (req,res)=>{
  await Task.findByIdAndUpdate(req.params.id, { completed: true });
  res.json({ ok: true });
});

router.get('/:id', auth, async (req,res)=>{
  const t = await Task.findById(req.params.id);
  res.json({ task: t });
});

// auto-chunk placeholder: ideally call ML_CHUNK_URL
router.post('/:id/auto-chunk', auth, async (req,res)=>{
  const task = await Task.findById(req.params.id);
  if(!task) return res.status(404).json({ error: 'not found' });

  // If ML_CHUNK_URL provided, call it
  if(process.env.ML_CHUNK_URL){
    try {
      const r = await axios.post(process.env.ML_CHUNK_URL, { text: task.title, estimateMins: task.estimateMins });
      // expected: r.data.subtasks = [{title:...}, ...]
      const subs = r.data.subtasks || r.data.chunks || [];
      task.subtasks = subs.map(s => ({ title: s.title || s }));
      await task.save();
      return res.json({ task });
    } catch(e){
      console.warn('ml chunk failed', e.message);
    }
  }

  // fallback: naive split into 3 parts
  const chunks = [
    { title: task.title + ' — part 1' },
    { title: task.title + ' — part 2' },
    { title: task.title + ' — part 3' }
  ];
  task.subtasks = chunks.map(c => ({ title: c.title, completed: false }));
  await task.save();
  res.json({ task });
});

module.exports = router;
