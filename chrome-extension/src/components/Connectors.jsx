import React, { useEffect, useState } from 'react'
import { api } from '../utils/api.js'

const CONNECTORS = [
  {
    id: 'gmail',
    label: 'Gmail',
    desc: 'Import unread emails as tasks',
    color: '#ea4335',
    urlEndpoint: '/integrations/google/url',
    syncEndpoint: '/integrations/gmail/sync',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
        <path d="M20 4H4C2.9 4 2 4.9 2 6v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 2-8 5-8-5h16zm0 12H4V8l8 5 8-5v10z" />
      </svg>
    ),
  },
  {
    id: 'slack',
    label: 'Slack',
    desc: 'Turn starred messages into tasks',
    color: '#611f69',
    urlEndpoint: '/integrations/slack/url',
    syncEndpoint: '/integrations/slack/sync',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
        <path d="M5.042 15.165a2.528 2.528 0 01-2.52 2.523A2.528 2.528 0 010 15.165a2.527 2.527 0 012.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 012.521-2.52 2.527 2.527 0 012.521 2.52v6.313A2.528 2.528 0 018.834 24a2.528 2.528 0 01-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 01-2.521-2.52A2.528 2.528 0 018.834 0a2.528 2.528 0 012.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 012.521 2.521 2.528 2.528 0 01-2.521 2.521H2.522A2.528 2.528 0 010 8.834a2.528 2.528 0 012.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 012.522-2.521A2.528 2.528 0 0124 8.834a2.528 2.528 0 01-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 01-2.523 2.521 2.527 2.527 0 01-2.52-2.521V2.522A2.527 2.527 0 0115.165 0a2.528 2.528 0 012.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 012.523 2.522A2.528 2.528 0 0115.165 24a2.527 2.527 0 01-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 01-2.52-2.523 2.526 2.526 0 012.52-2.52h6.313A2.527 2.527 0 0124 15.165a2.528 2.528 0 01-2.522 2.523h-6.313z" />
      </svg>
    ),
  },
  {
    id: 'gcal',
    label: 'Google Calendar',
    desc: 'Sync events as deadlines',
    color: '#1a73e8',
    urlEndpoint: '/integrations/google/url',
    syncEndpoint: '/integrations/gcal/sync',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
        <path d="M19 3h-1V1h-2v2H8V1H6v2H5C3.9 3 3 3.9 3 5v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z" />
      </svg>
    ),
  },
]

export default function Connectors() {
  const [status, setStatus] = useState(null)
  const [busy, setBusy] = useState({})
  const [msg, setMsg] = useState(null)

  useEffect(() => {
    api.get('/integrations/status')
      .then(setStatus)
      .catch(() => {})
  }, [])

  function showMsg(text, ok = true) {
    setMsg({ text, ok })
    setTimeout(() => setMsg(null), 3500)
  }

  async function handleConnect(c) {
    setBusy(b => ({ ...b, [c.id]: true }))
    try {
      const { url } = await api.get(c.urlEndpoint)
      // Open OAuth in a new tab; user will be redirected back to the web app
      chrome.tabs.create({ url })
    } catch {
      showMsg('Failed to start connection.', false)
    } finally {
      setBusy(b => ({ ...b, [c.id]: false }))
    }
  }

  async function handleSync(c) {
    setBusy(b => ({ ...b, [c.id]: true }))
    try {
      const result = await api.post(c.syncEndpoint)
      showMsg(`Synced ${result.synced} items, ${result.created} new tasks.`)
      const updated = await api.get('/integrations/status')
      setStatus(updated)
    } catch (err) {
      showMsg(err.message || 'Sync failed.', false)
    } finally {
      setBusy(b => ({ ...b, [c.id]: false }))
    }
  }

  async function handleDisconnect(c) {
    try {
      await api.delete(`/integrations/${c.id}`)
      const updated = await api.get('/integrations/status')
      setStatus(updated)
      showMsg(`${c.label} disconnected.`)
    } catch {
      showMsg('Disconnect failed.', false)
    }
  }

  return (
    <div>
      <div className="card-title" style={{ marginBottom: 12 }}>Connectors</div>

      {msg && (
        <div style={{
          marginBottom: 10,
          padding: '8px 12px',
          borderRadius: 7,
          fontSize: 12,
          background: msg.ok ? 'var(--green-dim)' : 'var(--red-dim)',
          color: msg.ok ? 'var(--green)' : 'var(--red)',
        }}>
          {msg.text}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {CONNECTORS.map((c) => {
          const isConnected = !!status?.[c.id]?.connected
          const isBusy = !!busy[c.id]

          return (
            <div key={c.id} className="connector-row">
              <span className="connector-icon-ext" style={{ color: c.color, background: c.color + '20' }}>
                {c.icon}
              </span>
              <span style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{c.label}</div>
                <div style={{ fontSize: 11, color: 'var(--muted)' }}>{c.desc}</div>
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end' }}>
                {isConnected ? (
                  <>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleSync(c)}
                      disabled={isBusy}
                      style={{ fontSize: 11 }}
                    >
                      {isBusy ? '…' : 'Sync'}
                    </button>
                    <button
                      onClick={() => handleDisconnect(c)}
                      style={{ fontSize: 10, background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer' }}
                    >
                      Disconnect
                    </button>
                  </>
                ) : (
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => handleConnect(c)}
                    disabled={isBusy}
                    style={{ fontSize: 11, background: c.color }}
                  >
                    {isBusy ? '…' : 'Connect'}
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
