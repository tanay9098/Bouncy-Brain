import React from "react";
import { Link } from "react-router-dom";

export default function Home(){
  return (
    <div className="app">
      <div className="page-header">
        <div>
          <h2>Welcome</h2>
          <p className="small">Bouncy-Brain. Your ADD/ADHD buddy</p>
        </div>
      </div>

      <div className="main-grid">
        <div className="card">
          <h3>Get started</h3>
          <p className="small">Use Focus Timer to start a Pomodoro or Deep Work session.</p>
          <div style={{marginTop:12}}>
            <Link to="/focus"><button className="btn">Start Focus</button></Link>
          </div>
        </div>

        <aside className="card">
          <h4>Quick Actions</h4>
          <div style={{display:'flex',flexDirection:'column',gap:8,marginTop:10}}>
            <Link to="/todo"><button className="btn secondary">Open Todo</button></Link>
            <Link to="/mindful"><button className="btn secondary">Mindfulness</button></Link>
            <Link to="/deadline"><button className="btn secondary">Deadlines</button></Link>
            

          </div>
        </aside>
      </div>
      <div className="footer">Built for students — calm, clear, and focused.</div>
    </div>
  );
}
