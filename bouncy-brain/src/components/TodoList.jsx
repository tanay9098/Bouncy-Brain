import { useEffect, useState } from "react";
import api from "../services/api";
import { notify } from "../utils/notify";
import { scheduleDeadline, clearDeadline } from "../utils/deadlineScheduler";
import { useEnergy } from "../contexts/EnergyContext";

// ── Dread pip colours ────────────────────────────────────────────────────
function DreadMeter({ score, onChange }) {
  return (
    <div className="dread-meter" title={`Dread: ${score}/5`}>
      <span className="text-xs text-muted" style={{ marginRight: 4 }}>Dread</span>
      {[1, 2, 3, 4, 5].map((n) => (
        <div
          key={n}
          className={`dread-pip ${n <= score ? `active-${score}` : ""}`}
          onClick={() => onChange && onChange(n)}
        />
      ))}
    </div>
  );
}

// ── Priority badge ───────────────────────────────────────────────────────
function PriorityBadge({ level }) {
  if (!level) return null;
  const cls = level === "High" ? "badge-high" : level === "Medium" ? "badge-medium" : "badge-low";
  return <span className={`badge ${cls}`}>{level}</span>;
}

// ── Suggestion style helpers ─────────────────────────────────────────────
const SUGGESTION_STYLES = {
  priority:   { borderLeft: "3px solid #7c3aed", background: "var(--violet-dim)" },
  chunk:      { borderLeft: "3px solid #10b981", background: "var(--green-dim)" },
  deadline:   { borderLeft: "3px solid #ef4444", background: "var(--red-dim)" },
  "quick-win": { borderLeft: "3px solid #f59e0b", background: "var(--amber-dim)" },
  nudge:      { borderLeft: "3px solid #3b82f6", background: "rgba(59,130,246,0.08)" },
};

const SUGGESTION_LABELS = {
  priority: "Priority",
  chunk: "Break Down",
  deadline: "Urgent",
  "quick-win": "Quick Win",
  nudge: "Motivation",
};

