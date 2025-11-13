const express = require('express');
const router = express.Router();
const { google } = require('googleapis');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

const SCOPES = ['https://www.googleapis.com/auth/calendar.events', 'https://www.googleapis.com/auth/calendar.readonly'];

function auth(req,res,next){
  const h = req.headers.authorization || '';
  const token = h.replace('Bearer ','');
  if(!token) return res.status(401).end();
  try { const payload = jwt.verify(token, process.env.JWT_SECRET); req.userId = payload.id; next(); } catch(e){ return res.status(401).end(); }
}

function makeOAuthClient(){
  return new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET, process.env.GOOGLE_REDIRECT_URI);
}

// returns URL to open in browser
router.get('/authurl', auth, (req,res)=>{
  const o = makeOAuthClient();
  const url = o.generateAuthUrl({ access_type: 'offline', scope: SCOPES, prompt: 'consent' });
  res.json({ url });
});

// callback used by Google redirect (for demo returns tokens)
router.get('/oauth2callback', async (req,res)=>{
  const code = req.query.code;
  const o = makeOAuthClient();
  const { tokens } = await o.getToken(code);
  // In production: you must rule how to map this to a user. For demo: prompt front-end to POST tokens with its JWT to /save-tokens
  res.json({ tokens });
});

// frontend should POST tokens to save them for logged-in user
router.post('/save-tokens', auth, async (req,res)=>{
  const { tokens } = req.body;
  await User.findByIdAndUpdate(req.userId, { 'google.tokens': tokens }, { new: true });
  res.json({ ok: true });
});

// create event
router.post('/create-event', auth, async (req,res)=>{
  const user = await User.findById(req.userId);
  if(!user?.google?.tokens) return res.status(400).json({ error: 'Google not connected' });
  const o = makeOAuthClient();
  o.setCredentials(user.google.tokens);
  const calendar = google.calendar({ version: 'v3', auth: o });
  const event = req.body.event;
  const created = await calendar.events.insert({ calendarId: 'primary', requestBody: event });
  res.json({ event: created.data });
});

// list events (upcoming)
router.get('/events', auth, async (req,res)=>{
  const user = await User.findById(req.userId);
  if(!user?.google?.tokens) return res.json({ events: [] });
  const o = makeOAuthClient();
  o.setCredentials(user.google.tokens);
  const calendar = google.calendar({ version: 'v3', auth: o });
  const result = await calendar.events.list({
    calendarId: 'primary',
    timeMin: (new Date()).toISOString(),
    maxResults: 20,
    singleEvents: true,
    orderBy: 'startTime'
  });
  res.json({ events: result.data.items });
});

module.exports = router;
