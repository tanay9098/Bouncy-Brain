
import React, { useState, useEffect } from "react";


const DeepWork = () => {
  const [time, setTime] = useState(50 * 60); // 50 min deep work session
  const [isActive, setIsActive] = useState(false);
  const [quote, setQuote] = useState("");

  const motivationalQuotes = [
    "Focus on progress, not perfection.",
    "Deep work unlocks deep results.",
    "Your future self will thank you.",
    "Distractions destroy depth — stay locked in.",
    "Consistency beats intensity."
  ];

  useEffect(() => {
    setQuote(motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)]);
  }, []);

  useEffect(() => {
    let interval = null;
    if (isActive && time > 0) {
      interval = setInterval(() => setTime((t) => t - 1), 1000);
    } else if (time === 0) {
      clearInterval(interval);
      setIsActive(false);
      alert("Session Complete! Take a short break.");
    }
    return () => clearInterval(interval);
  }, [isActive, time]);

  const toggleTimer = () => setIsActive(!isActive);
  const resetTimer = () => {
    setIsActive(false);
    setTime(50 * 60);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className={`deepwork-container ${isActive ? "focus-mode" : ""}`}>
      <h1>Deep Work Mode</h1>
      <p className="quote">“{quote}”</p>

      <div className="timer">{formatTime(time)}</div>

      <div className="buttons">
        <button onClick={toggleTimer} className="start-btn">
          {isActive ? "Pause" : "Start"}
        </button>
        <button onClick={resetTimer} className="reset-btn">Reset</button>
      </div>

      {isActive && <p className="focus-msg">Focus mode ON — distractions off 🔇</p>}
    </div>
  );
};

export default DeepWork;
