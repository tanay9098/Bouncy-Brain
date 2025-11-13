const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// create token
function makeToken(id){
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

// Signup
router.post('/signup', async (req,res)=>{
  const { email, password, name } = req.body;
  if(!email || !password) return res.status(400).json({ error: 'email and password required' });
  const exists = await User.findOne({ email });
  if(exists) return res.status(400).json({ error: 'Email already registered' });
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({ email, name, passwordHash });
  const token = makeToken(user._id);
  res.json({ user: { id: user._id, email: user.email, name: user.name }, token });
});

// Login
router.post('/login', async (req,res)=>{
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
