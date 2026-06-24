const mongoose = require('mongoose');

const integrationSchema = new mongoose.Schema({
  accessToken:  { type: String, default: null },
  refreshToken: { type: String, default: null },
  connectedAt:  { type: Date, default: null },
  lastSyncedAt: { type: Date, default: null },
}, { _id: false });

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
  integrations: {
    gmail: { type: integrationSchema, default: () => ({}) },
    gcal:  { type: integrationSchema, default: () => ({}) },
    slack: { type: integrationSchema, default: () => ({}) },
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);

