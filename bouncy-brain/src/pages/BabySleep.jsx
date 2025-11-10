

import React, { useState } from 'react';


const BabySleep = () => {
  const [playing, setPlaying] = useState(false);
  const lullabies = [
    '🎵 Twinkle Twinkle Little Star',
    '🎵 Brahms’ Lullaby',
    '🎵 Rain Soundscape',
    '🎵 Ocean Waves',
    '🎵 Soft Piano Melody'
  ];

  const randomLullaby = lullabies[Math.floor(Math.random() * lullabies.length)];

  const togglePlay = () => {
    setPlaying(!playing);
    alert(playing ? 'Music stopped 🎧' : `${randomLullaby} now playing 🎶`);
  };

  return (
    <div className="baby-sleep">
      <h2>💤 Baby Sleep Mode</h2>
      <p>{playing ? 'Lullaby playing...' : 'Click to start soothing sounds'}</p>
      <button onClick={togglePlay}>{playing ? 'Stop' : 'Play'}</button>
    </div>
  );
};

export default BabySleep;
