import React, { useEffect, useRef, useState } from "react";
import api from "../services/api";
import { setFocusActive, getDistractionCount, resetDistractionCount } from "./FocusOverlay";
import Affirmations from "./Affirmations";

const CIRCUMFERENCE = 2 * Math.PI * 90; // r = 90

const MODES = [
  { id: "pomodoro", label: "Pomodoro", work: 25, brk: 5 },
  { id: "deep",     label: "Deep Work", work: 50, brk: 10 },
  
];

export default function FocusTimer() {
  const [modeIdx, setModeIdx] = useState(0);
  const [workMins, setWorkMins] = useState(25);
  const [breakMins, setBreakMins] = useState(5);
  const [isWork, setIsWork] = useState(true);
  const [seconds, setSeconds] = useState(25 * 60);
  const [active, setActive] = useState(false);
  const [sessionCount, setSessionCount] = useState(0);
  const [reward, setReward] = useState(null);
  const affirmRef = useRef();
  const intervalRef = useRef();

  const totalSecs = (isWork ? workMins : breakMins) * 60;
  const progress = totalSecs > 0 ? 1 - seconds / totalSecs : 0;
  const dashOffset = CIRCUMFERENCE * (1 - progress);

  // Apply preset when mode tab changes (not custom)
  useEffect(() => {
    const m = MODES[modeIdx];
    if (m.id !== "custom") {
      setWorkMins(m.work);
      setBreakMins(m.brk);
      reset(m.work, m.brk);
    }
  }, [modeIdx]);

  // Countdown tick
  useEffect(() => {
    if (active && seconds > 0) {
      intervalRef.current = setInterval(() => setSeconds((s) => s - 1), 1000);
    } else if (seconds === 0 && active) {
      clearInterval(intervalRef.current);
      setActive(false);
      setFocusActive(false);
      handleComplete();
    }
    return () => clearInterval(intervalRef.current);
  }, [active, seconds]);

  // Tell FocusOverlay when a session is running
  useEffect(() => {
    if (active) {
      setFocusActive(true, isWork ? MODES[modeIdx].label : "Break");
    } else {
      setFocusActive(false);
    }
    return () => { if (active) setFocusActive(false); };
  }, [active, isWork, modeIdx]);

  async function handleComplete() {
    if (isWork) {
      setSessionCount((c) => c + 1);
      showReward("🔥");
      if (affirmRef.current) affirmRef.current.messageForContext("task-complete");
      const distractionCount = getDistractionCount();
      resetDistractionCount();
      const energyLevel = parseInt(localStorage.getItem("bb-energy") || "3", 10);
      try {
        await api.post("/sessions", {
          type: MODES[modeIdx].id,
          durationMins: workMins,
          distractionCount,
          energyLevel,
        });
      } catch {}
    } else {
      if (affirmRef.current) affirmRef.current.messageForContext("day-start");
    }
  }

  function showReward(emoji) {
    setReward(emoji);
    setTimeout(() => setReward(null), 900);
  }

  function toggle() {
    if (!active) {
      setActive(true);
    } else {
      setActive(false);
      setFocusActive(false);
    }
  }

  function reset(w = workMins, b = breakMins) {
    clearInterval(intervalRef.current);
    setActive(false);
    setFocusActive(false);
    setIsWork(true);
    setSeconds(w * 60);
  }

  function switchPhase() {
    clearInterval(intervalRef.current);
    setActive(false);
    setFocusActive(false);
    const next = !isWork;
    setIsWork(next);
    setSeconds((next ? workMins : breakMins) * 60);
  }

  function fmt(s) {
    const m = Math.floor(s / 60);
    const ss = s % 60;
    return `${m}:${ss < 10 ? "0" + ss : ss}`;
  }

  const sessionLabels = ["", "Starting out 🙂", "In the zone!", "Focus machine 🔥", "Incredible! 🤯"];
  const sessionLabel =
    sessionCount === 0
      ? "Start your first session"
      : sessionLabels[Math.min(sessionCount, sessionLabels.length - 1)];

  return (
    <div>
      {reward && <div className="reward-burst">{reward}</div>}

      <h1 className="page-title">Focus Timer</h1>
      <p className="page-subtitle">Pomodoro-style sessions with tab-switch protection</p>

      <div className="grid-main">
        {/* ── Timer card ───────────────────────────────────── */}
        <div className="card">
          <div className="mode-tabs">
            {MODES.map((m, i) => (
              <button
                key={m.id}
                className={`mode-tab ${modeIdx === i ? "active" : ""}`}
                onClick={() => { setModeIdx(i); }}
              >
                {m.label}
              </button>
            ))}
          </div>

          {modeIdx === 2 && (
            <div className="flex gap-3 mb-4">
              <div style={{ flex: 1 }}>
                <div className="text-xs text-muted mb-1">Work (min)</div>
                <input
                  className="input"
                  type="number"
                  value={workMins}
                  onChange={(e) => {
                    const v = Math.max(1, Number(e.target.value));
                    setWorkMins(v);
                    if (!active) setSeconds(isWork ? v * 60 : breakMins * 60);
                  }}
                  min={1} max={120}
                />
              </div>
              <div style={{ flex: 1 }}>
                <div className="text-xs text-muted mb-1">Break (min)</div>
                <input
                  className="input"
                  type="number"
                  value={breakMins}
                  onChange={(e) => {
                    const v = Math.max(1, Number(e.target.value));
                    setBreakMins(v);
                    if (!active && !isWork) setSeconds(v * 60);
                  }}
                  min={1} max={60}
                />
              </div>
            </div>
          )}

          {/* Ring Timer */}
          <div className="ring-container">
            <svg className="ring-svg" width="220" height="220" viewBox="0 0 220 220">
              <circle className="ring-track" cx="110" cy="110" r="90" />
              <circle
                className={`ring-progress ${isWork ? "work" : "brk"}`}
                cx="110" cy="110" r="90"
                strokeDasharray={CIRCUMFERENCE}
                strokeDashoffset={dashOffset}
              />
            </svg>
            <div className="ring-text">
              <div className="ring-time">{fmt(seconds)}</div>
              <div className="ring-label">{isWork ? "Work" : "Break"}</div>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              gap: 10,
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            <button
              className={`btn btn-lg ${active ? "btn-secondary" : "btn-primary"}`}
              onClick={toggle}
              style={{ minWidth: 130 }}
            >
              {active ? "⏸ Pause" : "▶ Start"}
            </button>
            <button className="btn btn-ghost" onClick={() => reset()}>
              ↺ Reset
            </button>
            <button className="btn btn-ghost" onClick={switchPhase}>
              {isWork ? "→ Break" : "→ Work"}
            </button>
          </div>
        </div>

        {/* ── Right panel ──────────────────────────────────── */}
        <div className="stack">
          <div className="card">
            <div className="card-title">Today's Sessions</div>
            <div
              className="stat-value stat-violet"
              style={{ fontSize: 42, marginBottom: 4 }}
            >
              {sessionCount}
            </div>
            <div className="text-sm text-muted">{sessionLabel}</div>
            {sessionCount >= 2 && (
              <div className="streak-badge" style={{ marginTop: 10, alignSelf: "flex-start" }}>
                🔥 {sessionCount} sessions
              </div>
            )}
          </div>

          <div className="card">
            <div className="card-title">Focus Guard</div>
            <div
              className="focus-status"
              style={{
                background: active ? "var(--green-dim)" : "var(--border)",
                color: active ? "var(--green)" : "var(--muted)",
                marginBottom: 10,
              }}
            >
              <span className="focus-status-dot" />
              {active ? "Active — guarding focus" : "Inactive"}
            </div>
            <div className="text-sm text-muted" style={{ lineHeight: 1.7 }}>
              When you switch tabs during a session, you'll get a gentle nudge.
              <br />
              <span style={{ color: "var(--violet-light)" }}>800ms debounce</span> — quick reference
              checks won't trigger it.
            </div>
          </div>

          <div className="card">
            <div className="card-title">Affirmation</div>
            <Affirmations ref={affirmRef} />
          </div>
        </div>
      </div>
    </div>
  );
}
