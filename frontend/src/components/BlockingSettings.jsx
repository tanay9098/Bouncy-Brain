import React, { useEffect, useState } from "react";
import api from "../services/api";
import { useBlockingStore } from "../stores/blockingStore";
import { Capacitor } from "@capacitor/core";
import { AppBlocker } from "../plugins/AppBlocker";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function Toggle({ checked, onChange, disabled }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      style={{
        width: 44,
        height: 24,
        borderRadius: 12,
        border: "none",
        cursor: disabled ? "not-allowed" : "pointer",
        background: checked ? "var(--indigo)" : "var(--border)",
        position: "relative",
        transition: "background 0.2s",
        flexShrink: 0,
        outline: "none",
        padding: 0,
      }}
    >
      <span
        style={{
          position: "absolute",
          top: 3,
          left: checked ? 23 : 3,
          width: 18,
          height: 18,
          borderRadius: "50%",
          background: "#fff",
          transition: "left 0.2s",
          display: "block",
        }}
      />
    </button>
  );
}

function EntryList({ items, onRemove, placeholder }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {items.length === 0 && (
        <p style={{ fontSize: "var(--text-xs)", color: "var(--muted)", margin: 0 }}>
          {placeholder}
        </p>
      )}
      {items.map((item, idx) => (
        <div
          key={item._id || idx}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: "var(--surface)",
            borderRadius: "var(--radius-sm)",
            padding: "6px 10px",
            border: "1px solid var(--border)",
          }}
        >
          <span style={{ flex: 1, fontSize: "var(--text-sm)", color: "var(--text)", wordBreak: "break-all" }}>
            {item.value}
            {item.label && (
              <span style={{ color: "var(--muted)", marginLeft: 6, fontSize: "var(--text-xs)" }}>
                {item.label}
              </span>
            )}
          </span>
          <button
            type="button"
            onClick={() => onRemove(idx)}
            style={{
              background: "none",
              border: "none",
              color: "var(--muted)",
              cursor: "pointer",
              fontSize: 16,
              lineHeight: 1,
              padding: "0 2px",
              flexShrink: 0,
            }}
            aria-label="Remove"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}

function AddEntryRow({ onAdd, valuePlaceholder, labelPlaceholder }) {
  const [value, setValue] = useState("");
  const [label, setLabel] = useState("");

  function handleAdd() {
    const trimmed = value.trim().toLowerCase();
    if (!trimmed) return;
    onAdd({ value: trimmed, label: label.trim() });
    setValue("");
    setLabel("");
  }

  function handleKey(e) {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAdd();
    }
  }

  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
      <input
        className="profile-form-input"
        style={{ flex: "2 1 160px", minWidth: 0 }}
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKey}
        placeholder={valuePlaceholder}
        maxLength={200}
      />
      <input
        className="profile-form-input"
        style={{ flex: "1 1 100px", minWidth: 0 }}
        type="text"
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        onKeyDown={handleKey}
        placeholder={labelPlaceholder || "Label (optional)"}
        maxLength={100}
      />
      <button
        type="button"
        className="profile-save-btn"
        style={{ flexShrink: 0, padding: "0 16px" }}
        onClick={handleAdd}
        disabled={!value.trim()}
      >
        Add
      </button>
    </div>
  );
}

const isNative = Capacitor.isNativePlatform();
const platform = Capacitor.getPlatform(); // 'android' | 'ios' | 'web'

const PERM_LABEL = {
  android: { usageStats: "Usage Access", accessibility: "Accessibility Service" },
  ios:     { familyControls: "Family Controls" },
};

function permIcon(state) {
  if (state === "granted") return { icon: "✓", color: "var(--green)" };
  if (state === "denied")  return { icon: "✗", color: "var(--red)" };
  return { icon: "?", color: "var(--amber)" };
}

