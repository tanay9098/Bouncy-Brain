import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import { useUser } from "../contexts/UserContext";
import { useEnergy } from "../contexts/EnergyContext";

const ENERGY_LABELS = ["💀 Exhausted", "😔 Low", "😐 Okay", "⚡ Good", "🔥 Peak"];
const ENERGY_EMOJIS = ["💀", "😔", "😐", "⚡", "🔥"];

export default function Home() {
  const { user } = useUser();
  const { energy, setEnergy } = useEnergy();
  const [daily, setDaily] = useState({ tasksCompleted: 0, totalSessionMins: 0 });
  const [whatNext, setWhatNext] = useState(null);
  const [loadingNext, setLoadingNext] = useState(false);
  const [streak, setStreak] = useState(0);

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  useEffect(() => {
    loadStats();
    loadWhatNext();
  }, [energy]);

  async function loadStats() {
    try {
      const { data: d } = await api.get("/stats/daily");
      setDaily(d ?? { tasksCompleted: 0, totalSessionMins: 0 });
      // Derive a streak from weekly data
      const { data: w } = await api.get("/stats/weekly");
      if (w?.tasks) {
        const byDay = {};
        w.tasks.forEach((t) => {
          const key = t.completedAt?.split("T")[0];
          if (key) byDay[key] = true;
        });
        let s = 0;
        for (let i = 0; i < 7; i++) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          const key = d.toISOString().split("T")[0];
          if (byDay[key]) s++;
          else if (i > 0) break;
        }
        setStreak(s);
      }
    } catch {}
  }

  async function loadWhatNext() {
    setLoadingNext(true);
    try {
      const data = await api.get(`/tasks/what-next?energyLevel=${energy}`);
      setWhatNext(data.task || null);
    } catch {
      setWhatNext(null);
    } finally {
      setLoadingNext(false);
    }
  }

  function whatNextReason(task) {
    if (!task) return "";
    const parts = [];
    if (task.dueAt) {
      const h = Math.round((new Date(task.dueAt) - new Date()) / 3600000);
      if (h < 24) parts.push(`Due in ~${h}h`);
      else parts.push(`Due ${new Date(task.dueAt).toLocaleDateString()}`);
    }
    if (task.estimateMins) parts.push(`~${task.estimateMins} min`);
    if (task.dreadScore <= 2) parts.push("Low dread — easy to start");
    else if (task.dreadScore >= 4) parts.push("High dread — tackle it now");
    return parts.join(" · ") || "Good match for your current energy";
  }

  return (
    <div>
      {/* ── Greeting ─────────────────────────────────────────── */}
      <h1 className="page-title">{greeting}{user?.name ? `, ${user.name.split(" ")[0]}` : ""} 👋</h1>
      <p className="page-subtitle">Your ADHD command centre</p>

      {/* ── Energy Check-in ──────────────────────────────────── */}
      <div className="card mb-4">
        <div className="card-title">How's your energy right now?</div>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              className={`energy-btn ${energy === n ? "selected" : ""}`}
              onClick={() => { setEnergy(n); setTimeout(loadWhatNext, 100); }}
              title={ENERGY_LABELS[n - 1]}
            >
              {ENERGY_EMOJIS[n - 1]}
            </button>
          ))}
          <span className="text-sm text-muted" style={{ marginLeft: 8 }}>
            {ENERGY_LABELS[energy - 1]}
          </span>
        </div>
      </div>

      <div className="grid-main">
        {/* ── Left column ───────────────────────────────────── */}
        <div className="stack">
          {/* What Next card */}
          <div className="what-next-card">
            <div className="what-next-label">⚡ What next?</div>
            {loadingNext ? (
              <div className="text-sm text-muted">Finding the best task for you...</div>
            ) : whatNext ? (
              <>
                <div className="what-next-task">{whatNext.title}</div>
                <div className="what-next-reason">{whatNextReason(whatNext)}</div>
                <div style={{ display: "flex", gap: 8 }}>
                  <Link to="/focus">
                    <button className="btn btn-primary">▶ Start Focus</button>
                  </Link>
                  <Link to="/todo">
                    <button className="btn btn-ghost btn-sm" style={{ alignSelf: "center" }}>
                      View all tasks
                    </button>
                  </Link>
                </div>
              </>
            ) : (
              <>
                <div className="what-next-task" style={{ fontSize: 15 }}>No tasks yet</div>
                <div className="what-next-reason">Add some tasks to get a personalised recommendation.</div>
                <Link to="/todo">
                  <button className="btn btn-primary">Add tasks</button>
                </Link>
              </>
            )}
          </div>

          {/* Today stats */}
          <div className="grid-3">
            <div className="stat-tile">
              <div className="stat-value stat-green">{daily.tasksCompleted ?? 0}</div>
              <div className="stat-label">Tasks done</div>
            </div>
            <div className="stat-tile">
              <div className="stat-value stat-violet">{daily.totalSessionMins ?? 0}</div>
              <div className="stat-label">Focus mins</div>
            </div>
            <div className="stat-tile">
              <div className="stat-value stat-amber">
                {streak > 0 ? `${streak}🔥` : "—"}
              </div>
              <div className="stat-label">Day streak</div>
            </div>
          </div>
        </div>

        {/* ── Right column ──────────────────────────────────── */}
        <div className="stack">
          <div className="card">
            <div className="card-title">Quick actions</div>
            <div className="stack-sm">
              <Link to="/focus" style={{ textDecoration: "none" }}>
                <button className="btn btn-primary w-full">
                  🎯 Start Focus Session
                </button>
              </Link>
              <Link to="/todo?tab=dump" style={{ textDecoration: "none" }}>
                <button className="btn btn-secondary w-full">
                  📝 Brain Dump → Tasks
                </button>
              </Link>
              <Link to="/mindful" style={{ textDecoration: "none" }}>
                <button className="btn btn-ghost w-full">
                  🧘 Mindfulness
                </button>
              </Link>
              <Link to="/dashboard" style={{ textDecoration: "none" }}>
                <button className="btn btn-ghost w-full">
                  📊 View Stats
                </button>
              </Link>
            </div>
          </div>

          <div className="card">
            <div className="card-title">Daily tip</div>
            <div className="text-sm" style={{ lineHeight: 1.7, color: "var(--text-soft)" }}>
              {energy <= 2
                ? "Low energy day — pick the easiest task first. Even 10 minutes counts."
                : energy === 3
                ? "Pick 2 tasks. Start small. Consistency beats intensity."
                : "Peak energy — tackle your most dreaded task now while you have momentum."}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
