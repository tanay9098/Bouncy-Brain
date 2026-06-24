import React, { useEffect, useState } from 'react'
import { getToken, getUser, setToken, setUser } from './utils/storage.js'
import { connectSocket, disconnectSocket } from './utils/socket.js'
import AuthScreen from './components/AuthScreen.jsx'
import WhatNext from './components/WhatNext.jsx'
import QuickTaskAdd from './components/QuickTaskAdd.jsx'
import QuickBrainDump from './components/QuickBrainDump.jsx'
import QuickTimer from './components/QuickTimer.jsx'
import NavBar from './components/NavBar.jsx'
import Connectors from './components/Connectors.jsx'

export default function App() {
  const [authed, setAuthed] = useState(false)
  const [user, setUserState] = useState(null)
  const [tab, setTab] = useState('next')
  const [loading, setLoading] = useState(true)
  const [taskRevision, setTaskRevision] = useState(0)

  useEffect(() => {
    Promise.all([getToken(), getUser()]).then(([token, u]) => {
      if (token) { setAuthed(true); setUserState(u) }
      setLoading(false)
    })
  }, [])

  // Connect socket when authed; bump taskRevision on task events so WhatNext refetches
  useEffect(() => {
    if (!authed) return;

    let mounted = true;
    connectSocket().then((s) => {
      if (!s || !mounted) return;
      const bump = () => { if (mounted) setTaskRevision((v) => v + 1) };
      s.on('task:created', bump);
      s.on('task:updated', bump);
      s.on('tasks:refetch', bump);
    });

    return () => {
      mounted = false;
      disconnectSocket();
    };
  }, [authed]);

  async function onLogin(token, userData) {
    await Promise.all([setToken(token), setUser(userData)])
    setAuthed(true)
    setUserState(userData)
  }

  async function onLogout() {
    disconnectSocket()
    const { clearAuth } = await import('./utils/storage.js')
    await clearAuth()
    setAuthed(false)
    setUserState(null)
  }

  if (loading) {
    return (
      <div className="popup">
        <div className="loading-wrap"><div className="spinner" /></div>
      </div>
    )
  }

  if (!authed) {
    return (
      <div className="popup">
        <AuthScreen onLogin={onLogin} />
      </div>
    )
  }

  return (
    <div className="popup">
      <header className="popup-header">
        <div className="popup-logo">
          <div className="popup-logo-dot" />
          Bouncy Brain
        </div>
        <div className="flex items-center gap-2">
          <span className="popup-user">{user?.name || user?.email || ''}</span>
          <button className="btn btn-ghost btn-sm" onClick={onLogout} title="Logout">↩</button>
        </div>
      </header>

      <div className="popup-content">
        {tab === 'next'    && <WhatNext taskRevision={taskRevision} />}
        {tab === 'add'     && <QuickTaskAdd onAdded={() => setTab('next')} />}
        {tab === 'dump'    && <QuickBrainDump />}
        {tab === 'timer'   && <QuickTimer />}
        {tab === 'connect' && <Connectors />}
      </div>

      <NavBar active={tab} onChange={setTab} />
    </div>
  )
}
