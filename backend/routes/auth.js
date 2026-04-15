const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');

// Strict rate limit for auth endpoints: 10 attempts per 15 minutes per IP
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts, please try again later' },
});

// create token
function makeToken(id){
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

// Signup
router.post('/signup', authLimiter, async (req,res)=>{
  const { email, password, name } = req.body;
  if(!email || !password) return res.status(400).json({ error: 'email and password required' });

  // Password strength: minimum 8 chars, at least one letter and one number
  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }
  if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
    return res.status(400).json({ error: 'Password must contain at least one letter and one number' });
  }

  const exists = await User.findOne({ email });
  if(exists) return res.status(400).json({ error: 'Email already registered' });
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({ email, name, passwordHash });
  const token = makeToken(user._id);
  res.json({ user: { id: user._id, email: user.email, name: user.name }, token });
});

// Login
router.post('/login', authLimiter, async (req,res)=>{
  const { email, password } = req.body;
  if(!email || !password) return res.status(400).json({ error: 'email and password required' });
  const user = await User.findOne({ email });
  if(!user) return res.status(400).json({ error: 'Invalid credentials' });
  const ok = await bcrypt.compare(password, user.passwordHash);
  if(!ok) return res.status(400).json({ error: 'Invalid credentials' });
  const token = makeToken(user._id);
  res.json({ user: { id: user._id, email: user.email, name: user.name }, token });
});

module.exports = router;
