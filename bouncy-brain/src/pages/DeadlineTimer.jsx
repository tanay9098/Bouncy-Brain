        
import React, { useState, useEffect } from 'react';


const DeadlineTimer = () => {
  const [deadline, setDeadline] = useState('');
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    if (!deadline) return;

    const interval = setInterval(() => {
      const now = new Date();
      const target = new Date(deadline);
      const diff = target - now;

      if (diff <= 0) {
        setTimeLeft('Deadline reached!');
        clearInterval(interval);
      } else {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((diff / 1000 / 60) % 60);
        const seconds = Math.floor((diff / 1000) % 60);
        setTimeLeft(`${days}d ${hours}h ${minutes}m ${seconds}s`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [deadline]);

  return (
    <div className="deadline-timer">
      <h2>🕓 Deadline Timer</h2>
      <input
        type="datetime-local"
        onChange={(e) => setDeadline(e.target.value)}
        value={deadline}
      />
      <div className="time-left">{timeLeft || 'Set your deadline ⏳'}</div>
    </div>
  );
};

export default DeadlineTimer;
