import React, { useEffect, useState } from "react";
import { Routes, Route, Link, NavLink, useLocation } from "react-router-dom";
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
import EnergyControl from "./components/EnergyControl";
import { useUser } from "./contexts/UserContext";
import { EnergyProvider, useEnergy } from "./contexts/EnergyContext";

// ── Icons ────────────────────────────────────────────────────────────────
const Icons = {
  Today: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M3 10L12 3l9 7v10a1 1 0 01-1 1H4a1 1 0 01-1-1V10z" />
      <path d="M9 21V12h6v9" />
    </svg>
  ),
  Tasks: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M9 11l2 2 4-4" />
      <rect x="3" y="3" width="18" height="18" rx="3" />
    </svg>
  ),
  Schedule: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  ),
  Progress: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M8 17V13M12 17V9M16 17v-3" />
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
  Focus: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="12" cy="12" r="1" fill="currentColor" />
    </svg>
  ),
  Settings: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.07 4.93a10 10 0 010 14.14M4.93 4.93a10 10 0 000 14.14" />
    </svg>
  ),
  Plug: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M12 22V12M5 12H19M8 12V7a4 4 0 018 0v5" />
    </svg>
  ),
  More: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
      <circle cx="5" cy="12" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="19" cy="12" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  ),
};

// Collapsed to 4 primary destinations
const NAV_ITEMS = [
  { to: "/",          label: "Today",    icon: Icons.Today },
  { to: "/todo",      label: "Tasks",    icon: Icons.Tasks },
  { to: "/calendar",  label: "Schedule", icon: Icons.Schedule },
  { to: "/dashboard", label: "Progress", icon: Icons.Progress },
];

// Secondary pages accessible from sidebar "More" section
const SECONDARY_NAV = [
  { to: "/focus",    label: "Focus Timer", icon: Icons.Focus },
  { to: "/mindful",  label: "Mindfulness", icon: Icons.Today },
  { to: "/deadline", label: "Deadlines",   icon: Icons.Schedule },
];

const CONNECTORS = [
  {
    id: "gmail",
    label: "Gmail",
    color: "#ea4335",
    icon: () => (
      <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
        <path d="M20 4H4C2.9 4 2 4.9 2 6v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 2-8 5-8-5h16zm0 12H4V8l8 5 8-5v10z" />
      </svg>
    ),
  },
  {
    id: "slack",
    label: "Slack",
    color: "#4a154b",
    icon: () => (
      <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
        <path d="M5.042 15.165a2.528 2.528 0 01-2.52 2.523A2.528 2.528 0 010 15.165a2.527 2.527 0 012.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 012.521-2.52 2.527 2.527 0 012.521 2.52v6.313A2.528 2.528 0 018.834 24a2.528 2.528 0 01-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 01-2.521-2.52A2.528 2.528 0 018.834 0a2.528 2.528 0 012.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 012.521 2.521 2.528 2.528 0 01-2.521 2.521H2.522A2.528 2.528 0 010 8.834a2.528 2.528 0 012.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 012.522-2.521A2.528 2.528 0 0124 8.834a2.528 2.528 0 01-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 01-2.523 2.521 2.527 2.527 0 01-2.52-2.521V2.522A2.527 2.527 0 0115.165 0a2.528 2.528 0 012.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 012.523 2.522A2.528 2.528 0 0115.165 24a2.527 2.527 0 01-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 01-2.52-2.523 2.526 2.526 0 012.52-2.52h6.313A2.527 2.527 0 0124 15.165a2.528 2.528 0 01-2.522 2.523h-6.313z" />
      </svg>
    ),
  },
  {
    id: "gcal",
    label: "Google Cal",
    color: "#1a73e8",
    icon: () => (
      <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
        <path d="M19 3h-1V1h-2v2H8V1H6v2H5C3.9 3 3 3.9 3 5v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z" />
      </svg>
    ),
  },
];

function Sidebar({ theme, setTheme, onLogout, open, onClose }) {
  const location = useLocation();

  return (
    <>
      {open && <div className="sidebar-backdrop" onClick={onClose} />}
      <nav className={`sidebar${open ? " open" : ""}`} role="navigation" aria-label="Main navigation">
        {/* Brand */}
        <div className="sidebar-brand">
          <div className="sidebar-logo" aria-hidden="true">BB</div>
          <div>
            <div className="sidebar-title">Bouncy Brain</div>
            <div className="sidebar-subtitle">ADHD Buddy</div>
          </div>
        </div>

        {/* Primary nav — 4 destinations */}
        <div className="sidebar-nav-section">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) => `nav-item${isActive ? " active" : ""}`}
              onClick={onClose}
            >
              <Icon />
              {label}
            </NavLink>
          ))}
        </div>

        {/* Secondary nav */}
        <div className="sidebar-nav-section" style={{ marginTop: 8 }}>
          <div className="sidebar-section-label">More</div>
          {SECONDARY_NAV.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => `nav-item nav-item-sm${isActive ? " active" : ""}`}
              onClick={onClose}
            >
              <Icon />
              {label}
            </NavLink>
          ))}
        </div>

        {/* Connectors — compact rows */}
        <div className="sidebar-nav-section" style={{ marginTop: 8 }}>
          <div className="sidebar-section-label">Connectors</div>
          {CONNECTORS.map(({ id, label, color, icon: Icon }) => (
            <Link
              key={id}
              to="/connectors"
              className={`connector-row${location.pathname === "/connectors" ? " active" : ""}`}
              onClick={onClose}
            >
              <span className="connector-row-icon" style={{ color, background: color + "20" }}>
                <Icon />
              </span>
              <span className="connector-row-label">{label}</span>
            </Link>
          ))}
        </div>

        {/* Pinned energy control */}
        <div className="sidebar-energy">
          <div className="sidebar-section-label">Energy level</div>
          <EnergyControl compact />
        </div>

        {/* Footer controls */}
        <div className="sidebar-footer">
          <button
            className="theme-toggle"
            onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <Icons.Sun /> : <Icons.Moon />}
            {theme === "dark" ? "Light mode" : "Dark mode"}
          </button>
          <button className="logout-btn" onClick={onLogout} aria-label="Logout">
            <Icons.Logout />
            Logout
          </button>
        </div>
      </nav>
    </>
  );
}

