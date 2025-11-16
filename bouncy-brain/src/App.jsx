import React from "react";
import { Routes, Route, Link } from "react-router-dom";
import Auth from "./components/Auth";
import Home from "./components/Home";
import Dashboard from "./components/Dashboard";
import FocusTimer from "./components/FocusTimer";
import TodoList from "./components/TodoList";
import Mindfulness from "./components/Mindfulness";
import DeadlineTimer from "./components/DeadlineTimer";
import { useUser } from "./contexts/UserContext";

export default function App(){
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
          <Route path="/" element={<Home/>} />
          <Route path="/auth" element={<Auth/>} />
          <Route path="/dashboard" element={<Dashboard/>} />
          <Route path="/focus" element={<FocusTimer/>} />
          <Route path="/todo" element={<TodoList/>} />
          <Route path="/mindful" element={<Mindfulness/>} />
          <Route path="/deadline" element={<DeadlineTimer/>} />
        </Routes>
      </main>
    </div>
  );
}
