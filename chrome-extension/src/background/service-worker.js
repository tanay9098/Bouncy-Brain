// JumpyBrain Background Service Worker
// Manages timer state across popup open/close via chrome.alarms

const ALARM_NAME = 'bb-timer';

const DEFAULT_STATE = {
  active: false,
  isWork: true,
  workMins: 25,
  breakMins: 5,
  mode: 'pomodoro',
  endsAt: null,
  pausedRemaining: null,
  sessionCount: 0,
  distractionCount: 0,
};

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get('timerState', (data) => {
    if (!data.timerState) chrome.storage.local.set({ timerState: DEFAULT_STATE });
  });
});

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  handleMessage(msg).then(sendResponse).catch((err) => sendResponse({ error: err.message }));
  return true;
});

async function getState() {
  const { timerState } = await chrome.storage.local.get('timerState');
  return timerState || DEFAULT_STATE;
}

async function saveState(state) {
  await chrome.storage.local.set({ timerState: state });
}

function computeRemaining(state) {
  if (state.active && state.endsAt) return Math.max(0, Math.round((state.endsAt - Date.now()) / 1000));
  if (state.pausedRemaining != null) return Math.round(state.pausedRemaining / 1000);
  return (state.isWork ? state.workMins : state.breakMins) * 60;
}

async function handleMessage({ type, payload }) {
  switch (type) {
    case 'GET_TIMER': {
      const state = await getState();
      return { ...state, remainingSeconds: computeRemaining(state) };
    }

    case 'START_TIMER': {
      const base = await getState();
      const next = { ...base, ...payload, active: true, pausedRemaining: null };
      next.endsAt = Date.now() + (next.isWork ? next.workMins : next.breakMins) * 60 * 1000;
      await saveState(next);
      await chrome.alarms.clear(ALARM_NAME);
      chrome.alarms.create(ALARM_NAME, { when: next.endsAt });
      return { ok: true };
    }

    case 'PAUSE_TIMER': {
      const state = await getState();
      if (!state.active) return { ok: true };
      const updated = { ...state, active: false, pausedRemaining: Math.max(0, state.endsAt - Date.now()), endsAt: null };
      await saveState(updated);
      await chrome.alarms.clear(ALARM_NAME);
      return { ok: true };
    }

    case 'RESUME_TIMER': {
      const state = await getState();
      if (state.active || state.pausedRemaining == null) return { ok: true };
      const endsAt = Date.now() + state.pausedRemaining;
      const updated = { ...state, active: true, endsAt, pausedRemaining: null };
      await saveState(updated);
      chrome.alarms.create(ALARM_NAME, { when: endsAt });
      return { ok: true };
    }

    case 'RESET_TIMER': {
      const state = await getState();
      const reset = { ...state, active: false, isWork: true, endsAt: null, pausedRemaining: null, distractionCount: 0 };
      await saveState(reset);
      await chrome.alarms.clear(ALARM_NAME);
      return { ok: true };
    }

    case 'INCREMENT_DISTRACTION': {
      const state = await getState();
      await saveState({ ...state, distractionCount: (state.distractionCount || 0) + 1 });
      return { ok: true };
    }

    case 'SET_CONFIG': {
      const state = await getState();
      await saveState({ ...state, ...payload });
      return { ok: true };
    }

    default:
      return { error: 'Unknown message type' };
  }
}

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name !== ALARM_NAME) return;

  const state = await getState();
  const wasWork = state.isWork;

  const updated = {
    ...state,
    active: false,
    isWork: !wasWork,
    endsAt: null,
    sessionCount: wasWork ? (state.sessionCount || 0) + 1 : state.sessionCount,
    distractionCount: wasWork ? 0 : state.distractionCount,
  };
  await saveState(updated);

  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icons/icon48.png',
    title: wasWork ? 'JumpyBrain — Session Complete!' : 'JumpyBrain — Break Over!',
    message: wasWork
      ? `Great work! Take a ${state.breakMins}-minute break. 🎉`
      : 'Break is over. Ready to focus again? 💪',
    priority: 2,
  });

  if (wasWork) {
    logSessionToBackend(state).catch(() => {});
  }
});

async function logSessionToBackend(state) {
  const { authToken, apiUrl } = await chrome.storage.local.get(['authToken', 'apiUrl']);
  if (!authToken || !apiUrl) return;

  await fetch(`${apiUrl}/sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
    body: JSON.stringify({
      type: state.mode || 'pomodoro',
      durationMins: state.workMins,
      distractionCount: state.distractionCount || 0,
    }),
  });
}
