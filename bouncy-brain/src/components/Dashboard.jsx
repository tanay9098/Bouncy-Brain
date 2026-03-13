import { useEffect, useState } from "react";
import { api } from "../api";
import {
  BarChart, Bar,
  LineChart, Line,
  XAxis, YAxis,
  Tooltip, CartesianGrid,
  ResponsiveContainer,
} from "recharts";

export default function Dashboard() {
  const [daily, setDaily] = useState({ tasksCompleted: 0, totalSessionMins: 0 });
  const [weekly, setWeekly] = useState([]);
  const [monthly, setMonthly] = useState([]);
  const [streak, setStreak] = useState(0);
  const [totalCompleted, setTotalCompleted] = useState(0);

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const [d, w, m] = await Promise.all([
        api.get("/stats/daily"),
        api.get("/stats/weekly"),
        api.get("/stats/monthly"),
      ]);

      setDaily(d);

      const weekData = processWeekly(w.tasks || [], w.sessions || []);
      setWeekly(weekData);
      setMonthly(processMonthly(m.tasks || [], m.sessions || []));

      // Streak: consecutive days with at least 1 completed task
      const byDay = {};
      (w.tasks || []).forEach((t) => {
        const key = t.completedAt?.split("T")[0];
        if (key) byDay[key] = true;
      });
      let s = 0;
      for (let i = 0; i < 7; i++) {
        const dt = new Date();
        dt.setDate(dt.getDate() - i);
        const key = dt.toISOString().split("T")[0];
        if (byDay[key]) s++;
        else if (i > 0) break;
      }
      setStreak(s);
      setTotalCompleted(weekData.reduce((acc, d) => acc + d.tasks, 0));
    } catch {}
  }

  function processWeekly(tasks, sessions) {
    const map = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split("T")[0];
      const label = d.toLocaleDateString("en", { weekday: "short" });
      map[key] = { date: label, tasks: 0, minutes: 0 };
    }
    tasks.forEach((t) => {
      const key = t.completedAt?.split("T")[0];
      if (map[key]) map[key].tasks++;
    });
    sessions.forEach((s) => {
      const key = s.completedAt?.split("T")[0];
      if (map[key]) map[key].minutes += s.durationMins || 0;
    });
    return Object.values(map);
  }

  function processMonthly(tasks, sessions) {
    const map = {};
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split("T")[0];
      const label = `${d.getMonth() + 1}/${d.getDate()}`;
      map[key] = { date: label, tasks: 0, minutes: 0 };
    }
    tasks.forEach((t) => {
      const key = t.completedAt?.split("T")[0];
      if (map[key]) map[key].tasks++;
    });
    sessions.forEach((s) => {
      const key = s.completedAt?.split("T")[0];
      if (map[key]) map[key].minutes += s.durationMins || 0;
    });
    return Object.values(map);
  }

  const tooltipStyle = {
    backgroundColor: "var(--card)",
    border: "1px solid var(--border)",
    borderRadius: 8,
    color: "var(--text)",
    fontSize: 13,
  };

  return (
    <div>
      <h1 className="page-title">Stats</h1>
      <p className="page-subtitle">Track focus, tasks, and streaks over time</p>

      {/* ── Top stat tiles ─────────────────────────────────── */}
      <div className="grid-4 mb-4">
        <div className="stat-tile">
          <div className="stat-value stat-green">{daily.tasksCompleted ?? 0}</div>
          <div className="stat-label">Tasks today</div>
        </div>
        <div className="stat-tile">
          <div className="stat-value stat-violet">{daily.totalSessionMins ?? 0}</div>
          <div className="stat-label">Focus mins today</div>
        </div>
        <div className="stat-tile">
          <div className="stat-value stat-amber">
            {streak > 0 ? `${streak}🔥` : "0"}
          </div>
          <div className="stat-label">Day streak</div>
        </div>
        <div className="stat-tile">
          <div className="stat-value" style={{ color: "var(--text)" }}>{totalCompleted}</div>
          <div className="stat-label">Tasks this week</div>
        </div>
      </div>

      {/* ── Weekly bar chart ────────────────────────────────── */}
      <div className="card mb-4">
        <div className="card-title">Tasks Completed — Last 7 Days</div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={weekly} barSize={28}>
            <XAxis
              dataKey="date"
              tick={{ fill: "var(--muted)", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "var(--muted)", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={tooltipStyle}
              cursor={{ fill: "var(--violet-dim)" }}
            />
            <Bar dataKey="tasks" fill="var(--violet)" radius={[4, 4, 0, 0]} name="Tasks" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ── Monthly trend ────────────────────────────────────── */}
      <div className="card">
        <div className="card-title">30-Day Trend — Tasks & Focus Minutes</div>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={monthly}>
            <XAxis
              dataKey="date"
              tick={{ fill: "var(--muted)", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              interval={4}
            />
            <YAxis
              tick={{ fill: "var(--muted)", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
            />
            <CartesianGrid stroke="var(--border)" strokeDasharray="4 4" />
            <Tooltip contentStyle={tooltipStyle} />
            <Line
              type="monotone"
              dataKey="tasks"
              stroke="var(--violet-light)"
              strokeWidth={2}
              dot={false}
              name="Tasks"
            />
            <Line
              type="monotone"
              dataKey="minutes"
              stroke="var(--green)"
              strokeWidth={2}
              dot={false}
              name="Focus mins"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
