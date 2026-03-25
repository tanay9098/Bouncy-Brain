function predictPriority(f) {
  const urgency = Math.exp(-f.deadline_days / 10);
  const effort = f.estimated_time / 120;
  const procrastination = f.historical_procrastination_rate;

  const score =
    urgency * 0.4 +
    f.urgency_self * 0.2 +
    (1 - effort) * 0.2 +
    (1 - f.completion_rate) * 0.1 +
    procrastination * 0.1;

  let priority = "Medium";
  if (score > 0.7) priority = "High";
  else if (score < 0.4) priority = "Low";

  return { score, priority };
}

module.exports = { predictPriority };