function NativeBlockingPanel() {
  const [perms, setPerms]       = useState(null);
  const [nativeState, setNativeState] = useState(null);
  const [busy, setBusy]         = useState(false);
  const [notice, setNotice]     = useState(null);

  async function refresh() {
    const [p, s] = await Promise.all([
      AppBlocker.checkPermissions(),
      AppBlocker.getBlockingState(),
    ]);
    setPerms(p);
    setNativeState(s);
  }

  useEffect(() => { refresh(); }, []);

  function showNotice(text, type) {
    setNotice({ text, type });
    setTimeout(() => setNotice(null), 2500);
  }

  async function handleRequestPerms() {
    setBusy(true);
    try {
      if (platform === "ios") {
        await AppBlocker.requestFamilyControlsAuth();
      } else {
        await AppBlocker.requestPermissions();
      }
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  async function handleStartStop() {
    setBusy(true);
    try {
      if (nativeState?.active) {
        await AppBlocker.stopBlocking();
        showNotice("Blocking stopped", "success");
      } else {
        const res = await AppBlocker.startBlocking();
        if (res.ok) showNotice("Blocking started", "success");
        else showNotice("Could not start — check permissions", "error");
      }
      await refresh();
    } catch (err) {
      showNotice(err.message || "Native error", "error");
    } finally {
      setBusy(false);
    }
  }

  async function handleSnooze(minutes) {
    setBusy(true);
    try {
      await AppBlocker.snooze({ minutes });
      showNotice(`Snoozed for ${minutes} min`, "success");
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  const missingPerms = platform === "ios"
    ? perms?.familyControls !== "granted"
    : perms?.usageStats !== "granted" || perms?.accessibility !== "granted";

  return (
    <section className="profile-settings-card">
      <div className="profile-settings-card-header">
        <h2 className="profile-settings-card-title">
          {platform === "ios" ? "📱 iOS" : "📱 Android"} Native Blocking
        </h2>
        <p className="profile-settings-card-desc">
          Directly block apps on this device using OS-level APIs
        </p>
      </div>

      {/* Permission status */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
        {platform === "android" && perms && (
          <>
            {[
              { key: "usageStats",    label: "Usage Access" },
              { key: "accessibility", label: "Accessibility Service" },
            ].map(({ key, label }) => {
              const { icon, color } = permIcon(perms[key]);
              return (
                <div key={key} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ color, fontWeight: 700, width: 14 }}>{icon}</span>
                  <span style={{ fontSize: "var(--text-sm)", color: "var(--text-soft)" }}>
                    {label}
                  </span>
                  <span style={{ fontSize: "var(--text-xs)", color: "var(--muted)", marginLeft: "auto" }}>
                    {perms[key]}
                  </span>
                </div>
              );
            })}
          </>
        )}
        {platform === "ios" && perms && (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ color: permIcon(perms.familyControls).color, fontWeight: 700, width: 14 }}>
              {permIcon(perms.familyControls).icon}
            </span>
            <span style={{ fontSize: "var(--text-sm)", color: "var(--text-soft)" }}>
              Family Controls
            </span>
            <span style={{ fontSize: "var(--text-xs)", color: "var(--muted)", marginLeft: "auto" }}>
              {perms.familyControls}
            </span>
          </div>
        )}
      </div>

      {/* Grant permissions */}
      {missingPerms && (
        <button
          type="button"
          className="profile-save-btn"
          style={{ marginBottom: 12, width: "100%" }}
          onClick={handleRequestPerms}
          disabled={busy}
        >
          {platform === "ios" ? "Authorize Family Controls" : "Open Permission Settings"}
        </button>
      )}

      {/* Blocking state + controls */}
      {!missingPerms && nativeState && (
        <>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "10px 12px",
              borderRadius: "var(--radius-sm)",
              background: nativeState.active && !nativeState.snoozed
                ? "var(--green-dim)"
                : "var(--surface)",
              border: `1px solid ${nativeState.active && !nativeState.snoozed
                ? "var(--green)"
                : "var(--border)"}`,
              marginBottom: 12,
            }}
          >
            <span style={{ fontSize: 18 }}>
              {nativeState.snoozed ? "⏸" : nativeState.active ? "🛡️" : "⬜"}
            </span>
            <span style={{
              fontSize: "var(--text-sm)",
              fontWeight: 600,
              color: nativeState.active && !nativeState.snoozed
                ? "var(--green)"
                : "var(--muted)",
            }}>
              {nativeState.snoozed
                ? "Snoozed"
                : nativeState.active
                  ? "Blocking active"
                  : "Blocking off"}
            </span>
            <button
              type="button"
              className="profile-save-btn"
              style={{
                marginLeft: "auto",
                padding: "4px 14px",
                fontSize: "var(--text-xs)",
                background: nativeState.active ? "var(--red-dim)" : undefined,
                color: nativeState.active ? "var(--red)" : undefined,
                border: nativeState.active ? "1px solid var(--red)" : undefined,
              }}
              onClick={handleStartStop}
              disabled={busy}
            >
              {nativeState.active ? "Stop" : "Start"}
            </button>
          </div>

          {nativeState.active && !nativeState.snoozed && (
            <div>
              <p className="profile-form-label" style={{ marginBottom: 8 }}>Snooze blocking</p>
              <div style={{ display: "flex", gap: 6 }}>
                {[5, 15, 30].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => handleSnooze(m)}
                    disabled={busy}
                    style={{
                      flex: 1,
                      padding: "6px 0",
                      borderRadius: "var(--radius-sm)",
                      border: "1px solid var(--border)",
                      background: "transparent",
                      color: "var(--muted)",
                      fontSize: "var(--text-xs)",
                      cursor: "pointer",
                    }}
                  >
                    {m} min
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {notice && (
        <div
          className={`profile-msg profile-msg--${notice.type}`}
          style={{ marginTop: 10 }}
        >
          {notice.text}
        </div>
      )}

      {platform === "android" && (
        <p style={{ fontSize: "var(--text-xs)", color: "var(--muted)", marginTop: 12 }}>
          <strong>App names in the blocklist</strong> must be Android package names
          (e.g. <code>com.instagram.android</code>). Enter them in the "Package name"
          field when adding an app above.
        </p>
      )}
      {platform === "ios" && (
        <p style={{ fontSize: "var(--text-xs)", color: "var(--muted)", marginTop: 12 }}>
          iOS app selection uses the <strong>Family Activity Picker</strong>.
          After granting Family Controls, the native picker will appear to choose
          which apps to block.
        </p>
      )}
    </section>
  );
}

export default function BlockingSettings() {
  const { rules, loading, saving, setRules, setLoading, setSaving } = useBlockingStore();
  const [local, setLocal] = useState(null);
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    setLoading(true);
    api.get("/blocking")
      .then((data) => {
        setRules(data.rules);
        setLocal(data.rules);
      })
      .catch(() => setMsg({ type: "error", text: "Failed to load blocking rules" }))
      .finally(() => setLoading(false));
  }, []);

  if (loading || !local) {
    return (
      <div className="profile-settings-page">
        <div className="profile-settings-container">
          <p style={{ color: "var(--muted)", fontSize: "var(--text-sm)" }}>Loading…</p>
        </div>
      </div>
    );
  }

  function update(patch) {
    setLocal((prev) => ({ ...prev, ...patch }));
  }

  function updateSchedule(patch) {
    setLocal((prev) => ({ ...prev, schedule: { ...prev.schedule, ...patch } }));
  }

  function addToList(key, entry) {
    setLocal((prev) => ({
      ...prev,
      [key]: [...prev[key], entry],
    }));
  }

  function removeFromList(key, idx) {
    setLocal((prev) => ({
      ...prev,
      [key]: prev[key].filter((_, i) => i !== idx),
    }));
  }

  function toggleDay(day) {
    const days = local.schedule.days.includes(day)
      ? local.schedule.days.filter((d) => d !== day)
      : [...local.schedule.days, day].sort((a, b) => a - b);
    updateSchedule({ days });
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    try {
      const data = await api.put("/blocking", local);
      setRules(data.rules);
      setLocal(data.rules);

      // Push updated rules to native layer if running as a Capacitor app
      if (isNative) {
        await AppBlocker.setBlockingRules({ rules: data.rules }).catch(() => {});
      }

      setMsg({ type: "success", text: "Blocking rules saved" });
      setTimeout(() => setMsg(null), 2500);
    } catch {
      setMsg({ type: "error", text: "Failed to save blocking rules" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="profile-settings-page">
      <form className="profile-settings-container" onSubmit={handleSave}>
        <div className="profile-settings-header">
          <h1 className="profile-settings-title">Blocking Rules</h1>
          <p className="profile-settings-subtitle">
            Manage which sites and apps to block during focus sessions
          </p>
        </div>

        {/* Master toggle */}
        <section className="profile-settings-card">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 16,
            }}
          >
            <div>
              <div className="profile-settings-card-title" style={{ marginBottom: 2 }}>
                Blocking enabled
              </div>
              <p style={{ fontSize: "var(--text-xs)", color: "var(--muted)", margin: 0 }}>
                Turn this on to activate your blocklist. Enforcement requires the Chrome extension (desktop) or native app (mobile).
              </p>
            </div>
            <Toggle
              checked={local.isEnabled}
              onChange={(v) => update({ isEnabled: v })}
              disabled={saving}
            />
          </div>
        </section>

        {/* Blocked websites */}
        <section className="profile-settings-card">
          <div className="profile-settings-card-header">
            <h2 className="profile-settings-card-title">Blocked Websites</h2>
            <p className="profile-settings-card-desc">
              Domains entered here will be blocked during active focus sessions
            </p>
          </div>
          <EntryList
            items={local.blockedSites}
            onRemove={(idx) => removeFromList("blockedSites", idx)}
            placeholder="No blocked sites yet — add one below"
          />
          <AddEntryRow
            onAdd={(entry) => addToList("blockedSites", entry)}
            valuePlaceholder="e.g. twitter.com"
            labelPlaceholder="Nickname (optional)"
          />
        </section>

        {/* Whitelisted sites */}
        <section className="profile-settings-card">
          <div className="profile-settings-card-header">
            <h2 className="profile-settings-card-title">Whitelisted Sites</h2>
            <p className="profile-settings-card-desc">
              These sites are always allowed, even when blocking is active
            </p>
          </div>
          <EntryList
            items={local.whitelist}
            onRemove={(idx) => removeFromList("whitelist", idx)}
            placeholder="No whitelisted sites yet"
          />
          <AddEntryRow
            onAdd={(entry) => addToList("whitelist", entry)}
            valuePlaceholder="e.g. docs.google.com"
            labelPlaceholder="Nickname (optional)"
          />
        </section>

        {/* Blocked apps */}
        <section className="profile-settings-card">
          <div className="profile-settings-card-header">
            <h2 className="profile-settings-card-title">Blocked Apps</h2>
            <p className="profile-settings-card-desc">
              Add app names to block on mobile. Enforcement requires the native app (Phase 2).
            </p>
          </div>
          {!isNative && (
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 8,
                padding: "8px 12px",
                background: "var(--amber-dim)",
                borderRadius: "var(--radius-sm)",
                marginBottom: 12,
                border: "1px solid var(--amber)",
              }}
            >
              <span style={{ fontSize: 14, marginTop: 1 }}>⚠️</span>
              <p style={{ fontSize: "var(--text-xs)", color: "var(--text-soft)", margin: 0 }}>
                App blocking requires the native app. Android uses{" "}
                <strong>Accessibility Service</strong>; iOS uses{" "}
                <strong>Family Controls</strong>. Rules saved here activate automatically
                when you install the mobile app.
              </p>
            </div>
          )}
          <EntryList
            items={local.blockedApps}
            onRemove={(idx) => removeFromList("blockedApps", idx)}
            placeholder="No blocked apps yet — add one below"
          />
          <AddEntryRow
            onAdd={(entry) => addToList("blockedApps", entry)}
            valuePlaceholder="e.g. Instagram"
            labelPlaceholder="Package name (optional)"
          />
        </section>

        {/* Schedule */}
        <section className="profile-settings-card">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 16,
              marginBottom: local.schedule.enabled ? 16 : 0,
            }}
          >
            <div>
              <div className="profile-settings-card-title" style={{ marginBottom: 2 }}>
                Block on a schedule
              </div>
              <p style={{ fontSize: "var(--text-xs)", color: "var(--muted)", margin: 0 }}>
                Only block during specific hours and days
              </p>
            </div>
            <Toggle
              checked={local.schedule.enabled}
              onChange={(v) => updateSchedule({ enabled: v })}
              disabled={saving}
            />
          </div>

          {local.schedule.enabled && (
            <>
              {/* Time range */}
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 14 }}>
                <div className="profile-form-field" style={{ flex: "1 1 120px" }}>
                  <label className="profile-form-label">Start time</label>
                  <input
                    className="profile-form-input"
                    type="time"
                    value={local.schedule.startTime}
                    onChange={(e) => updateSchedule({ startTime: e.target.value })}
                  />
                </div>
                <div className="profile-form-field" style={{ flex: "1 1 120px" }}>
                  <label className="profile-form-label">End time</label>
                  <input
                    className="profile-form-input"
                    type="time"
                    value={local.schedule.endTime}
                    onChange={(e) => updateSchedule({ endTime: e.target.value })}
                  />
                </div>
              </div>

              {/* Days */}
              <div>
                <p className="profile-form-label" style={{ marginBottom: 8 }}>Active days</p>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {DAY_LABELS.map((d, i) => {
                    const active = local.schedule.days.includes(i);
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => toggleDay(i)}
                        style={{
                          padding: "4px 10px",
                          borderRadius: "var(--radius-sm)",
                          border: `1px solid ${active ? "var(--indigo)" : "var(--border)"}`,
                          background: active ? "var(--indigo-dim)" : "transparent",
                          color: active ? "var(--indigo-light)" : "var(--muted)",
                          fontSize: "var(--text-xs)",
                          fontWeight: active ? 600 : 400,
                          cursor: "pointer",
                          transition: "all 0.15s",
                        }}
                      >
                        {d}
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </section>

        {/* Native controls — only rendered when running as Android/iOS app */}
        {isNative && <NativeBlockingPanel />}

        {/* Save */}
        {msg && (
          <div className={`profile-msg profile-msg--${msg.type}`} style={{ marginBottom: 8 }}>
            {msg.text}
          </div>
        )}
        <div className="profile-form-actions">
          <button type="submit" className="profile-save-btn" disabled={saving}>
            {saving ? "Saving…" : "Save Rules"}
          </button>
        </div>
      </form>
    </div>
  );
}
