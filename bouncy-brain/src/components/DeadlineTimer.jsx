import React, { useEffect, useState } from "react";
import { api } from "../api";

export default function DeadlineTimer(){
  const [tasks, setTasks] = useState([]);

  useEffect(()=>{ load(); }, []);

  async function load(){
    const res = await api.get("/tasks");
    const upcoming = res.tasks.filter(t => t.dueAt);
    setTasks(upcoming);
  }

  return (
    <div className="app">
      <div className="page-header"><h2>Deadlines</h2><div className="small">Upcoming due dates from your tasks</div></div>

      <div className="main-grid">
        <div className="card">
          {tasks.length === 0 ? (
            <div className="small">No deadlines found</div>
          ) : tasks.map(t=>(
            <div key={t._id} style={{padding:'10px 0', borderBottom:'1px dashed #eee'}}>
              <div style={{fontWeight:700}}>{t.title}</div>
              <div className="meta">{new Date(t.dueAt).toLocaleString()}</div>
            </div>
          ))}
        </div>

        <aside className="card">
          <h4>Tip</h4>
          <div className="small">Add tasks with due dates to see them here or on the Calendar page.</div>
        </aside>
      </div>
    </div>
  );
}
