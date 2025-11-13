const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  title: String,
  dueAt: Date,
  estimateMins: Number,
  completed: { type: Boolean, default: false },
  subtasks: [{ title: String, completed: { type: Boolean, default: false } }],
  importance: { type: Number, default: 1 },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Task', taskSchema);
