import React, { useState } from 'react'
import {
  getAllRepositories,
  addCustomRepository,
  removeCustomRepository,
} from '../services/storage.js'

export default function RepositoriesPage({
  onSelectRepo,
  onNavigate,
  authUser,
  onOpenAuthModal,
  onSyncRepos,
}) {
  const [search, setSearch] = useState('')
  const [repos, setRepos] = useState(getAllRepositories())
  const [showAddModal, setShowAddModal] = useState(false)
  const [syncing, setSyncing] = useState(false)

  // Keep repos in sync with localStorage
  React.useEffect(() => {
    setRepos(getAllRepositories())
  }, [authUser])

  // Add repo form state
  const [inputRepo, setInputRepo] = useState('')
  const [inputDesc, setInputDesc] = useState('')
  const [addError, setAddError] = useState(null)

  const handleAddSubmit = (e) => {
    e.preventDefault()
    setAddError(null)

    // Parse owner/repo or full url
    let owner = ''
    let repoName = ''

    const urlMatch = inputRepo.trim().match(/github\.com\/([^/]+)\/([^/]+)/i)
    if (urlMatch) {
      owner = urlMatch[1]
      repoName = urlMatch[2].replace(/\.git$/i, '')
    } else {
      const parts = inputRepo.trim().split('/')
      if (parts.length === 2) {
        owner = parts[0]
        repoName = parts[1]
      }
    }

    if (!owner || !repoName) {
      setAddError('Please enter either a full GitHub URL (e.g. https://github.com/owner/repo) or format "owner/repo"')
      return
    }

    const { repository, all } = addCustomRepository(owner, repoName, inputDesc)
    setRepos(all)
    setInputRepo('')
    setInputDesc('')
    setShowAddModal(false)

    // Automatically select the newly added repo
    onSelectRepo(repository)
  }

  const handleRemove = (e, repoId) => {
    e.stopPropagation()
    const updated = removeCustomRepository(repoId)
    setRepos(updated)
  }

  const filteredRepos = repos.filter((r) =>
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    r.owner.toLowerCase().includes(search.toLowerCase()) ||
    (r.description && r.description.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <div className="page-content repositories-page">
      <div className="page-header-row">
        <div>
          <h1 className="page-title">Repositories Directory</h1>
          <p className="page-subtitle">
            Connect and review pull requests from <strong>ANY GitHub repository or organization</strong> (Public or Private).
          </p>
        </div>

        <div className="page-header-actions">
          <div className="search-filter-box">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              className="search-input"
              placeholder="Filter repositories..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <button
            className="btn btn-primary"
            onClick={() => setShowAddModal(true)}
            id="add-custom-repo-btn"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            <span>+ Connect Any Repository</span>
          </button>
        </div>
      </div>

      {/* GitHub Account Banner */}
      {authUser ? (
        <div className="card-panel auth-banner-panel" style={{ marginBottom: 20, padding: '14px 20px', background: 'var(--surface-subtle)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: 'var(--radius-lg)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <img
              src={authUser.avatarUrl || 'https://github.com/ghost.png'}
              alt={authUser.login}
              style={{ width: 40, height: 40, borderRadius: '50%', border: '2px solid var(--color-success)' }}
            />
            <div>
              <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>Connected as @{authUser.login}</span>
                <span className="badge badge-success" style={{ fontSize: '11px', padding: '2px 8px' }}>Active Session</span>
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                {authUser.publicRepos} public repositories · Authenticated with GitHub PAT
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            {onSyncRepos && (
              <button
                className="btn btn-secondary btn-sm"
                onClick={async () => {
                  setSyncing(true)
                  await onSyncRepos()
                  setRepos(getAllRepositories())
                  setSyncing(false)
                }}
                disabled={syncing}
              >
                {syncing ? 'Syncing...' : '🔄 Sync My Repositories'}
              </button>
            )}
            <button
              className="btn btn-outline btn-sm"
              onClick={onOpenAuthModal}
            >
              Account Details
            </button>
          </div>
        </div>
      ) : (
        <div className="card-panel auth-banner-panel" style={{ marginBottom: 20, padding: '14px 20px', background: 'rgba(56, 189, 248, 0.05)', border: '1px solid rgba(56, 189, 248, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: 'var(--radius-lg)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: '24px' }}>🐙</span>
            <div>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Connect Your GitHub Account</div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                Authenticate to auto-import your personal and org repositories, review private PRs, and boost rate limits to 5,000/hr.
              </div>
            </div>
          </div>
          <button
            className="btn btn-primary btn-sm"
            onClick={onOpenAuthModal}
            style={{ whiteSpace: 'nowrap' }}
          >
            Connect GitHub
          </button>
        </div>
      )}

      {/* Add Repository Modal */}
      {showAddModal && (
        <div className="card-panel add-repo-panel">
          <div className="card-panel-header">
            <h2 className="card-panel-title">Add Any GitHub Repository</h2>
            <button
              className="btn btn-icon"
              onClick={() => setShowAddModal(false)}
              style={{ border: 'none' }}
            >
              ✕
            </button>
          </div>
          <div className="card-panel-body">
            <form onSubmit={handleAddSubmit}>
              <div className="form-group">
                <label>Repository Name or GitHub URL</label>
                <input
                  type="text"
                  placeholder="e.g. facebook/react or https://github.com/pallets/flask"
                  value={inputRepo}
                  onChange={(e) => setInputRepo(e.target.value)}
                  required
                  autoFocus
                />
                <span className="input-hint">
                  Works for any public repo on GitHub, or private repos configured with your GitHub Token.
                </span>
              </div>

              <div className="form-group">
                <label>Description (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Production microservice / Frontend application"
                  value={inputDesc}
                  onChange={(e) => setInputDesc(e.target.value)}
                />
              </div>

              {addError && (
                <div className="status-callout callout-error" style={{ marginBottom: 16 }}>
                  {addError}
                </div>
              )}

              <div className="form-actions">
                <button type="submit" className="btn btn-primary">
                  Connect & Browse Pull Requests
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Repositories Grid */}
      {filteredRepos.length === 0 ? (
        <div className="empty-panel">
          <div className="empty-icon">📦</div>
          <div className="empty-title">No repositories matched</div>
          <div className="empty-description">
            No repositories matched "{search}". Connect any repository to start reviewing.
          </div>
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
            + Connect Repository
          </button>
        </div>
      ) : (
        <div className="repositories-grid">
          {filteredRepos.map((repo) => {
            const isPassed = repo.status === 'passed'
            return (
              <div
                key={repo.id}
                className={`repository-card ${repo.isPrimary ? 'primary-repo' : ''}`}
              >
                <div className="repo-card-top-row">
                  <div className="repo-title-group">
                    <span className="repo-icon">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                      </svg>
                    </span>
                    <div>
                      <h3 className="repo-name">{repo.name}</h3>
                      <span className="repo-owner">owner: {repo.owner}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span className={`status-pill ${isPassed ? 'status-pill-success' : 'status-pill-warning'}`}>
                      {repo.status === 'pending' ? 'Ready' : isPassed ? 'Passed' : 'Needs Changes'}
                    </span>
                    {repo.isCustom && (
                      <button
                        className="btn-remove-repo"
                        onClick={(e) => handleRemove(e, repo.id)}
                        title="Remove repository"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>

                <p className="repo-description">{repo.description}</p>

                <div className="repo-metadata-grid">
                  <div className="meta-item">
                    <span className="meta-label">Full Path:</span>
                    <span className="meta-value branch-badge" title={repo.fullName}>
                      {repo.fullName}
                    </span>
                  </div>

                  <div className="meta-item">
                    <span className="meta-label">Default Branch:</span>
                    <span className="meta-value branch-badge">
                      <span className="branch-icon">⎇</span> {repo.defaultBranch || 'main'}
                    </span>
                  </div>

                  <div className="meta-item">
                    <span className="meta-label">Last Review:</span>
                    <span className="meta-value text-muted">{repo.lastReviewed || 'New'}</span>
                  </div>

                  <div className="meta-item">
                    <span className="meta-label">Last Score:</span>
                    <span className={`meta-value ${repo.lastReviewScore ? (repo.lastReviewScore >= 90 ? 'text-success' : 'text-warning') : 'text-muted'}`}>
                      {repo.lastReviewScore ? `${repo.lastReviewScore}/100` : 'Not run'}
                    </span>
                  </div>
                </div>

                <div className="repo-card-actions">
                  <button
                    className="btn btn-primary"
                    style={{ flex: 1 }}
                    onClick={() => onSelectRepo(repo)}
                    id={`view-repo-prs-${repo.name}`}
                  >
                    Select & Review PRs →
                  </button>

                  <a
                    href={`https://github.com/${repo.fullName}`}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-secondary btn-icon"
                    title="Open on GitHub"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                      <polyline points="15 3 21 3 21 9" />
                      <line x1="10" y1="14" x2="21" y2="3" />
                    </svg>
                  </a>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
