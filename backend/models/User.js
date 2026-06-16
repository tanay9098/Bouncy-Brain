const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, maxlength: 100 },
  email: {
    type: String,
    unique: true,
    required: true,
    lowercase: true,
    trim: true,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Invalid email format'],
  },
  passwordHash: { type: String, default: null },
  authProviders: {
    type: [{ type: String, enum: ['EMAIL_PASSWORD', 'GOOGLE'] }],
    default: [],
  },
  googleId: { type: String, default: null },

  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);
