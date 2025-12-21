const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const axios = require("axios");
const Task = require("../models/Task");

function auth(req, res, next) {
  const h = req.headers.authorization || "";
  const token = h.replace("Bearer ", "");
  if (!token) return res.status(401).end();
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = payload.id;
    next();
  } catch {
    return res.status(401).end();
  }
}

router.post("/prioritize", auth, async (req, res) => {
  const tasks = await Task.find({ userId: req.userId, completed: false });

  if (!tasks.length) return res.json({ tasks: [] });

  const prioritized = [];

  for (const t of tasks) {
    const deadlineDays = t.dueAt
      ? Math.ceil((new Date(t.dueAt) - Date.now()) / (1000 * 60 * 60 * 24))
      : 30;

    const payload = {
      deadline_days: Math.max(deadlineDays, 0),
      estimated_time: t.estimateMins || 30,
      difficulty: 3,
      urgency_self: 3,
      self_reported_procrastination: 3,
      energy_mismatch: 1,
      historical_procrastination_rate: 0.4
    };

    try {
      const r = await axios.post(
        process.env.ML_PRIORITY_URL,
        payload
      );

      prioritized.push({
        ...t.toObject(),
        aiPriority: r.data.priority
      });
    } catch {
      prioritized.push({
        ...t.toObject(),
        aiPriority: "Medium"
      });
    }
  }

  const order = { High: 0, Medium: 1, Low: 2 };
  prioritized.sort((a, b) => order[a.aiPriority] - order[b.aiPriority]);

  res.json({ tasks: prioritized });
});

module.exports = router;
