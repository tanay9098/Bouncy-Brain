
import React, { useState, useEffect } from 'react';


const FocusTimer = () => {
  const [seconds, setSeconds] = useState(1500); // 25 mins default
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    let timer;
    if (isActive && seconds > 0) {
      timer = setInterval(() => setSeconds((prev) => prev - 1), 1000);
    } else if (seconds === 0) {
      clearInterval(timer);
      alert('Focus session complete!');
    }
    return () => clearInterval(timer);
  }, [isActive, seconds]);

  const toggleTimer = () => setIsActive(!isActive);
  const resetTimer = () => {
    setIsActive(false);
    setSeconds(1500);
  };

  const formatTime = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' + s : s}`;
  };

  return (
    <div className="focus-timer">
      <h2>🎯 Focus Timer</h2>
      <div className="timer-display">{formatTime(seconds)}</div>
      <div className="timer-buttons">
        <button onClick={toggleTimer}>{isActive ? 'Pause' : 'Start'}</button>
        <button onClick={resetTimer}>Reset</button>
      </div>
    </div>
  );
};

export default FocusTimer;
