import React, { forwardRef, useImperativeHandle, useState } from "react";

const messages = {
  'tab-change': 'We notice a tab switch—take a slow breath and come back. Try 30s belly breaths.',
  'day-start': 'Good morning — pick 2 focus tasks and start small.',
  'day-end': 'You did a lot today. Note one small win — celebrate it.',
  'task-complete': 'Nice! Celebrate briefly — fist bump 👊.',
  'task-incomplete': 'It’s fine. Break it down smaller and try again.'
};

const Affirmations = forwardRef((props, ref) => {
  const [msg, setMsg] = useState("Affirmations");
  useImperativeHandle(ref, () => ({
    random(){ const arr = Object.values(messages); const m = arr[Math.floor(Math.random()*arr.length)]; setMsg(m); return m; },
    messageForContext(ctx){ const m = messages[ctx] || this.random(); setMsg(m); return m; }
  }));
  return <div className="affirm card">{msg}</div>;
});

export default Affirmations;
