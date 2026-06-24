import React, { useEffect, useState } from "react";
import { Routes, Route, Link, useLocation } from "react-router-dom";
import Auth from "./components/Auth";
import Home from "./components/Home";
import Dashboard from "./components/Dashboard";
import FocusTimer from "./components/FocusTimer";
import TodoList from "./components/TodoList";
import Mindfulness from "./components/Mindfulness";
import DeadlineTimer from "./components/DeadlineTimer";
import Calendar from "./components/Calendar";
import ConnectorsPage from "./components/ConnectorsPage";
import FocusOverlay from "./components/FocusOverlay";
import { useUser } from "./contexts/UserContext";
import { EnergyProvider, useEnergy } from "./contexts/EnergyContext";

// ── SVG Icon set ─────────────────────────────────────────────────────────
const Icons = {
  Home: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M3 10L12 3l9 7v10a1 1 0 01-1 1H4a1 1 0 01-1-1V10z" />
      <path d="M9 21V12h6v9" />
    </svg>
  ),
  Focus: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="12" cy="12" r="1" fill="currentColor" />
    </svg>
  ),
  Tasks: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M9 11l2 2 4-4" />
      <rect x="3" y="3" width="18" height="18" rx="3" />
    </svg>
  ),
  Mind: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M9.5 2a2.5 2.5 0 015 0v1A6.5 6.5 0 0121 9.5v2a2.5 2.5 0 01-5 0v-1a1.5 1.5 0 00-3 0v1a2.5 2.5 0 01-5 0v-2A6.5 6.5 0 019.5 3V2z" />
      <path d="M12 13v8M8 21h8" />
    </svg>
  ),
  Stats: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M8 17V13M12 17V9M16 17v-3" />
    </svg>
  ),
  Calendar: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  ),
  Deadline: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 3" />
    </svg>
  ),
  Sun: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
    </svg>
  ),
  Moon: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
    </svg>
  ),
  Logout: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
    </svg>
  ),
};

const NAV_ITEMS = [
  { to: "/",          label: "Today",       icon: Icons.Home },
  { to: "/focus",     label: "Focus",       icon: Icons.Focus },
  { to: "/todo",      label: "Tasks",       icon: Icons.Tasks },
  { to: "/mindful",   label: "Mindfulness", icon: Icons.Mind },
  { to: "/dashboard", label: "Stats",       icon: Icons.Stats },
  { to: "/deadline",  label: "Deadlines",   icon: Icons.Deadline },
  { to: "/calendar",  label: "Calendar",    icon: Icons.Calendar },
];

const CONNECTORS = [
  {
    id: "gmail",
    label: "Gmail",
    color: "#ea4335",
    icon: () => (
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M20 4H4C2.9 4 2 4.9 2 6v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 2-8 5-8-5h16zm0 12H4V8l8 5 8-5v10z" />
      </svg>
    ),
  },
  {
    id: "slack",
    label: "Slack",
    color: "#4a154b",
    icon: () => (
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M5.042 15.165a2.528 2.528 0 01-2.52 2.523A2.528 2.528 0 010 15.165a2.527 2.527 0 012.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 012.521-2.52 2.527 2.527 0 012.521 2.52v6.313A2.528 2.528 0 018.834 24a2.528 2.528 0 01-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 01-2.521-2.52A2.528 2.528 0 018.834 0a2.528 2.528 0 012.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 012.521 2.521 2.528 2.528 0 01-2.521 2.521H2.522A2.528 2.528 0 010 8.834a2.528 2.528 0 012.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 012.522-2.521A2.528 2.528 0 0124 8.834a2.528 2.528 0 01-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 01-2.523 2.521 2.527 2.527 0 01-2.52-2.521V2.522A2.527 2.527 0 0115.165 0a2.528 2.528 0 012.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 012.523 2.522A2.528 2.528 0 0115.165 24a2.527 2.527 0 01-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 01-2.52-2.523 2.526 2.526 0 012.52-2.52h6.313A2.527 2.527 0 0124 15.165a2.528 2.528 0 01-2.522 2.523h-6.313z" />
      </svg>
    ),
  },
  {
    id: "gcal",
    label: "Google Calendar",
    color: "#1a73e8",
    icon: () => (
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M19 3h-1V1h-2v2H8V1H6v2H5C3.9 3 3 3.9 3 5v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z" />
      </svg>
    ),
  },
];

