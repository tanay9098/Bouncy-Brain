import React, { useEffect, useState } from "react";
import Meditate from "./Meditate";
import SelfCare from "./SelfCare";
import AnxietyRelief from "./AnxietyRelief";
import AttentionBoost from "./AttentionBoost";
import Pomodoro from "./Pomodoro";
import DeepWork from "./DeepWork";
import FocusTimer from "./FocusTimer";
import GamifyProductivity from "./GamifyProductivity";
import TodoList from "./TodoList";
import WakeUp from "./WakeUp";
import Relax from "./Relax";
import DeadlineTimer from "./DeadlineTimer";
import BabySleep from "./BabySleep";

const componentMap = {
  "Meditate": <Meditate />,
  "Self Care": <SelfCare />,
  "Anxiety Relief": <AnxietyRelief />,
  "Attention Boost": <AttentionBoost />,
  "Pomodoro": <Pomodoro />,
  "Deep Work": <DeepWork />,
  "Focus Timer": <FocusTimer />,
  "Gamify Productivity": <GamifyProductivity />,
  "Todo-list": <TodoList />,
  "Wake Up": <WakeUp />,
  "Relax": <Relax />,
  "Deadline-timer": <DeadlineTimer />,
  "Baby Sleep": <BabySleep />
};

const MyFeatures = () => {
  const [features, setFeatures] = useState([]);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("selectedOptions")) || [];
    setFeatures(saved);
  }, []);

  return (
    <div style={{ padding: "20px" }}>
      <h2>Your Selected Features</h2>
      {features.length === 0 ? (
        <p>No features selected yet. Go back and choose!</p>
      ) : (
        features.map((feature, i) => (
          <div key={i} className="feature-box">
            {componentMap[feature] || <p>{feature} (Coming soon)</p>}
          </div>
        ))
      )}
    </div>
  );
};

export default MyFeatures;
