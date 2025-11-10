

import React, { useState, useEffect } from 'react';


const Meditate = () => {
  const [seconds, setSeconds] = useState(60);
  const [isMeditating, setIsMeditating] = useState(false);

  useEffect(() => {
    let timer;
    if (isMeditating && seconds > 0) {
      timer = setInterval(() => setSeconds((s) => s - 1), 1000);
    } else if (seconds === 0) {
      clearInterval(timer);
      alert('Meditation complete 🕊️');
    }
    return () => clearInterval(timer);
  }, [isMeditating, seconds]);

  return (
    <div className="meditate">
      <h2>🧘 Guided Meditation</h2>
      <p>Duration: {seconds}s</p>
      <button onClick={() => setIsMeditating(!isMeditating)}>
        {isMeditating ? 'Pause' : 'Start'}
      </button>
      <button onClick={() => { setSeconds(60); setIsMeditating(false); }}>Reset</button>
    </div>
  );
};

export default Meditate;
