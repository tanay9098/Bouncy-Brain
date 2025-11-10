import { useNavigate } from 'react-router-dom';
import React, { useState, useEffect } from 'react';

const options = [
  "Focus Timer", "Deadline-timer", "Pomodoro", "Anxiety Relief", "Attention Boost",
  "ASMR", "Baby Sleep", "Binaural Beats", "Todo-list", "Create",
  "Deep Work", "Self Care", "Relax", "Meditate", "Wake Up", "Gamify Productivity"
];

export const Options = () => {
  const navigate = useNavigate();
  const [selectedOptions, setSelectedOptions] = useState([]);

  // Load saved preferences on page load
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("selectedOptions")) || [];
    setSelectedOptions(saved);
  }, []);

  // Save preferences whenever updated
  useEffect(() => {
    localStorage.setItem("selectedOptions", JSON.stringify(selectedOptions));
  }, [selectedOptions]);

  const toggleOption = (option) => {
    setSelectedOptions((prev) =>
      prev.includes(option)
        ? prev.filter((o) => o !== option)
        : [...prev, option]
    );
  };

  const getPath = (option) => `/${option.toLowerCase().replace(/\s+/g, '')}`;

  return (
    <div className="scenarios-container">
      <h2 className="scenarios-title">Select the features you want in your app</h2>

      <div className="scenarios-buttons">
        {options.map((option, i) => (
          <label key={i} className="scenario-label">
            <input
              type="checkbox"
              checked={selectedOptions.includes(option)}
              onChange={() => toggleOption(option)}
            />
            {option}
          </label>
        ))}
      </div>

      <button
        className="scenario-btn"
        onClick={() => navigate('/myfeatures')}
        style={{ marginTop: '20px' }}
      >
        Go to My Features
      </button>
    </div>
  );
};
