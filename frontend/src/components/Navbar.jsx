import React, { useState, useRef, useEffect } from 'react'

export default function Navbar({
  systemHealth,
  currentView,
  onNavigate,
  theme,
  onToggleTheme,
  onToggleSidebar,
  onReviewAnyUrl,
  authUser,
  onOpenAuthModal,
  onLogout,
  onSyncRepos,
}) {
  const [quickUrl, setQuickUrl] = useState('')
  const [userDropdownOpen, setUserDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setUserDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleQuickUrlSubmit = (e) => {
    e.preventDefault()
    if (!quickUrl.trim()) return
    if (onReviewAnyUrl) {
      onReviewAnyUrl(quickUrl.trim())
      setQuickUrl('')
    }
  }

  return (
    <header className="navbar" role="banner">
      <div className="navbar-left">
        <button
          className="sidebar-toggle-btn"
          onClick={onToggleSidebar}
          aria-label="Toggle navigation sidebar"
          title="Toggle sidebar"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>

        <div className="navbar-brand" onClick={() => onNavigate('dashboard')} style={{ cursor: 'pointer' }}>
          <div className="navbar-logo">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 14c.2-1 .7-1.7 1.5-2.5M9 14c-.2-1-.7-1.7-1.5-2.5" />
              <path d="M9 18h6" />
              <path d="M10 22h4" />
              <circle cx="12" cy="8" r="5" />
            </svg>
          </div>
          <div>
            <div className="navbar-title">AI Code Review Assistant</div>
            <div className="navbar-subtitle">Automated GitHub Pull Request Analysis</div>
          </div>
        </div>
      </div>

      {/* Center: Universal PR Review Input */}
      <div className="navbar-center">
        <form onSubmit={handleQuickUrlSubmit} className="navbar-quick-pr-form">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Paste ANY GitHub PR URL (e.g. github.com/owner/repo/pull/123)"
            value={quickUrl}
            onChange={(e) => setQuickUrl(e.target.value)}
            className="navbar-quick-pr-input"
          />
          <button type="submit" className="navbar-quick-pr-btn" disabled={!quickUrl.trim()}>
            Review PR
          </button>
        </form>
      </div>

      <div className="navbar-right">
        {/* GitHub Account Auth Indicator / Dropdown */}
        {authUser ? (
          <div className="navbar-user-container" ref={dropdownRef}>
            <button
              className="navbar-pill github-status authenticated-pill"
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              title="Click to view GitHub account details"
            >
              <img
                src={authUser.avatarUrl || 'https://github.com/ghost.png'}
                alt={authUser.login}
                className="navbar-user-avatar"
              />
              <span className="pill-dot active" />
              <span className="pill-text font-semibold">@{authUser.login}</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>

            {userDropdownOpen && (
              <div className="user-dropdown-menu">
                <div className="dropdown-user-header">
                  <img
                    src={authUser.avatarUrl || 'https://github.com/ghost.png'}
                    alt={authUser.login}
                    className="dropdown-avatar"
                  />
                  <div>
                    <div className="dropdown-name">{authUser.name || authUser.login}</div>
                    <div className="dropdown-username">@{authUser.login}</div>
                  </div>
                </div>

                <div className="dropdown-divider" />

                <div className="dropdown-stats-row">
                  <div className="dropdown-stat">
                    <span>{authUser.publicRepos}</span> Repos
                  </div>
                  <div className="dropdown-stat">
                    <span>{authUser.followers}</span> Followers
                  </div>
                  <div className="dropdown-stat" style={{ color: 'var(--color-success)' }}>
                    <span>5k/hr</span> API
                  </div>
                </div>

                <div className="dropdown-divider" />

                {onSyncRepos && (
                  <button
                    className="dropdown-item"
                    onClick={() => {
                      onSyncRepos()
                      setUserDropdownOpen(false)
                    }}
                  >
                    <span className="dropdown-item-icon">🔄</span>
                    Sync My Repositories
                  </button>
                )}

                <button
                  className="dropdown-item"
                  onClick={() => {
                    onOpenAuthModal()
                    setUserDropdownOpen(false)
                  }}
                >
                  <span className="dropdown-item-icon">⚙️</span>
                  Account & Token Details
                </button>

                <a
                  href={authUser.htmlUrl || `https://github.com/${authUser.login}`}
                  target="_blank"
                  rel="noreferrer"
                  className="dropdown-item"
                  onClick={() => setUserDropdownOpen(false)}
                >
                  <span className="dropdown-item-icon">↗</span>
                  View on GitHub
                </a>

                <div className="dropdown-divider" />

                <button
                  className="dropdown-item text-danger"
                  onClick={() => {
                    onLogout()
                    setUserDropdownOpen(false)
                  }}
                >
                  <span className="dropdown-item-icon">🚪</span>
                  Disconnect Account
                </button>
              </div>
            )}
          </div>
        ) : (
          <button
            className="navbar-pill github-connect-btn"
            onClick={onOpenAuthModal}
            title="Connect your GitHub account"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
            </svg>
            <span className="pill-text font-semibold">Connect GitHub</span>
          </button>
        )}

        {/* Backend Status */}
        <div
          className="navbar-pill backend-status"
          onClick={() => onNavigate('settings')}
          style={{ cursor: 'pointer' }}
          title={systemHealth.online ? `Backend Online! Groq model: ${systemHealth.groq_model || 'llama3-70b-8192'}` : 'Backend offline - click to configure endpoint'}
        >
          <span className={`status-indicator-dot ${systemHealth.online ? 'online' : 'offline'}`} />
          <span className="pill-text">
            {systemHealth.online ? 'Backend Online' : 'Backend Offline'}
          </span>
        </div>

        {/* Theme Toggle */}
        <button
          className="btn btn-icon"
          onClick={onToggleTheme}
          aria-label="Toggle theme"
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {theme === 'dark' ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="5" />
              <line x1="12" y1="1" x2="12" y2="3" />
              <line x1="12" y1="21" x2="12" y2="23" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
              <line x1="1" y1="12" x2="3" y2="12" />
              <line x1="21" y1="12" x2="23" y2="12" />
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          )}
        </button>
      </div>
    </header>
  )
}
