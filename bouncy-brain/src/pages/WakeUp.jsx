import React, { useState } from 'react';


const Wakeup = () => {
  const [time, setTime] = useState('');

  const setAlarm = () => {
    if (!time) return alert('Please select a time ⏰');
    alert(`Wake-up alarm set for ${time}`);
  };

  return (
    <div className="wakeup">
      <h2>⏰ Wake-Up Reminder</h2>
      <input 
        type="time" 
        onChange={(e) => setTime(e.target.value)} 
        value={time} 
      />
      <button onClick={setAlarm}>Set Alarm</button>
    </div>
  );
};

export default Wakeup;
