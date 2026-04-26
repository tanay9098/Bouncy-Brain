const CATEGORY_KEYWORDS = {
  creative:      ['write', 'design', 'draw', 'create', 'brainstorm', 'draft', 'sketch', 'compose', 'build', 'develop', 'code', 'program', 'art'],
  administrative:['email', 'report', 'form', 'meeting', 'call', 'schedule', 'book', 'reply', 'respond', 'fill', 'submit', 'register', 'invoice', 'plan', 'document'],
  physical:      ['clean', 'organize', 'exercise', 'move', 'setup', 'buy', 'pick', 'drop', 'install', 'fix', 'repair', 'workout', 'gym'],
  social:        ['meet', 'discuss', 'present', 'interview', 'talk', 'chat', 'feedback', 'collaborate'],
  learning:      ['read', 'study', 'learn', 'research', 'watch', 'listen', 'understand', 'explore', 'analyze', 'review', 'course'],
};

// Energy level → category preference (0–1 match score)
const ENERGY_CATEGORY_MATCH = {
  1: { administrative: 1.0, physical: 0.7, learning: 0.5, social: 0.3, creative: 0.2 },
  2: { administrative: 0.9, physical: 0.8, learning: 0.6, social: 0.4, creative: 0.3 },
  3: { administrative: 0.6, physical: 0.7, learning: 0.8, social: 0.8, creative: 0.6 },
  4: { administrative: 0.4, physical: 0.6, learning: 0.8, social: 0.8, creative: 0.9 },
  5: { administrative: 0.3, physical: 0.5, learning: 0.7, social: 0.7, creative: 1.0 },
};

function getTaskCategory(title = '') {
  const lower = title.toLowerCase();
  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw))) return cat;
  }
  return 'administrative';
}

function getCategoryEnergyMatch(title, energyLevel) {
  const cat = getTaskCategory(title);
  const level = Math.round(Math.max(1, Math.min(5, energyLevel || 3)));
  const prefs = ENERGY_CATEGORY_MATCH[level] || ENERGY_CATEGORY_MATCH[3];
  return prefs[cat] || 0.5;
}

function getTimeOfDayFit() {
  const hour = new Date().getHours();
  if (hour >= 9 && hour <= 11) return 0.9;   // morning peak
  if (hour >= 14 && hour <= 16) return 0.4;  // afternoon slump
  if (hour >= 20) return 0.3;                // evening
  return 0.65;
}

function predictPriority(f) {
  const {
    deadline_days = 30,
    estimated_time = 30,
    urgency_self = 1,
    completion_rate = 0.5,
    historical_procrastination_rate = 0.3,
    energy_level,
    dread_score,
    title,
  } = f;

  const urgency = Math.exp(-Math.max(0, deadline_days) / 10);
  const effort = Math.min(1, (estimated_time || 30) / 120);

  let categoryMatch = 0.5;
  if (energy_level && title) {
    categoryMatch = getCategoryEnergyMatch(title, energy_level);
  }

  let dreadEnergyFit = 0.5;
  if (dread_score != null && energy_level) {
    const dreadNorm = dread_score / 5;
    const energyNorm = energy_level / 5;
    dreadEnergyFit = 1.0 - Math.abs(dreadNorm - energyNorm) * 0.8;
  }

  const timeOfDayFit = getTimeOfDayFit();
  const effortBonus = energy_level <= 2 ? (1 - effort) : 0.5;

  const score =
    urgency * 0.30 +
    (Math.min(5, urgency_self) / 5) * 0.20 +
    categoryMatch * 0.15 +
    dreadEnergyFit * 0.15 +
    effortBonus * 0.10 +
    timeOfDayFit * 0.10;

  const clampedScore = Math.max(0, Math.min(1, score));

  let priority = 'Medium';
  if (clampedScore > 0.65) priority = 'High';
  else if (clampedScore < 0.35) priority = 'Low';

  let reason = 'Well-balanced priority';
  if (urgency > 0.7) reason = 'Deadline is approaching';
  else if (categoryMatch > 0.8) reason = 'Great match for your current energy level';
  else if (dreadEnergyFit > 0.75) reason = 'Your energy suits this task\'s difficulty';
  else if (urgency_self >= 4) reason = 'You rated this as high importance';
  else if (historical_procrastination_rate > 0.5) reason = 'You tend to delay this — good time to tackle it';

  return {
    score: clampedScore,
    priority,
    reason,
    category: getTaskCategory(title || ''),
  };
}

module.exports = { predictPriority, getTaskCategory, getCategoryEnergyMatch };