function Sidebar({ theme, setTheme, onLogout }) {
  const location = useLocation();
  const { energy, setEnergy } = useEnergy();
  const ENERGY_EMOJIS = ["💀", "😔", "😐", "⚡", "🔥"];

  return (
    <nav className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-logo">BB</div>
        <div>
          <div className="sidebar-title">Bouncy Brain</div>
          <div className="sidebar-subtitle">ADHD Buddy</div>
        </div>
      </div>

      {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
        <Link
          key={to}
          to={to}
          className={`nav-item ${location.pathname === to ? "active" : ""}`}
        >
          <Icon />
          {label}
        </Link>
      ))}

      <div className="connectors-section">
        <div className="connectors-label">Connectors</div>
        {CONNECTORS.map(({ id, label, color, icon: Icon }) => (
          <Link
            key={id}
            to="/connectors"
            className={`connector-item ${location.pathname === "/connectors" ? "active" : ""}`}
          >
            <span className="connector-icon" style={{ color, background: color + "20" }}>
              <Icon />
            </span>
            <span className="connector-name">{label}</span>
          </Link>
        ))}
      </div>

      <div className="sidebar-footer">
        <div className="nav-divider" />

        <div className="energy-selector">
          <div className="energy-label">Energy level</div>
          <div className="energy-dots">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                className={`energy-dot ${n <= energy ? "filled" : ""}`}
                onClick={() => setEnergy(n)}
                title={`${ENERGY_EMOJIS[n - 1]} Level ${n}`}
              >
                {n <= energy ? "⚡" : ""}
              </button>
            ))}
          </div>
        </div>

        <button
          className="theme-toggle"
          onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
        >
          {theme === "dark" ? <Icons.Sun /> : <Icons.Moon />}
          {theme === "dark" ? "Light mode" : "Dark mode"}
        </button>

        <button className="logout-btn" onClick={onLogout}>
          <Icons.Logout />
          Logout
        </button>
      </div>
    </nav>
  );
}

function ProtectedRoute({ children }) {
  const { user, loading } = useUser();
  if (loading) return null;
  if (!user) return <Auth />;
  return children;
}

export default function App() {
  const { user, setUser, setToken } = useUser();
  const [theme, setTheme] = useState(
    () => localStorage.getItem("bb-theme") || "dark"
  );

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("bb-theme", theme);
  }, [theme]);

  useEffect(() => {
    if ("Notification" in window && Notification.permission !== "granted") {
      Notification.requestPermission();
    }
  }, []);

  function logout() {
    setUser(null);
    setToken(null);
  }

  return (
    <EnergyProvider>
      <div className="app-shell">
        {user && (
          <>
            <Sidebar theme={theme} setTheme={setTheme} onLogout={logout} />
            <FocusOverlay />
          </>
        )}

        <main className="main-content">
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/focus" element={<ProtectedRoute><FocusTimer /></ProtectedRoute>} />
            <Route path="/todo" element={<ProtectedRoute><TodoList /></ProtectedRoute>} />
            <Route path="/mindful" element={<ProtectedRoute><Mindfulness /></ProtectedRoute>} />
            <Route path="/deadline" element={<ProtectedRoute><DeadlineTimer /></ProtectedRoute>} />
            <Route path="/calendar" element={<ProtectedRoute><Calendar /></ProtectedRoute>} />
            <Route path="/connectors" element={<ProtectedRoute><ConnectorsPage /></ProtectedRoute>} />
          </Routes>
        </main>
      </div>
    </EnergyProvider>
  );
}
