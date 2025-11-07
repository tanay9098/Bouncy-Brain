import { useNavigate } from 'react-router-dom';

const options = [
  "Focus Timer", "Deadline-timer", "Pomodoro", "Anxiety Relief", "Attention Boost",
  "ASMR", "Baby Sleep", "Binaural Beats", "Todo-list", "Create",
  "Deep Work", "Self Care", "Relax", "Meditate", "Wake Up", "Gamify Productivity"
];

export const Options = () => {
  const navigate = useNavigate();

  // Helper to convert option name to path
  const getPath = (option) => `/${option.toLowerCase().replace(/\s+/g, '')}`;

  return (
    <div className="scenarios-container">
      <h2 className="scenarios-title">
        Apply all the options that you want for your application
      </h2>

      <div className="scenarios-buttons">
        {options.map((s, i) => (
          <button
            key={i}
            className="scenario-btn"
            onClick={() => navigate(getPath(s))}
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
};
