import React, { useEffect, useState } from "react";
import { api } from "../api";

export default function TodoList(){
  const [tasks, setTasks] = useState([]);
  const [title,setTitle] = useState("");
  const [due,setDue] = useState("");
  const [estimate,setEstimate] = useState(30);
  const [aiSuggest, setAiSuggest] = useState(null);

  useEffect(()=>{
    async function fetchData(){
      await load();
    }

   fetchData();}, []);
  async function load(){
    try {
      const res = await api.get("/tasks");
          setTasks((res.tasks || []).filter(t => !t.completed));   // << ADD THIS

    } catch(e){ setTasks([]); }
  }

  async function add(){
    try {
      await api.post("/tasks", { title, dueAt: due || null, estimateMins: Number(estimate) });
      setTitle(""); setDue(""); setEstimate(30);
      load();
    } catch(e){ alert("Could not add task"); }
  }

  async function complete(id){
    try { await api.put(`/tasks/${id}/complete`, {}); load(); } catch(e){ }
  }

  async function autoChunk(t){
    try {
      const res = await api.post(`/tasks/${t._id}/auto-chunk`, {});
      setAiSuggest({ task: res.task });
      load();
    } catch(e){ alert("Chunk failed"); }
  }

  async function acceptChunk(){
    setAiSuggest(null);
    load();
  }

  async function aiPrioritize(){
    // For now: sort by due date client-side; replace by ML backend call
    const ordered = tasks.slice().sort((a,b)=> (new Date(a.dueAt)||Infinity) - (new Date(b.dueAt)||Infinity));
    setTasks(ordered);
  }

  return (
    <div className="app">
      <div className="page-header">
        <h2>Todo</h2>
        <div className="small">Add tasks and use AI tools to chunk or suggest priority</div>
      </div>

      <div className="main-grid">
        <div className="card">
          <div style={{display:'flex',gap:8}}>
            <input className="input" placeholder="Task title" value={title} onChange={e=>setTitle(e.target.value)}/>
            <input className="input" type="datetime-local" value={due} onChange={e=>setDue(e.target.value)} style={{width:220}}/>
            <input className="input" type="number" value={estimate} onChange={e=>setEstimate(e.target.value)} style={{width:100}} />
            <button className="btn" onClick={add}>Add</button>
          </div>

          <div style={{marginTop:12}}>
            <button className="btn secondary" onClick={aiPrioritize}>AI Suggest Priority</button>
          </div>

          <ul className="todo-list" style={{marginTop:12}}>
            {tasks.map(t=>(
              <li className="todo-item" key={t._id}>
                <div>
                  <div style={{fontWeight:700}}>{t.title}</div>
                  <div className="meta">{t.dueAt ? new Date(t.dueAt).toLocaleString() : 'No due date'}</div>
                  {t.subtasks?.length && <ul style={{marginTop:8}}>{t.subtasks.map((s,i)=><li key={i} className="small">• {s.title}</li>)}</ul>}
                </div>
                <div style={{display:'flex',flexDirection:'column',gap:8}}>
                  <button className="btn" onClick={()=>complete(t._id)}>Complete</button>
                  <button className="btn secondary" onClick={()=>autoChunk(t)}>Auto-chunk</button>
                </div>
              </li>
            ))}
            {tasks.length===0 && <div className="small">No tasks yet</div>}
          </ul>

        </div>

        <aside className="card">
          <h4>AI Suggestion</h4>
          {aiSuggest ? (
            <>
              <div style={{fontWeight:700}}>{aiSuggest.task.title}</div>
              <ul style={{marginTop:8}}>
                {aiSuggest.task.subtasks?.map((s,i)=> <li className="small" key={i}>{s.title}</li>)}
              </ul>
              <div style={{marginTop:10}}>
                <button className="btn" onClick={acceptChunk}>Accept</button>
                <button className="btn secondary" onClick={()=>setAiSuggest(null)} style={{marginLeft:8}}>Dismiss</button>
              </div>
            </>
          ) : <div className="small">No suggestion. Try Auto-chunk on a task.</div>}
        </aside>
      </div>
    </div>
  );
}
