const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  title: String,
  dueAt: Date,
  estimateMins: Number,
  completed: { type: Boolean, default: false },
  completedAt: Date,
  subtasks: [{ title: String, completed: { type: Boolean, default: false } }],
  importance: { type: Number, default: 1 },
  dreadScore: { type: Number, default: 3, min: 1, max: 5 },
  aiPriority: { type: String, enum: ['High', 'Medium', 'Low', null], default: null },
  meta: {
    source:   { type: String, default: null },
    sourceId: { type: String, default: null },
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Task', taskSchema);
