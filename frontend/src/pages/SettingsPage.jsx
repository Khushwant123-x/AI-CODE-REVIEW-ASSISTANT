import React, { useState } from 'react'
import { getApiBaseUrl, setApiBaseUrl, checkHealth } from '../services/api.js'

export default function SettingsPage({
  systemHealth,
  onHealthUpdated,
  authUser,
  onOpenAuthModal,
  onLogout,
}) {
  const [apiUrl, setApiUrl] = useState(getApiBaseUrl())
  const [testing, setTesting] = useState(false)
  const [saveStatus, setSaveStatus] = useState(null)

  const handleSave = async (e) => {
    e?.preventDefault()
    setSaveStatus(null)
    setTesting(true)
    setApiBaseUrl(apiUrl.trim())

    try {
      const health = await checkHealth()
      if (onHealthUpdated) onHealthUpdated(health)
      if (health.online) {
        setSaveStatus({
          type: 'success',
          message: `Connected successfully! Groq model: ${health.groq_model || 'llama3-70b'}`,
        })
      } else {
        setSaveStatus({
          type: 'warning',
          message: `Saved, but backend returned: ${health.error || 'Offline'}`,
        })
      }
    } catch (err) {
      setSaveStatus({ type: 'error', message: `Connection failed: ${err.message}` })
    } finally {
      setTesting(false)
    }
  }

  const handleApplyPreset = (url) => {
    setApiUrl(url)
    setApiBaseUrl(url)
    setTimeout(() => {
      checkHealth().then((h) => onHealthUpdated && onHealthUpdated(h))
    }, 100)
  }

  return (
    <div className="page-content settings-page">
      <div className="page-header-row">
        <div>
          <h1 className="page-title">Application Settings</h1>
          <p className="page-subtitle">
            Configure live backend cloud endpoints, GitHub account authentication, and AI LLM engine.
          </p>
        </div>
      </div>

      <div className="settings-grid">
        {/* Backend API Configuration */}
        <div className="card-panel">
          <div className="card-panel-header">
            <h2 className="card-panel-title">FastAPI Backend Service Endpoint</h2>
          </div>
          <div className="card-panel-body">
            <form onSubmit={handleSave}>
              <div className="form-group">
                <label>API Base URL</label>
                <input
                  type="text"
                  value={apiUrl}
                  onChange={(e) => setApiUrl(e.target.value)}
                  placeholder="https://your-backend.onrender.com or http://localhost:8000"
                  required
                />
                <span className="input-hint">
                  The live or local FastAPI server where <code>/health</code>, <code>/review</code>, and <code>/auth</code> are hosted.
                </span>
              </div>

              {/* Quick Presets */}
              <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => handleApplyPreset('http://localhost:8000')}
                >
                  Local (http://localhost:8000)
                </button>
              </div>

              {saveStatus && (
                <div className={`status-callout callout-${saveStatus.type}`} style={{ marginTop: 14 }}>
                  {saveStatus.message}
                </div>
              )}

              <div className="form-actions" style={{ marginTop: 16 }}>
                <button type="submit" className="btn btn-primary" disabled={testing}>
                  {testing ? 'Testing Connection...' : 'Save & Test Live Connection'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* GitHub Account Authentication */}
        <div className="card-panel">
          <div className="card-panel-header">
            <h2 className="card-panel-title">GitHub Account Authentication</h2>
          </div>
          <div className="card-panel-body">
            {authUser ? (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                  <img
                    src={authUser.avatarUrl || 'https://github.com/ghost.png'}
                    alt={authUser.login}
                    style={{ width: 48, height: 48, borderRadius: '50%', border: '2px solid var(--color-success)' }}
                  />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '16px' }}>{authUser.name || authUser.login}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>@{authUser.login}</div>
                    <span className="badge badge-success" style={{ marginTop: 4, display: 'inline-block' }}>
                      ● Authenticated (5,000 req/hr)
                    </span>
                  </div>
                </div>

                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: 16 }}>
                  You are logged in with your GitHub account. Your repositories are synchronized and PR reviews have full access.
                </div>

                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={onOpenAuthModal}
                  >
                    View Account & Token Details
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={onLogout}
                    style={{ color: 'var(--color-critical)' }}
                  >
                    Disconnect Account
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: 16 }}>
                  Authenticate with your GitHub account (Personal Access Token) to automatically import your repositories, review private pull requests, and increase your GitHub API rate limit from 60 to 5,000 requests per hour.
                </p>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={onOpenAuthModal}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: 6 }}>
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                  </svg>
                  Connect GitHub Account
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Cloud Hosting Guide */}
        <div className="card-panel" style={{ gridColumn: '1 / -1' }}>
          <div className="card-panel-header">
            <h2 className="card-panel-title">🌐 How to Deploy Backend Online (Free on Render / Railway)</h2>
          </div>
          <div className="card-panel-body">
            <div className="deploy-steps-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
              <div style={{ background: 'var(--surface-subtle)', padding: 16, borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                <strong style={{ display: 'block', marginBottom: 6 }}>1. Render Blueprint (Recommended)</strong>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: 8 }}>
                  We added <code>render.yaml</code>, <code>Procfile</code>, and <code>backend/Dockerfile</code> to your repository.
                </p>
                <ol style={{ fontSize: '12px', color: 'var(--text-muted)', paddingLeft: 16, margin: 0, lineHeight: 1.6 }}>
                  <li>Push latest code to GitHub (<code>git push origin main</code>)</li>
                  <li>Go to <a href="https://dashboard.render.com" target="_blank" rel="noreferrer">render.com</a> → <strong>New +</strong> → <strong>Web Service</strong></li>
                  <li>Connect <code>AI-CODE-REVIEW-ASSISTANT</code></li>
                  <li>Set Root Directory: <code>backend</code></li>
                  <li>Add Env Vars: <code>GROQ_API_KEY</code> & <code>GITHUB_TOKEN</code></li>
                </ol>
              </div>

              <div style={{ background: 'var(--surface-subtle)', padding: 16, borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                <strong style={{ display: 'block', marginBottom: 6 }}>2. Connect Live URL to Vercel Frontend</strong>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: 8 }}>
                  Once Render/Railway deploys your FastAPI backend:
                </p>
                <ol style={{ fontSize: '12px', color: 'var(--text-muted)', paddingLeft: 16, margin: 0, lineHeight: 1.6 }}>
                  <li>Copy your live URL (e.g. <code>https://ai-code-review.onrender.com</code>)</li>
                  <li>Paste it above into <strong>API Base URL</strong></li>
                  <li>Click <strong>Save & Test Live Connection</strong></li>
                  <li>All reviews from Vercel now process on your live cloud backend!</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
