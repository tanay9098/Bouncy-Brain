const Task = require('../models/Task');
const Subscription = require('../models/Subscription');
const User = require('../models/User');
const webpush = require('../utils/webpush');
const sendEmail = require('../utils/sendEmail');
const { google } = require('googleapis');

const DEADLINE_WINDOW_MIN = 60; // notify if deadline within next X minutes

async function notifyUser(userId, title, body, email) {
  const sub = await Subscription.findOne({ userId });
  if(sub?.subscription){
    try {
      await webpush.sendNotification(sub.subscription, JSON.stringify({ title, body }));
    } catch(e){ console.warn('push err', e.message); }
  }
  try {
    const user = await User.findById(userId);
    const to = email || user?.email;
    if(to) await sendEmail(to, title, body);
  } catch(e){ console.warn('email err', e.message); }
}

async function checkTasks() {
  const now = new Date();
  const windowEnd = new Date(now.getTime() + DEADLINE_WINDOW_MIN * 60 * 1000);
  // find tasks with dueAt between now and windowEnd and not completed
  const tasks = await Task.find({ dueAt: { $gte: now, $lte: windowEnd }, completed: false });
  for(const t of tasks){
    const minsLeft = Math.ceil((new Date(t.dueAt) - now)/60000);
    const title = `Deadline near: ${t.title}`;
    const body = `Due in ${minsLeft} minutes. Try a focused session now.`;
    await notifyUser(t.userId, title, body);
  }
}

function makeOAuthClient(){
  return new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET, process.env.GOOGLE_REDIRECT_URI);
}

async function checkGoogleEvents(){
  // find users with google tokens
  const users = await User.find({ 'google.tokens': { $exists: true } });
  const now = new Date();
  const windowEnd = new Date(now.getTime() + DEADLINE_WINDOW_MIN * 60 * 1000);
  for(const u of users){
    try {
      const o = makeOAuthClient();
      o.setCredentials(u.google.tokens);
      const calendar = google.calendar({ version: 'v3', auth: o });
      const res = await calendar.events.list({
        calendarId: 'primary',
        timeMin: now.toISOString(),
        timeMax: windowEnd.toISOString(),
        singleEvents: true,
        orderBy: 'startTime'
      });
      const items = res.data.items || [];
      for(const ev of items){
        const title = `Calendar: ${ev.summary || 'Event'}`;
        const when = ev.start?.dateTime || ev.start?.date || '';
        const body = `Happening at ${when}.`;
        await notifyUser(u._id, title, body, u.email);
      }
    } catch(e){
      console.warn('google check failed for user', u._id, e.message);
    }
  }
}

module.exports = async function deadlineChecker(){
  try {
    await checkTasks();
    await checkGoogleEvents();
  } catch(e){
    console.error('deadlineChecker error', e);
  }
};
