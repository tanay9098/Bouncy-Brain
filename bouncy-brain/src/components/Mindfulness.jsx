import React, { useEffect, useRef, useState } from "react";
import Affirmations from "./Affirmations";

const MODES = {
  belly: { label: "Belly breathing", steps: ["Breathe in", "Breathe out"], ms: 4000 },
  box: { label: "Box breathing", steps: ["Inhale 4", "Hold 4", "Exhale 4", "Hold 4"], ms: 4000 },
  guided: { label: "Guided (audio)", steps: ["Listen & relax"], ms: 60000 }
};

export default function Mindfulness(){
  const [mode,setMode] = useState("belly");
  const [running,setRunning] = useState(false);
  const [step, setStep] = useState(0);
  const timerRef = useRef();
  const audioRef = useRef();
  const affirmRef = useRef();

  useEffect(()=>{
    function onVisibility(){
      if(document.visibilityState === 'hidden' && running){
        setRunning(false);
        if(affirmRef.current) affirmRef.current.messageForContext('tab-change');
      }
    }
    document.addEventListener('visibilitychange', onVisibility);
    return ()=> document.removeEventListener('visibilitychange', onVisibility);
  }, [running]);

  useEffect(()=>{
    if(!running){ clearInterval(timerRef.current); if(audioRef.current) audioRef.current.pause(); return; }
    const cfg = MODES[mode];
    if(mode === 'guided'){ if(audioRef.current) audioRef.current.play(); }
    timerRef.current = setInterval(()=>{
      setStep(s => {
        const next = s + 1;
        if(next >= cfg.steps.length){
          if(mode === 'guided'){ setRunning(false); if(affirmRef.current) affirmRef.current.messageForContext('task-complete'); return 0; }
          return 0;
        }
        return next;
      });
    }, cfg.ms);
    return ()=> clearInterval(timerRef.current);
  }, [running, mode]);

  return (
    <div className="app">
      <div className="page-header">
        <h2>Mindfulness</h2>
        <div className="small">Short practices to reset your attention.</div>
      </div>

      <div className="main-grid">
        <div className="card">
          <label className="small">Mode</label>
          <select className="select" value={mode} onChange={e=>setMode(e.target.value)} style={{marginTop:8}}>
            {Object.keys(MODES).map(k => <option key={k} value={k}>{MODES[k].label}</option>)}
          </select>

          <div className="mind-steps" style={{marginTop:18}}>
            {MODES[mode].steps[step % MODES[mode].steps.length]}
          </div>

          {mode === 'guided' && <audio ref={audioRef} controls src="/guided-sample.mp3" />}

          <div style={{marginTop:12}}>
            <button className="btn" onClick={()=>setRunning(true)}>Start</button>
            <button className="btn secondary" onClick={()=>setRunning(false)} style={{marginLeft:8}}>Stop</button>
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
