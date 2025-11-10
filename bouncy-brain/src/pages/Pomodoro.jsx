import React, { useState, useEffect } from 'react';


const Pomodoro = () => {
  const [time, setTime] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [sessions, setSessions] = useState(0);

  useEffect(() => {
    let timer;
    if (isActive && time > 0) {
      timer = setInterval(() => setTime((prev) => prev - 1), 1000);
    } else if (time === 0) {
      clearInterval(timer);
      setSessions((prev) => prev + 1);
      alert('Pomodoro session complete! Take a short break 🍵');
      setTime(5 * 60);
      setIsActive(false);
    }
    return () => clearInterval(timer);
  }, [isActive, time]);

  const formatTime = (t) => {
    const m = Math.floor(t / 60);
    const s = t % 60;
    return `${m}:${s < 10 ? '0' + s : s}`;
  };

  return (
    <div className="pomodoro">
      <h2>🍅 Pomodoro Timer</h2>
      <div className="time-display">{formatTime(time)}</div>
      <div className="buttons">
        <button onClick={() => setIsActive(!isActive)}>
          {isActive ? 'Pause' : 'Start'}
        </button>
        <button onClick={() => { setTime(25 * 60); setIsActive(false); }}>Reset</button>
      </div>
      <p>Sessions Completed: {sessions}</p>
    </div>
  );
};

export default Pomodoro;
