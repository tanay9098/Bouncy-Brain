
import React, { useState } from 'react';


const Relax = () => {
  const [message, setMessage] = useState('');

  const tips = [
    'Take a deep breath and stretch 🌬️',
    'Close your eyes and count to 10 slowly 😌',
    'Listen to calming music 🎶',
    'Step outside for a short walk 🌳',
    'Focus on one slow inhale and exhale 🌫️'
  ];

  const getTip = () => {
    const random = tips[Math.floor(Math.random() * tips.length)];
    setMessage(random);
  };

  return (
    <div className="relax">
      <h2>🌿 Relax Mode</h2>
      <button onClick={getTip}>Give me a relax tip</button>
      <p>{message}</p>
    </div>
  );
};

export default Relax;
