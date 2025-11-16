import React, { useEffect, useState } from "react";
import { api } from "../api";
import {
  BarChart, Bar,
  LineChart, Line,
  XAxis, YAxis,
  Tooltip, CartesianGrid,
  ResponsiveContainer
} from "recharts";

export default function Dashboard() {
  const [daily, setDaily] = useState({});
  const [weekly, setWeekly] = useState([]);
  const [monthly, setMonthly] = useState([]);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const d = await api.get("/stats/daily");
    const w = await api.get("/stats/weekly");
    const m = await api.get("/stats/monthly");

    setDaily(d);
    setWeekly(processWeekly(w.tasks, w.sessions));
    setMonthly(processMonthly(m.tasks, m.sessions));
  }

  function processWeekly(tasks, sessions) {
    const map = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split("T")[0];
      map[key] = { date: key, tasks: 0, minutes: 0 };
    }

    tasks.forEach(t => {
      const key = t.completedAt.split("T")[0];
      if (map[key]) map[key].tasks++;
    });

    sessions.forEach(s => {
      const key = s.completedAt.split("T")[0];
      if (map[key]) map[key].minutes += s.durationMins;
    });

    return Object.values(map);
  }

  function processMonthly(tasks, sessions) {
    const map = {};
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split("T")[0];
      map[key] = { date: key, tasks: 0, minutes: 0 };
    }

    tasks.forEach(t => {
      const key = t.completedAt.split("T")[0];
      if (map[key]) map[key].tasks++;
    });

    sessions.forEach(s => {
      const key = s.completedAt.split("T")[0];
      if (map[key]) map[key].minutes += s.durationMins;
    });

    return Object.values(map);
  }

  return (
    <div className="app">
      <div className="page-header">
        <h2>Performance Dashboard</h2>
        <p className="small">Track your focus & productivity over time</p>
      </div>

      <div className="main-grid">
        
        {/* Today Summary */}
        <div className="card">
          <h3>Today</h3>
          <p><b>Tasks Completed:</b> {daily.tasksCompleted}</p>
          <p><b>Focus Minutes:</b> {daily.totalSessionMins}</p>
        </div>

        {/* Weekly Chart */}
        <div className="card">
          <h3>This Week</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={weekly}>
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <CartesianGrid strokeDasharray="3 3" />
              <Bar dataKey="tasks" fill="#a8dadc" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Monthly Chart */}
        <div className="card">
          <h3>Monthly Trend</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={monthly}>
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <CartesianGrid stroke="#eee" />
              <Line type="monotone" dataKey="tasks" stroke="#457b9d" />
              <Line type="monotone" dataKey="minutes" stroke="#e76f51" />
            </LineChart>
          </ResponsiveContainer>
        </div>

      </div>
    </div>
  );
}
