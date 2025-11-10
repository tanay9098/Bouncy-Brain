
import React, { useState } from 'react';


const SelfCare = () => {
  const [quote, setQuote] = useState('');

  const affirmations = [
    'You are enough. 🌸',
    'Progress, not perfection. 🌿',
    'Take breaks without guilt. ☕',
    'Be gentle with yourself today. 💫',
    'You’re doing better than you think. 💖'
  ];

  const getAffirmation = () => {
    const random = affirmations[Math.floor(Math.random() * affirmations.length)];
    setQuote(random);
  };

  return (
    <div className="self-care">
      <h2>💖 Self-Care Reminder</h2>
      <button onClick={getAffirmation}>Show Affirmation</button>
      <p>{quote}</p>
    </div>
  );
};

export default SelfCare;
