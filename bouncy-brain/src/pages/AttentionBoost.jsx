
import React, { useState } from 'react';


const AttentionBoost = () => {
  const [tip, setTip] = useState('');

  const tips = [
    '🧍 Stand up, stretch, and roll your shoulders.',
    '🚶 Take a 2-minute walk to refresh your mind.',
    '💧 Drink a glass of water for instant focus.',
    '🧠 Try the “5-4-3-2-1” grounding method.',
    '🎧 Play instrumental music to stay in flow.'
  ];

  const getTip = () => {
    const random = tips[Math.floor(Math.random() * tips.length)];
    setTip(random);
  };

  return (
    <div className="attention-boost">
      <h2>⚡ Attention Boost</h2>
      <button onClick={getTip}>Give me a focus tip</button>
      <p>{tip}</p>
    </div>
  );
};

export default AttentionBoost;
