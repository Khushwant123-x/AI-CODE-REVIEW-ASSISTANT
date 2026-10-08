import React, { useState } from 'react'
import {
  verifyAndLoginToken,
  logoutGitHub,
  getStoredAuthToken,
} from '../services/githubAuth.js'

export default function GitHubAuthModal({
  isOpen,
  onClose,
  authUser,
  onAuthSuccess,
  onLogout,
  onSyncRepos,
}) {
  const [tokenInput, setTokenInput] = useState('')
  const [showToken, setShowToken] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [successMsg, setSuccessMsg] = useState(null)

  if (!isOpen) return null

  const handleConnect = async (e) => {
    e.preventDefault()
    setError(null)
    setSuccessMsg(null)
    setLoading(true)

    try {
      const result = await verifyAndLoginToken(tokenInput)
      if (result.success) {
        setSuccessMsg(`Connected as @${result.user.login}!`)
        setTokenInput('')
        if (onAuthSuccess) {
          onAuthSuccess(result.user)
        }
      } else {
        setError(result.error || 'Failed to authenticate token')
      }
    } catch (err) {
      setError(err.message || 'Authentication error')
    } finally {
      setLoading(false)
    }
  }

  const handleDisconnect = () => {
    logoutGitHub()
    if (onLogout) onLogout()
    onClose()
  }

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-container auth-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="auth-logo-badge">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
              </svg>
            </div>
            <div>
              <h2 className="modal-title">GitHub Account Authentication</h2>
              <p className="modal-subtitle">Connect your GitHub profile for full repository access</p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
            ✕
          </button>
        </div>

        <div className="modal-body">
          {authUser ? (
            /* Active Connected User View */
            <div className="auth-profile-card">
              <div className="auth-profile-top">
                <img
                  src={authUser.avatarUrl || 'https://github.com/ghost.png'}
                  alt={authUser.login}
                  className="auth-profile-avatar"
                />
                <div className="auth-profile-details">
                  <div className="auth-profile-name">{authUser.name || authUser.login}</div>
                  <div className="auth-profile-username">@{authUser.login}</div>
                  {authUser.bio && <div className="auth-profile-bio">{authUser.bio}</div>}
                </div>
              </div>

              <div className="auth-profile-stats">
                <div className="auth-stat-box">
                  <span className="auth-stat-num">{authUser.publicRepos}</span>
                  <span className="auth-stat-label">Public Repos</span>
                </div>
                <div className="auth-stat-box">
                  <span className="auth-stat-num">{authUser.followers}</span>
                  <span className="auth-stat-label">Followers</span>
                </div>
                <div className="auth-stat-box">
                  <span className="auth-stat-num" style={{ color: 'var(--color-success)' }}>5,000/hr</span>
                  <span className="auth-stat-label">API Rate Limit</span>
                </div>
              </div>

              <div className="auth-connected-banner">
                <span className="badge badge-success">● Connected & Authenticated</span>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  All PR reviews and comments use your authenticated GitHub identity.
                </span>
              </div>

              <div className="modal-actions" style={{ marginTop: 20 }}>
                {onSyncRepos && (
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => {
                      onSyncRepos()
                      onClose()
                    }}
                  >
                    Sync My Repositories
                  </button>
                )}
                <a
                  href={authUser.htmlUrl || `https://github.com/${authUser.login}`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-secondary"
                >
                  View GitHub Profile ↗
                </a>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={handleDisconnect}
                  style={{ color: 'var(--color-critical)', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                >
                  Disconnect
                </button>
              </div>
            </div>
          ) : (
            /* Connect Form */
            <form onSubmit={handleConnect}>
              <div className="auth-benefits-grid">
                <div className="benefit-item">
                  <span className="benefit-icon">🚀</span>
                  <div>
                    <strong>Higher API Limits</strong>
                    <p>Increases GitHub rate limits from 60 to 5,000 requests/hr.</p>
                  </div>
                </div>
                <div className="benefit-item">
                  <span className="benefit-icon">🔒</span>
                  <div>
                    <strong>Private & Public Repos</strong>
                    <p>Review any repository your GitHub account has access to.</p>
                  </div>
                </div>
                <div className="benefit-item">
                  <span className="benefit-icon">💬</span>
                  <div>
                    <strong>Inline PR Comments</strong>
                    <p>Post AI suggestions directly to the PR diff on GitHub.</p>
                  </div>
                </div>
              </div>

              <div className="form-group" style={{ marginTop: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label htmlFor="gh-token-input">GitHub Personal Access Token (PAT)</label>
                  <a
                    href="https://github.com/settings/tokens/new?scopes=repo,read:user&description=AI-Code-Review-Assistant"
                    target="_blank"
                    rel="noreferrer"
                    className="token-help-link"
                    title="Open GitHub token creation page"
                  >
                    Generate Token on GitHub ↗
                  </a>
                </div>
                <div className="token-input-wrapper">
                  <input
                    id="gh-token-input"
                    type={showToken ? 'text' : 'password'}
                    placeholder="ghp_xxxx or github_pat_xxxx"
                    value={tokenInput}
                    onChange={(e) => setTokenInput(e.target.value)}
                    required
                    autoFocus
                  />
                  <button
                    type="button"
                    className="toggle-token-btn"
                    onClick={() => setShowToken(!showToken)}
                    tabIndex={-1}
                  >
                    {showToken ? 'Hide' : 'Show'}
                  </button>
                </div>
                <span className="input-hint">
                  Required scopes: <code>repo</code> (for PR reviews & comments) and <code>read:user</code>. Your token stays securely in your browser session.
                </span>
              </div>

              {error && (
                <div className="status-callout callout-error" style={{ marginTop: 12 }}>
                  {error}
                </div>
              )}

              {successMsg && (
                <div className="status-callout callout-success" style={{ marginTop: 12 }}>
                  {successMsg}
                </div>
              )}

              <div className="modal-actions" style={{ marginTop: 20 }}>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading || !tokenInput.trim()}
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  {loading ? 'Authenticating with GitHub...' : 'Authenticate & Connect Account'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
