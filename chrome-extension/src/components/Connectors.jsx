import React from 'react'

const CONNECTORS = [
  {
    id: 'gmail',
    label: 'Gmail',
    desc: 'Sync emails as tasks',
    color: '#ea4335',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
        <path d="M20 4H4C2.9 4 2 4.9 2 6v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 2-8 5-8-5h16zm0 12H4V8l8 5 8-5v10z" />
      </svg>
    ),
  },
  {
    id: 'slack',
    label: 'Slack',
    desc: 'Turn messages into tasks',
    color: '#611f69',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
        <path d="M5.042 15.165a2.528 2.528 0 01-2.52 2.523A2.528 2.528 0 010 15.165a2.527 2.527 0 012.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 012.521-2.52 2.527 2.527 0 012.521 2.52v6.313A2.528 2.528 0 018.834 24a2.528 2.528 0 01-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 01-2.521-2.52A2.528 2.528 0 018.834 0a2.528 2.528 0 012.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 012.521 2.521 2.528 2.528 0 01-2.521 2.521H2.522A2.528 2.528 0 010 8.834a2.528 2.528 0 012.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 012.522-2.521A2.528 2.528 0 0124 8.834a2.528 2.528 0 01-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 01-2.523 2.521 2.527 2.527 0 01-2.52-2.521V2.522A2.527 2.527 0 0115.165 0a2.528 2.528 0 012.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 012.523 2.522A2.528 2.528 0 0115.165 24a2.527 2.527 0 01-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 01-2.52-2.523 2.526 2.526 0 012.52-2.52h6.313A2.527 2.527 0 0124 15.165a2.528 2.528 0 01-2.522 2.523h-6.313z" />
      </svg>
    ),
  },
  {
    id: 'gcal',
    label: 'Google Calendar',
    desc: 'Sync events with deadlines',
    color: '#1a73e8',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
        <path d="M19 3h-1V1h-2v2H8V1H6v2H5C3.9 3 3 3.9 3 5v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z" />
      </svg>
    ),
  },
]

export default function Connectors() {
  return (
    <div>
      <div className="card-title" style={{ marginBottom: 12 }}>Connectors</div>
      <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 14, lineHeight: 1.5 }}>
        Connect your favourite tools to auto-import tasks and deadlines.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {CONNECTORS.map((c) => (
          <div key={c.id} className="connector-row">
            <span className="connector-icon-ext" style={{ color: c.color, background: c.color + '20' }}>
              {c.icon}
            </span>
            <span style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{c.label}</div>
              <div style={{ fontSize: 11, color: 'var(--muted)' }}>{c.desc}</div>
            </span>
            <span className="soon-badge">Soon</span>
          </div>
        ))}
      </div>
    </div>
  )
}
