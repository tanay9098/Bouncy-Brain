import React, { useEffect, useRef, useState } from "react";
import Affirmations from "./Affirmations";
import { tabAlertSound } from "../utils/sound";

import { api } from "../api";

const MODES = {
  pomodoro: { work:25, brk:5, label:"Pomodoro" },
  deep: { work:50, brk:10, label:"Deep Work" },
  deadline: { work:30, brk:5, label:"Deadline" }
};

export default function FocusTimer(){
  const [mode, setMode] = useState("pomodoro");
  const [workMins, setWorkMins] = useState(MODES.pomodoro.work);
  const [breakMins,setBreakMins] = useState(MODES.pomodoro.brk);
  const [isWork, setIsWork] = useState(true);
  const [seconds, setSeconds] = useState(workMins*60);
  const [active, setActive] = useState(false);
  const intervalRef = useRef();
  const affirmRef = useRef();

  useEffect(()=> setSeconds((isWork?workMins:breakMins)*60), [workMins,breakMins,isWork]);

  useEffect(()=>{
    if(active && seconds>0){
      intervalRef.current = setInterval(()=> setSeconds(s=>s-1), 1000);
    } else if(seconds===0 && active){
      clearInterval(intervalRef.current);
      setActive(false);
      completeSession();
    }
    return ()=> clearInterval(intervalRef.current);
  }, [active, seconds]);

  useEffect(()=>{
    function onVisibility(){
      if(document.visibilityState === 'hidden' && active){
        tabAlertSound.play();
        if(affirmRef.current) affirmRef.current.messageForContext('tab-change');
        setActive(false);
      }
    }
    document.addEventListener('visibilitychange', onVisibility);
    return ()=> document.removeEventListener('visibilitychange', onVisibility);
  }, [active]);

  useEffect(()=> {
    if(mode === 'pomodoro'){ setWorkMins(25); setBreakMins(5); }
    if(mode === 'deadline'){ setWorkMins(30); setBreakMins(5); }
    // deep keeps whatever user sets
  }, [mode]);

  async function completeSession(){
    if(affirmRef.current) affirmRef.current.messageForContext('task-complete');
    alert("Session complete — Nicely done.");
    try { await api.post("/sessions", { type: mode, durationMins: isWork ? workMins : breakMins }); } catch(e){ /* ignore */ }
  }

  function toggle(){
    setActive(a=>!a);
  }
  function reset(){
    setActive(false);
    setSeconds((isWork?workMins:breakMins)*60);
  }
  function fmt(s){ const m=Math.floor(s/60); const ss=s%60; return `${m}:${ss<10? '0'+ss: ss}`; }

  async function connectGoogle(){
    try {
      const res = await api.get("/google/authurl");
      if(res.url) window.open(res.url, "_blank");
    } catch(e){ alert("Connect failed"); }
  }

  return (
    <div className="app">
      <div className="page-header">
        <h2>Bouncy Brain</h2>
        <div className="small">Soft pastel timer for calm sessions</div>
      </div>

      <div className="main-grid">
        <div className="card">
          <div className="mode-tabs" role="tablist">
            {Object.keys(MODES).map(k=>(
              <div key={k} onClick={()=>setMode(k)} className={`mode-tab ${mode===k? 'active':''}`}>{MODES[k].label}</div>
            ))}
          </div>

          {mode === 'deep' && (
            <div style={{display:'flex',gap:8,marginBottom:8}}>
              <div style={{flex:1}}>
                <label className="small">Work minutes</label>
                <input className="input" type="number" value={workMins} onChange={e=>setWorkMins(Number(e.target.value))}/>
              </div>
              <div style={{width:120}}>
                <label className="small">Break mins</label>
                <input className="input" type="number" value={breakMins} onChange={e=>setBreakMins(Number(e.target.value))}/>
              </div>
            </div>
          )}

          {mode === 'deadline' && (
            <div style={{marginBottom:8}}>
              <button className="btn" onClick={connectGoogle}>Connect Google Calendar</button>
              <div className="small" style={{marginTop:8}}>When connected you can sync deadlines (backend required)</div>
            </div>
          )}

          <div className="timer-large card">{fmt(seconds)}</div>

          <div style={{display:'flex',gap:10, marginTop:12}}>
            <button className="btn" onClick={toggle}>{active? 'Pause': 'Start'}</button>
            <button className="btn secondary" onClick={reset}>Reset</button>
            <button className="btn secondary" onClick={()=>{ setIsWork(w=>!w); setSeconds((!isWork?workMins:breakMins)*60) }}>
              Switch
            </button>
          </div>
        </div>

        <aside className="card">
          <h4>Affirmation</h4>
          <Affirmations ref={affirmRef} />
        </aside>
      </div>
    </div>
  );
}
