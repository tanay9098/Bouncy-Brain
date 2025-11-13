import React, { useEffect, useState } from "react";
import { api } from "../api";

export default function Dashboard(){
  const [tasks, setTasks] = useState([]);
  useEffect(()=>{ load(); }, []);
  async function load(){
    try {
      const res = await api.get("/tasks");
      setTasks(res.tasks || []);
    } catch(e){ setTasks([]); }
  }

  return (
    <div className="app">
      <div className="page-header">
        <h2>Dashboard</h2>
        <p className="small">Progress and upcoming tasks</p>
      </div>
      <div className="main-grid">
        <div className="card">
          <h3>Recent tasks</h3>
          <ul className="todo-list" style={{marginTop:12}}>
            {tasks.slice(0,6).map(t=>(
              <li key={t._id} className="todo-item">
                <div>
                  <div style={{fontWeight:700}}>{t.title}</div>
                  <div className="meta">{t.dueAt ? new Date(t.dueAt).toLocaleString() : "No due date"}</div>
                </div>
                <div className="small">{t.completed ? "Done" : "Pending"}</div>
              </li>
            ))}
            {tasks.length===0 && <div className="small">No tasks yet</div>}
          </ul>
        </div>

        <aside className="card">
          <h3>Quick progress</h3>
          <div style={{marginTop:8}}>
            <div className="small">Sessions completed: —</div>
            <div className="small" style={{marginTop:8}}>Tasks done today: —</div>
          </div>
        </aside>
      </div>
    </div>
  );
}
