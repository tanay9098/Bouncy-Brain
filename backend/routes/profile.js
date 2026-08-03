const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

function auth(req, res, next) {
  const h = req.headers.authorization || '';
  const token = h.replace('Bearer ', '');
  if (!token) return res.status(401).end();
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = payload.id;
    next();
  } catch {
    return res.status(401).end();
  }
}

// GET /api/profile — return current user profile
router.get('/', auth, async (req, res) => {
  const user = await User.findById(req.userId).select('-passwordHash -googleId -integrations -authProviders');
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ id: user._id, email: user.email, name: user.name, gender: user.gender, preferredTheme: user.preferredTheme });
});

// PUT /api/profile — update name, gender, email, preferredTheme
router.put('/', auth, async (req, res) => {
  const { name, gender, email, preferredTheme } = req.body;
  const update = {};

  if (name !== undefined) {
    if (typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ error: 'Name cannot be empty' });
    }
    if (name.trim().length > 100) {
      return res.status(400).json({ error: 'Name is too long' });
    }
    update.name = name.trim();
  }

  if (gender !== undefined) {
    const allowed = ['male', 'female', 'non-binary', 'prefer-not-to-say', ''];
    if (!allowed.includes(gender)) {
      return res.status(400).json({ error: 'Invalid gender value' });
    }
    update.gender = gender;
  }

  if (email !== undefined) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }
    const existing = await User.findOne({ email: email.toLowerCase().trim(), _id: { $ne: req.userId } });
    if (existing) {
      return res.status(400).json({ error: 'Email already in use' });
    }
    update.email = email.toLowerCase().trim();
  }

  if (preferredTheme !== undefined) {
    if (!['dark', 'light'].includes(preferredTheme)) {
      return res.status(400).json({ error: 'Invalid theme value' });
    }
    update.preferredTheme = preferredTheme;
  }

  const user = await User.findByIdAndUpdate(req.userId, update, { new: true });
  if (!user) return res.status(404).json({ error: 'User not found' });

  res.json({ id: user._id, email: user.email, name: user.name, gender: user.gender, preferredTheme: user.preferredTheme });
});

// PUT /api/profile/password — change password
router.put('/password', auth, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'currentPassword and newPassword are required' });
  }

  if (newPassword.length < 8) {
    return res.status(400).json({ error: 'New password must be at least 8 characters' });
  }
  if (!/[a-zA-Z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
    return res.status(400).json({ error: 'New password must contain at least one letter and one number' });
  }

  const user = await User.findById(req.userId);
  if (!user) return res.status(404).json({ error: 'User not found' });

  if (!user.passwordHash) {
    return res.status(400).json({ error: 'This account uses Google sign-in and has no password to change' });
  }

  const ok = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!ok) return res.status(400).json({ error: 'Current password is incorrect' });

  user.passwordHash = await bcrypt.hash(newPassword, 10);
  await user.save();

  res.json({ message: 'Password updated successfully' });
});

module.exports = router;
