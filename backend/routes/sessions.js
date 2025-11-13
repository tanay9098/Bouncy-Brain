const express = require('express');
const router = express.Router();
const Session = require('../models/Session');
const jwt = require('jsonwebtoken');

function auth(req,res,next){
  const h = req.headers.authorization || '';
  const token = h.replace('Bearer ','');
  if(!token) return res.status(401).end();
  try { const payload = jwt.verify(token, process.env.JWT_SECRET); req.userId = payload.id; next(); } catch(e){ return res.status(401).end(); }
}

// Create a session (called when a timer completes)
router.post('/', auth, async (req,res)=>{
  const { type, subject, durationMins } = req.body;
  const s = await Session.create({ userId: req.userId, type, subject, durationMins, completedAt: new Date() });
  res.json({ session: s });
});

// optional: list sessions (not necessary for UI but convenient)
router.get('/', auth, async (req,res)=>{
  const sessions = await Session.find({ userId: req.userId }).sort({ completedAt: -1 }).limit(50);
  res.json({ sessions });
});

module.exports = router;