function TopBar({ theme, setTheme, onMenuClick }) {
  const location = useLocation();
  const currentNav = [...NAV_ITEMS, ...SECONDARY_NAV].find((n) =>
    n.to === "/" ? location.pathname === "/" : location.pathname.startsWith(n.to)
  );
  const pageTitle = currentNav?.label ?? "Bouncy Brain";

  return (
    <header className="top-bar" role="banner">
      <div className="top-bar-left">
        <button
          className="top-bar-menu-btn"
          onClick={onMenuClick}
          aria-label="Open navigation menu"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
        <div className="top-bar-brand">
          <div className="sidebar-logo" style={{ width: 28, height: 28, fontSize: 12 }} aria-hidden="true">BB</div>
          <span className="top-bar-page-title">{pageTitle}</span>
        </div>
      </div>

      <div className="top-bar-right">
        <Link
          to="/connectors"
          className="top-bar-icon-btn"
          title="Connectors"
          aria-label="Manage connectors"
        >
          <Icons.Plug />
        </Link>
        <button
          className="top-bar-icon-btn"
          onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
          aria-label="Toggle theme"
        >
          {theme === "dark" ? <Icons.Sun /> : <Icons.Moon />}
        </button>
      </div>
    </header>
  );
}

// Bottom nav for mobile (4 primary destinations + More)
function BottomNav({ onMoreClick }) {
  return (
    <nav className="bottom-nav" aria-label="Mobile navigation">
      {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === "/"}
          className={({ isActive }) => `bottom-nav-item${isActive ? " active" : ""}`}
        >
          <Icon />
          <span>{label}</span>
        </NavLink>
      ))}
      <button
        className="bottom-nav-item"
        onClick={onMoreClick}
        aria-label="More options"
        aria-haspopup="dialog"
      >
        <Icons.More />
        <span>More</span>
      </button>
    </nav>
  );
}

// Slide-up sheet for secondary nav on mobile
function MoreSheet({ open, onClose, theme, setTheme, onLogout }) {
  return (
    <>
      {open && (
        <div
          className="bottom-sheet-overlay"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      <div
        className={`bottom-sheet${open ? " open" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label="More navigation"
      >
        <div className="bottom-sheet-handle" aria-hidden="true" />

        <div className="bottom-sheet-section">
          {SECONDARY_NAV.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => `nav-item${isActive ? " active" : ""}`}
              onClick={onClose}
            >
              <Icon />
              {label}
            </NavLink>
          ))}
          <NavLink
            to="/connectors"
            className={({ isActive }) => `nav-item${isActive ? " active" : ""}`}
            onClick={onClose}
          >
            <Icons.Plug />
            Connectors
          </NavLink>
        </div>

        <div className="bottom-sheet-section">
          <div className="sidebar-section-label">Energy level</div>
          <div style={{ padding: "4px 0" }}>
            <EnergyControl compact />
          </div>
        </div>

        <div className="bottom-sheet-footer">
          <button
            className="theme-toggle"
            onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
          >
            {theme === "dark" ? <Icons.Sun /> : <Icons.Moon />}
            {theme === "dark" ? "Light mode" : "Dark mode"}
          </button>
          <button
            className="logout-btn"
            onClick={() => { onLogout(); onClose(); }}
          >
            <Icons.Logout />
            Logout
          </button>
        </div>
      </div>
    </>
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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

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
    setSidebarOpen(false);
    setMoreOpen(false);
  }

  return (
    <EnergyProvider>
      <div className="app-shell">
        {user && (
          <>
            <Sidebar
              theme={theme}
              setTheme={setTheme}
              onLogout={logout}
              open={sidebarOpen}
              onClose={() => setSidebarOpen(false)}
            />
            <FocusOverlay />
          </>
        )}

        <div className="main-wrapper">
          {user && (
            <TopBar
              theme={theme}
              setTheme={setTheme}
              onMenuClick={() => setSidebarOpen((o) => !o)}
            />
          )}

          <main className="main-content" id="main-content">
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

          {user && (
            <>
              <BottomNav onMoreClick={() => setMoreOpen(true)} />
              <MoreSheet
                open={moreOpen}
                onClose={() => setMoreOpen(false)}
                theme={theme}
                setTheme={setTheme}
                onLogout={logout}
              />
            </>
          )}
        </div>
      </div>
    </EnergyProvider>
  );
}
