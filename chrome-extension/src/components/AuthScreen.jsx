import React, { useState } from 'react'
import { login } from '../utils/api.js'
import { set } from '../utils/storage.js'

export default function AuthScreen({ onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [apiUrl, setApiUrl] = useState('http://localhost:4000/api')
  const [showConfig, setShowConfig] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await set({ apiUrl })
      const data = await login(email, password)
      onLogin(data.token || data.accessToken, data.user)
    } catch (err) {
      setError(err.message === 'UNAUTHORIZED' ? 'Invalid email or password.' : err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-wrap">
      <div className="auth-logo">BB</div>
      <div className="auth-sub">Sign in to Bouncy Brain</div>

      <form className="auth-form" onSubmit={handleSubmit}>
        {error && <div className="error-msg">{error}</div>}

        <div className="form-group">
          <label className="label">Email</label>
          <input
            className="input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            autoFocus
          />
        </div>

        <div className="form-group">
          <label className="label">Password</label>
          <input
            className="input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
          />
        </div>

        <button className="btn btn-primary btn-block" disabled={loading}>
          {loading ? 'Signing in…' : 'Sign In'}
        </button>

        <button
          type="button"
          className="btn btn-ghost btn-sm"
          style={{ alignSelf: 'center', marginTop: 4 }}
          onClick={() => setShowConfig(!showConfig)}
        >
          {showConfig ? 'Hide' : '⚙ API settings'}
        </button>

        {showConfig && (
          <div className="form-group">
            <label className="label">Backend URL</label>
            <input
              className="input"
              type="url"
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
              placeholder="https://your-backend.railway.app/api"
            />
          </div>
        )}
      </form>
    </div>
  )
}
