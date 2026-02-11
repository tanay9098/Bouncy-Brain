// const express = require("express");
// const router = express.Router();
// const jwt = require("jsonwebtoken");
// const axios = require("axios");
// const Task = require("../models/Task");

// function auth(req, res, next) {
//   const h = req.headers.authorization || "";
//   const token = h.replace("Bearer ", "");
//   if (!token) return res.status(401).end();
//   try {
//     const payload = jwt.verify(token, process.env.JWT_SECRET);
//     req.userId = payload.id;
//     next();
//   } catch {
//     return res.status(401).end();
//   }
// }

// router.post("/prioritize", auth, async (req, res) => {
//   const tasks = await Task.find({ userId: req.userId, completed: false });

//   if (!tasks.length) return res.json({ tasks: [] });

//   const prioritized = [];

//   for (const t of tasks) {
//     const deadlineDays = t.dueAt
//       ? Math.ceil((new Date(t.dueAt) - Date.now()) / (1000 * 60 * 60 * 24))
//       : 30;

//     const payload = {
//       deadline_days: Math.max(deadlineDays, 0),
//       estimated_time: t.estimateMins || 30,
//       difficulty: 3,
//       urgency_self: 3,
//       self_reported_procrastination: 3,
//       energy_mismatch: 1,
//       historical_procrastination_rate: 0.4
//     };

//     try {
//       const r = await axios.post(
//         process.env.ML_PRIORITY_URL,
//         payload
//       );

//       prioritized.push({
//         ...t.toObject(),
//         aiPriority: r.data.priority
//       });
//     } catch {
//       prioritized.push({
//         ...t.toObject(),
//         aiPriority: "Medium"
//       });
//     }
//   }

//   const order = { High: 0, Medium: 1, Low: 2 };
//   prioritized.sort((a, b) => order[a.aiPriority] - order[b.aiPriority]);

//   res.json({ tasks: prioritized });
// });

// module.exports = router;

const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const axios = require("axios");
const Task = require("../models/Task");
const Session = require("../models/Session");

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

/**
 * Compute real user history features from MongoDB
 */
async function getUserHistory(userId) {
  // Get all completed tasks for this user
  const completedTasks = await Task.find({
    userId,
    completed: true,
  })
    .sort({ completedAt: -1 })
    .limit(200)
    .lean();

  // Get total task count (completed + incomplete)
  const totalTasks = await Task.countDocuments({ userId });

  // Get recent sessions (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const sessions = await Session.find({
    userId,
    completedAt: { $gte: thirtyDaysAgo },
  })
    .sort({ completedAt: -1 })
    .lean();

  return {
    completed_tasks: completedTasks.map((t) => ({
      title: t.title,
      dueAt: t.dueAt,
      estimateMins: t.estimateMins,
      importance: t.importance,
      completed: t.completed,
      completedAt: t.completedAt,
      createdAt: t.createdAt,
    })),
    total_tasks: totalTasks,
    sessions: sessions.map((s) => ({
      type: s.type,
      durationMins: s.durationMins,
      completedAt: s.completedAt,
    })),
  };
}

/**
 * POST /priority/prioritize
 * Fetches pending tasks, computes real user history, sends to ML
 */
router.post("/prioritize", auth, async (req, res) => {
  try {
    const tasks = await Task.find({
      userId: req.userId,
      completed: false,
    }).lean();

    if (!tasks.length) return res.json({ tasks: [] });

    // Get real user history
    const history = await getUserHistory(req.userId);

    // Try batch recommendation endpoint first (new v2)
    try {
      const mlResponse = await axios.post(
        (process.env.ML_PRIORITY_URL || "http://localhost:5001").replace(
          "/predict-priority",
          ""
        ) + "/recommend",
        {
          tasks: tasks.map((t) => ({
            _id: t._id,
            title: t.title,
            dueAt: t.dueAt,
            estimateMins: t.estimateMins,
            importance: t.importance,
            createdAt: t.createdAt,
            subtasks: t.subtasks,
          })),
          history,
        },
        { timeout: 5000 }
      );

      return res.json({
        tasks: mlResponse.data.tasks || [],
        feature_importance: mlResponse.data.feature_importance || {},
      });
    } catch (batchErr) {
      console.warn("[priority] batch /recommend failed, falling back to per-task:", batchErr.message);
    }

    // Fallback: per-task prediction (v1-compatible with enriched data)
    const prioritized = [];

    for (const t of tasks) {
      const deadlineDays = t.dueAt
        ? Math.ceil((new Date(t.dueAt) - Date.now()) / (1000 * 60 * 60 * 24))
        : 30;

      // Compute real completion rate
      const completionRate =
        history.total_tasks > 0
          ? history.completed_tasks.length / history.total_tasks
          : 0.5;

      // Compute real procrastination rate from late completions
      const lateCount = history.completed_tasks.filter((ct) => {
        if (!ct.completedAt || !ct.dueAt) return false;
        return new Date(ct.completedAt) > new Date(ct.dueAt);
      }).length;
      const procrastinationRate =
        history.completed_tasks.length > 0
          ? lateCount / history.completed_tasks.length
          : 0.4;

      // Build enriched payload
      const payload = {
        completion_rate: completionRate,
        deadline_days: Math.max(deadlineDays, 0),
        estimated_time: t.estimateMins || 30,
        difficulty: Math.min(Math.ceil((t.estimateMins || 30) / 20), 5),
        urgency_self: t.importance || 1,
        self_reported_procrastination: Math.round(procrastinationRate * 5),
        energy_mismatch: 1,
        historical_procrastination_rate: procrastinationRate,
        // enriched fields
        dueAt: t.dueAt,
        estimateMins: t.estimateMins || 30,
        importance: t.importance || 1,
        title: t.title,
        history,
      };

      try {
        const r = await axios.post(process.env.ML_PRIORITY_URL, payload, {
          timeout: 3000,
        });

        prioritized.push({
          ...t,
          aiPriority: r.data.priority,
          priority_score: r.data.score || 0.5,
          recommendation: r.data.recommendation || "schedule_soon",
        });
      } catch {
        prioritized.push({
          ...t,
          aiPriority: "Medium",
          priority_score: 0.5,
          recommendation: "schedule_soon",
        });
      }
    }

    const order = { High: 0, Medium: 1, Low: 2 };
    prioritized.sort((a, b) => order[a.aiPriority] - order[b.aiPriority]);

    res.json({ tasks: prioritized });
  } catch (err) {
    console.error("[priority] error:", err.message);
    res.status(500).json({ error: "Prioritization failed" });
  }
});

/**
 * POST /priority/train
 * Trigger model retraining with this user's real data
 */
router.post("/train", auth, async (req, res) => {
  try {
    const history = await getUserHistory(req.userId);

    if (history.completed_tasks.length < 5) {
      return res.json({
        status: "skipped",
        reason: "Need at least 5 completed tasks to train",
      });
    }

    const mlBase = (process.env.ML_PRIORITY_URL || "http://localhost:5001").replace(
      "/predict-priority",
      ""
    );

    const r = await axios.post(
      `${mlBase}/train-user`,
      {
        userId: req.userId,
        completed_tasks: history.completed_tasks,
        sessions: history.sessions,
      },
      { timeout: 15000 }
    );

    res.json(r.data);
  } catch (err) {
    console.error("[priority] train error:", err.message);
    res.status(500).json({ error: "Training failed" });
  }
});

module.exports = router;