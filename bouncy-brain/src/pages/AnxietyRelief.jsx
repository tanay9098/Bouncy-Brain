import React, { useState, useEffect } from 'react';

const AnxietyRelief = () => {
  const [step, setStep] = useState(0);
  const steps = [
    'Breathe in deeply... 🌬️',
    'Hold for 4 seconds ⏸️',
    'Slowly exhale... 😮‍💨',
    'Relax your shoulders and unclench your jaw 🫶',
    'Good. You’re doing great 💫'
  ];

  useEffect(() => {
    if (step === 0) return;
    const timer = setTimeout(() => {
      if (step < steps.length) setStep(step + 1);
      else setStep(0);
    }, 3000);
    return () => clearTimeout(timer);
  }, [step]);

  return (
    <div className="anxiety-relief">
      <h2>😌 Anxiety Relief</h2>
      <p>{step === 0 ? 'Click below to start breathing cycle' : steps[step - 1]}</p>
      <button onClick={() => setStep(1)}>Start Calm Cycle</button>
    </div>
  );
};

export default AnxietyRelief;