export default function TodoList() {
  const { energy } = useEnergy();

  // Tasks
  const [tasks, setTasks] = useState([]);
  const [completing, setCompleting] = useState(null);
  const [reward, setReward] = useState(null);

  // New task form
  const [title, setTitle] = useState("");
  const [due, setDue] = useState("");
  const [estimate, setEstimate] = useState(30);
  const [dreadScore, setDreadScore] = useState(3);

  // Edit state
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDue, setEditDue] = useState("");
  const [editEstimate, setEditEstimate] = useState(30);
  const [editDread, setEditDread] = useState(3);

  // Brain dump
  const [dumpText, setDumpText] = useState("");
  const [dumpLoading, setDumpLoading] = useState(false);
  const [view, setView] = useState("tasks"); // "tasks" | "dump"

  // AI suggestions
  const [suggestions, setSuggestions] = useState([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [dismissedIds, setDismissedIds] = useState(new Set());

  useEffect(() => { load(); }, []);

  useEffect(() => {
    tasks.forEach((task) => {
      if (task.dueAt && !task.completed) scheduleDeadline(task);
    });
    return () => { tasks.forEach((t) => clearDeadline(t._id)); };
  }, [tasks]);

  useEffect(() => {
    if (tasks.length > 0) fetchSuggestions();
    else setSuggestions([]);
  }, [tasks.length]);

  // ── Data ──────────────────────────────────────────────────────────────
  async function load() {
    try {
      const res = await api.get("/tasks");
      setTasks((res.tasks || []).filter((t) => !t.completed));
    } catch { setTasks([]); }
  }

  async function fetchSuggestions() {
    setSuggestionsLoading(true);
    try {
      const res = await api.get("/tasks/ai/suggestions");
      const fresh = (res.suggestions || []).filter((s) => !dismissedIds.has(s.id));
      setSuggestions(fresh);
    } catch { setSuggestions([]); }
    finally { setSuggestionsLoading(false); }
  }

  // ── Task CRUD ─────────────────────────────────────────────────────────
  async function add() {
    if (!title.trim()) return;
    try {
      const res = await api.post("/tasks", {
        title: title.trim(),
        dueAt: due || null,
        estimateMins: Number(estimate),
        dreadScore: Number(dreadScore),
      });
      const task = res.task;
      if (task?.dueAt) {
        scheduleDeadline(task);
        notify("📅 Deadline set", `You'll be reminded when "${task.title}" is due.`);
      }
      setTitle(""); setDue(""); setEstimate(30); setDreadScore(3);
      load();
    } catch { alert("Could not add task"); }
  }

  async function complete(id) {
    setCompleting(id);
    showReward("✅");
    setTimeout(async () => {
      try {
        await api.put(`/tasks/${id}/complete`, {});
        clearDeadline(id);
        notify("✅ Task completed", "Well done. One less thing to worry about.");
        load();
      } catch {}
      setCompleting(null);
    }, 450);
  }

  async function autoChunk(t) {
    try {
      await api.post(`/tasks/${t._id}/auto-chunk`, {});
      load();
      notify("🧩 Chunked", `"${t.title}" has been broken into sub-tasks.`);
    } catch { alert("Chunk failed"); }
  }

  async function saveEdit(id) {
    try {
      await api.put(`/tasks/${id}`, {
        title: editTitle,
        dueAt: editDue || null,
        estimateMins: Number(editEstimate),
        dreadScore: Number(editDread),
      });
      setEditingId(null);
      load();
    } catch { alert("Failed to update task"); }
  }

  async function updateDread(id, score) {
    try {
      await api.put(`/tasks/${id}`, { dreadScore: score });
      setTasks((prev) => prev.map((t) => t._id === id ? { ...t, dreadScore: score } : t));
    } catch {}
  }

  // ── Brain Dump ────────────────────────────────────────────────────────
  async function submitDump() {
    if (!dumpText.trim()) return;
    setDumpLoading(true);
    try {
      const res = await api.post("/tasks/brain-dump", {
        text: dumpText,
        energyLevel: energy,
      });
      const count = res.tasks?.length || 0;
      notify("🧠 Dumped!", `${count} task${count !== 1 ? "s" : ""} extracted.`);
      setDumpText("");
      setView("tasks");
      load();
    } catch { alert("Brain dump failed"); }
    finally { setDumpLoading(false); }
  }

  // ── AI suggestion actions ─────────────────────────────────────────────
  async function acceptSuggestion(s) {
    try {
      await api.post(`/tasks/ai/suggestions/${s.id}/accept`, {
        type: s.type, taskId: s.taskId, data: s.data,
      });
      setSuggestions((p) => p.filter((x) => x.id !== s.id));
      setDismissedIds((p) => new Set([...p, s.id]));
      load();
    } catch {}
  }

  function dismissSuggestion(s) {
    api.post(`/tasks/ai/suggestions/${s.id}/reject`, {}).catch(() => {});
    setSuggestions((p) => p.filter((x) => x.id !== s.id));
    setDismissedIds((p) => new Set([...p, s.id]));
  }

  function showReward(emoji) {
    setReward(emoji);
    setTimeout(() => setReward(null), 900);
  }

  function fmtDue(d) {
    if (!d) return "No due date";
    const dt = new Date(d);
    const now = new Date();
    const h = (dt - now) / 3600000;
    if (h < 0) return "Overdue!";
    if (h < 24) return `Due in ${Math.round(h)}h`;
    return dt.toLocaleDateString();
  }

  // ── Sort: what next? (rule-based multi-factor) ────────────────────────
  function scoreTask(t) {
    const now = new Date();
    const hoursLeft = t.dueAt ? (new Date(t.dueAt) - now) / 3600000 : 168;
    const urgency = t.dueAt ? Math.exp(-Math.max(hoursLeft, 0) / 48) + 0.1 : 0.1;
    const taskDiff = Math.min((t.estimateMins || 30) / 120, 1);
    const userE = energy / 5;
    const energyMatch = 1 - Math.abs(taskDiff - userE) * 0.5;
    const dreadInverse = 1 - ((t.dreadScore || 3) - 1) / 8;
    const timeFit = (t.estimateMins || 30) <= 45 ? 1.2 : 0.9;
    return urgency * energyMatch * dreadInverse * timeFit;
  }

  const sortedTasks = [...tasks].sort((a, b) => scoreTask(b) - scoreTask(a));

  return (
    <div>
      {reward && <div className="reward-burst">{reward}</div>}

      <div className="flex items-center justify-between mb-4" style={{ flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 className="page-title">Tasks</h1>
          <p className="page-subtitle" style={{ margin: 0 }}>Brain dump, chunk, and conquer</p>
        </div>
        <div className="mode-tabs" style={{ margin: 0, width: "auto", flexShrink: 0 }}>
          <button
            className={`mode-tab ${view === "tasks" ? "active" : ""}`}
            onClick={() => setView("tasks")}
          >
            📋 Task List
          </button>
          <button
            className={`mode-tab ${view === "dump" ? "active" : ""}`}
            onClick={() => setView("dump")}
          >
            🧠 Brain Dump
          </button>
        </div>
      </div>

      <div className="grid-main">
        {/* ── Left Panel ──────────────────────────────────── */}
        <div className="stack">
          {view === "dump" ? (
            /* Brain Dump */
            <div className="card">
              <div className="card-title">Brain Dump</div>
              <p className="text-sm text-muted mb-3">
                Type anything — thoughts, tasks, worries. AI will parse it into structured tasks.
              </p>
              <div className="brain-dump-wrap mb-3">
                <textarea
                  className="textarea"
                  style={{ minHeight: 160 }}
                  placeholder="Just type whatever's in your head...&#10;&#10;e.g. Need to finish the report by Friday, call the dentist, study chapter 4 before the exam next week, also reply to Sara's email..."
                  value={dumpText}
                  onChange={(e) => setDumpText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && e.ctrlKey) submitDump();
                  }}
                />
                <div className="brain-dump-hint">Ctrl+Enter to submit</div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  className="btn btn-primary"
                  onClick={submitDump}
                  disabled={dumpLoading || !dumpText.trim()}
                >
                  {dumpLoading ? "⏳ Parsing..." : "🧠 Chunk with AI"}
                </button>
                <button className="btn btn-ghost" onClick={() => setDumpText("")}>
                  Clear
                </button>
              </div>
            </div>
          ) : (
            /* Task List view */
            <>
              {/* Add task row */}
              <div className="card card-sm">
                <div className="flex gap-2 mb-2" style={{ flexWrap: "wrap" }}>
                  <input
                    className="input"
                    style={{ flex: 2, minWidth: 160 }}
                    placeholder="New task..."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") add(); }}
                  />
                  <input
                    className="input"
                    type="datetime-local"
                    value={due}
                    onChange={(e) => setDue(e.target.value)}
                    style={{ flex: 1, minWidth: 180 }}
                  />
                  <input
                    className="input"
                    type="number"
                    placeholder="Min"
                    value={estimate}
                    onChange={(e) => setEstimate(e.target.value)}
                    style={{ width: 80 }}
                    min={1}
                  />
                  <button className="btn btn-primary" onClick={add}>
                    + Add
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <DreadMeter score={dreadScore} onChange={setDreadScore} />
                  <span className="text-xs text-muted">(set dread for new task)</span>
                </div>
              </div>

              {/* Task cards */}
              <div className="stack-sm">
                {sortedTasks.map((t, idx) => (
                  <div
                    key={t._id}
                    className={`task-card ${completing === t._id ? "completing" : ""}`}
                  >
                    {editingId === t._id ? (
                      /* Edit mode */
                      <div className="stack-sm">
                        <input
                          className="input"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                        />
                        <input
                          className="input"
                          type="datetime-local"
                          value={editDue}
                          onChange={(e) => setEditDue(e.target.value)}
                        />
                        <input
                          className="input"
                          type="number"
                          value={editEstimate}
                          onChange={(e) => setEditEstimate(e.target.value)}
                          min={1}
                        />
                        <DreadMeter score={editDread} onChange={setEditDread} />
                        <div className="flex gap-2">
                          <button className="btn btn-primary btn-sm" onClick={() => saveEdit(t._id)}>
                            Save
                          </button>
                          <button className="btn btn-ghost btn-sm" onClick={() => setEditingId(null)}>
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Display mode */
                      <>
                        <div className="task-header">
                          <button
                            className="task-check"
                            onClick={() => complete(t._id)}
                            title="Mark complete"
                          >
                            ✓
                          </button>
                          <div className="task-title-text">
                            {idx === 0 && (
                              <span
                                className="badge badge-violet"
                                style={{ marginRight: 6, verticalAlign: "middle" }}
                              >
                                ⚡ Next
                              </span>
                            )}
                            {t.title}
                          </div>
                          <PriorityBadge level={t.aiPriority} />
                        </div>

                        <div className="task-meta">
                          {t.dueAt && (
                            <span
                              style={{
                                color:
                                  (new Date(t.dueAt) - new Date()) / 3600000 < 24
                                    ? "var(--red)"
                                    : "var(--muted)",
                              }}
                            >
                              📅 {fmtDue(t.dueAt)}
                            </span>
                          )}
                          {t.estimateMins && <span>⏱ ~{t.estimateMins}m</span>}
                          <DreadMeter
                            score={t.dreadScore || 3}
                            onChange={(n) => updateDread(t._id, n)}
                          />
                        </div>

                        {t.subtasks?.length > 0 && (
                          <div className="subtask-list">
                            {t.subtasks.map((s, i) => (
                              <div key={i} className="subtask-item">
                                <div className="subtask-dot" />
                                {s.title}
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="task-actions">
                          <button className="btn btn-success btn-sm" onClick={() => complete(t._id)}>
                            ✓ Done
                          </button>
                          <button className="btn btn-secondary btn-sm" onClick={() => autoChunk(t)}>
                            ✂ Chunk
                          </button>
                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => {
                              setEditingId(t._id);
                              setEditTitle(t.title);
                              setEditDue(t.dueAt ? t.dueAt.slice(0, 16) : "");
                              setEditEstimate(t.estimateMins || 30);
                              setEditDread(t.dreadScore || 3);
                            }}
                          >
                            ✎ Edit
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
                {tasks.length === 0 && (
                  <div
                    className="card"
                    style={{ textAlign: "center", padding: 40, color: "var(--muted)" }}
                  >
                    <div style={{ fontSize: 32, marginBottom: 8 }}>📭</div>
                    <div className="font-semibold mb-2">No tasks yet</div>
                    <div className="text-sm">
                      Try the Brain Dump tab — just type everything on your mind.
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* ── Right Panel: AI Suggestions ─────────────────── */}
        <aside className="stack">
          <div className="card">
            <div
              className="flex items-center justify-between mb-3"
            >
              <div className="card-title" style={{ margin: 0 }}>AI Suggestions</div>
              <button
                className="btn btn-ghost btn-sm"
                onClick={fetchSuggestions}
                disabled={suggestionsLoading}
              >
                {suggestionsLoading ? "..." : "↺"}
              </button>
            </div>

            {suggestionsLoading && suggestions.length === 0 && (
              <div className="text-sm text-muted" style={{ textAlign: "center", padding: 20 }}>
                Analysing tasks...
              </div>
            )}

            {suggestions.length > 0 ? (
              <div className="stack-sm">
                {suggestions.map((s) => (
                  <div
                    key={s.id}
                    style={{
                      borderRadius: "var(--radius-sm)",
                      padding: "12px 14px",
                      ...SUGGESTION_STYLES[s.type],
                    }}
                  >
                    <div
                      className="text-xs font-bold"
                      style={{
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                        color: "var(--muted)",
                        marginBottom: 4,
                      }}
                    >
                      {SUGGESTION_LABELS[s.type] || "Tip"}
                    </div>
                    <div className="font-semibold text-sm mb-1">{s.title}</div>
                    <div className="text-sm text-muted mb-3" style={{ lineHeight: 1.5 }}>
                      {s.description}
                    </div>
                    <div className="flex gap-2">
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => acceptSuggestion(s)}
                      >
                        Accept
                      </button>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => dismissSuggestion(s)}
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              !suggestionsLoading && (
                <div
                  className="text-sm text-muted"
                  style={{ textAlign: "center", padding: "16px 0", lineHeight: 1.6 }}
                >
                  {tasks.length === 0
                    ? "Add tasks to get AI-powered suggestions."
                    : "No suggestions right now."}
                </div>
              )
            )}
          </div>

          {/* Energy context hint */}
          <div className="card card-sm">
            <div className="card-title">Energy context</div>
            <div className="text-sm text-muted" style={{ lineHeight: 1.6 }}>
              Tasks are ranked for your current energy level.{" "}
              <span style={{ color: "var(--amber)" }}>⚡ Next</span> badge shows your best match.
              Change energy in the sidebar.
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
