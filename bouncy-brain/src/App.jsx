import React from "react";
import { Routes, Route, Link } from "react-router-dom";
import Auth from "./components/Auth";
import Calendar from "./components/Calendar";

import Home from "./components/Home";
import Dashboard from "./components/Dashboard";
import FocusTimer from "./components/FocusTimer";
import TodoList from "./components/TodoList";
import Mindfulness from "./components/Mindfulness";
import DeadlineTimer from "./components/DeadlineTimer";
import { useUser } from "./contexts/UserContext";

export default function App(){
  function ProtectedRoute({ children }) {
  const { user } = useUser();
  if (!user) return <Auth />;
  return children;
}

  const { user, setUser, setToken } = useUser();

  function logout(){
    setUser(null); setToken(null);
  }

  return (
    <div className="app">
      <nav className="nav">
        <div className="brand">
          <div className="logo">AD</div>
          <div>
            <h1>Bouncy-Brain</h1>
            <div className="small">Your ADHD/ADD Buddy</div>
          </div>
        </div>
        <div className="nav-actions">
          <Link to="/">Home</Link>
          <Link to="/dashboard">Dashboard</Link>
          <Link to="/focus">Focus</Link>
          <Link to="/todo">Todo</Link>
          <Link to="/mindful">Mindfulness</Link>
          <Link to="/deadline">Deadlines</Link>

          {user ? <button onClick={logout}>Logout</button> : <Link to="/auth">Login</Link>}
        </div>
      </nav>

      <main>
        <Routes>
                              <Route path="/auth" element={<Auth/>} />

          <Route path="/" element={<ProtectedRoute><Home/></ProtectedRoute>} />

          
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard/></ProtectedRoute>} />
          <Route path="/focus" element={<ProtectedRoute><FocusTimer/></ProtectedRoute>} />
          <Route path="/todo" element={<ProtectedRoute><TodoList/></ProtectedRoute>} />
          <Route path="/mindful" element={<ProtectedRoute><Mindfulness/></ProtectedRoute>} />
          <Route path="/deadline" element={<ProtectedRoute><DeadlineTimer/></ProtectedRoute>} />
                    <Route path="/calendar" element={<ProtectedRoute><Calendar/></ProtectedRoute>} />

        </Routes>
      </main>
    </div>
  );
}
