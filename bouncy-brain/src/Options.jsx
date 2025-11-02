const options = [
  "Focus Timer", "Anxiety Relief", "Arousal", "Attention Boost", "ASMR",
  "Baby Sleep", "Binaural Beats", "Brain Massage", "Chores", "Create",
  "Deep Work", "Self Care", "Relax", "Meditate", "Wake Up"
];

export const Options=()=> {
  return (
    <div className="scenarios-container">
      <h2 className="scenarios-title">Scenarios</h2>
      <div className="scenarios-buttons">
        {Options.map((s, i) => (
          <button key={i} className="scenario-btn">
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}