import React, { useEffect, useState } from "react";
import { api } from "../api";

export default function DeadlineTimer(){
  const [events, setEvents] = useState([]);

  useEffect(()=>{ load(); }, []);
  async function load(){
    try { const res = await api.get("/google/events"); setEvents(res.events || []); } catch(e){ setEvents([]); }
  }

  async function notify(e){
    try {
      await api.post("/push/notify", { title: `Deadline: ${e.summary}`, body: `Happens at ${e.start?.dateTime || e.start?.date}` });
      alert("Notification sent.");
    } catch(err){ alert("Notify failed"); }
  }

  return (
    <div className="app">
      <div className="page-header"><h2>Deadlines</h2><div className="small">Sync with Google Calendar</div></div>
      <div className="main-grid">
        <div className="card">
          {events.length === 0 ? (
            <div className="small">No events found or Google not connected</div>
          ) : events.map(ev=>(
            <div key={ev.id} style={{padding:'10px 0', borderBottom:'1px dashed #f0f6f9'}}>
              <div style={{fontWeight:700}}>{ev.summary}</div>
              <div className="meta">{ev.start?.dateTime || ev.start?.date}</div>
              <div style={{marginTop:8}}><button className="btn secondary" onClick={()=>notify(ev)}>Notify me</button></div>
            </div>
          ))}
        </div>

        <aside className="card">
          <h4>Quick tip</h4>
          <div className="small">Connect Google Calendar in Focus Timer (Deadline mode) to surface upcoming deadlines here.</div>
        </aside>
      </div>
    </div>
  );
}
