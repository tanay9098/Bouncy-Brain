const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const rateLimit = require('express-rate-limit');

// Strict rate limit for auth endpoints: 10 attempts per 15 minutes per IP
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts, please try again later' },
});

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

function makeToken(id) {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

// Signup
router.post('/signup', authLimiter, async (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'email and password required' });

  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }
  if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
    return res.status(400).json({ error: 'Password must contain at least one letter and one number' });
  }

  try {
    const exists = await User.findOne({ email: email.toLowerCase().trim() });
    if (exists) return res.status(400).json({ error: 'Email already registered' });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      email,
      name,
      passwordHash,
      authProviders: ['EMAIL_PASSWORD'],
    });
    const token = makeToken(user._id);
    res.json({ user: { id: user._id, email: user.email, name: user.name }, token });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ error: 'Email already registered' });
    }
    throw err;
  }
});

// Login
router.post('/login', authLimiter, async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'email and password required' });

  const user = await User.findOne({ email: email.toLowerCase().trim() });
  if (!user) return res.status(400).json({ error: 'Invalid credentials' });

  // Account exists but has no password (Google-only account)
  if (!user.passwordHash) {
    return res.status(400).json({
      error: 'This account was created with Google. Please sign in with Google.',
      code: 'GOOGLE_ACCOUNT_NO_PASSWORD',
    });
  }

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(400).json({ error: 'Invalid credentials' });

  const token = makeToken(user._id);
  res.json({ user: { id: user._id, email: user.email, name: user.name }, token });
});

// Google OAuth
router.post('/google', authLimiter, async (req, res) => {
  const { idToken } = req.body;
  if (!idToken) return res.status(400).json({ error: 'Google ID token required' });

  let payload;
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    payload = ticket.getPayload();
  } catch {
    return res.status(401).json({ error: 'Invalid Google token' });
  }

  const { sub: googleId, email, name, email_verified } = payload;
  if (!email_verified) {
    return res.status(400).json({ error: 'Google email not verified' });
  }

  try {
    const normalizedEmail = email.toLowerCase().trim();
    let user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      // Scenario 1: New user — create account linked to Google
      user = await User.create({
        email: normalizedEmail,
        name: name || '',
        googleId,
        authProviders: ['GOOGLE'],
      });
      const token = makeToken(user._id);
      return res.status(201).json({
        user: { id: user._id, email: user.email, name: user.name },
        token,
        isNewUser: true,
      });
    }

    // Scenario 2: Existing Google-linked account — sign in
    if (user.authProviders.includes('GOOGLE')) {
      const token = makeToken(user._id);
      return res.json({ user: { id: user._id, email: user.email, name: user.name }, token });
    }

    // Scenario 3 & 4: Account exists with email/password — block and surface clear error
    return res.status(409).json({
      error: 'An account with this email already exists. Please sign in using your email and password.',
      code: 'EMAIL_ACCOUNT_EXISTS',
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({
        error: 'An account with this email already exists. Please sign in using your email and password.',
        code: 'EMAIL_ACCOUNT_EXISTS',
      });
    }
    throw err;
  }
});

module.exports = router;
