import React, { useState, useEffect } from 'react'
import LoadingSteps from '../components/LoadingSteps.jsx'
import { fetchPullRequests } from '../services/api.js'
import { getAllRepositories } from '../services/storage.js'

export default function PullRequestsPage({
  selectedRepo,
  onRunReview,
  loading,
  error,
  onClearError,
  onOpenExistingReview,
  onSwitchRepo,
}) {
  const currentRepoName = selectedRepo?.fullName || 'Khushwant123-x/AI-CODE-REVIEW-ASSISTANT'
  const [prList, setPrList] = useState([])
  const [loadingPrs, setLoadingPrs] = useState(false)
  const allRepos = getAllRepositories()

  // Custom PR input
  const [customOwner, setCustomOwner] = useState(selectedRepo?.owner || 'Khushwant123-x')
  const [customRepo, setCustomRepo] = useState(selectedRepo?.name || 'AI-CODE-REVIEW-ASSISTANT')
  const [customPrNum, setCustomPrNum] = useState('')
  const [urlInput, setUrlInput] = useState('')

  useEffect(() => {
    setLoadingPrs(true)
    fetchPullRequests(currentRepoName)
      .then((data) => setPrList(data))
      .catch(() => setPrList([]))
      .finally(() => setLoadingPrs(false))

    if (selectedRepo) {
      setCustomOwner(selectedRepo.owner)
      setCustomRepo(selectedRepo.name)
    }
  }, [currentRepoName, selectedRepo])

  const handleUrlParse = (url) => {
    setUrlInput(url)
    const match = url.trim().match(/github\.com\/([^/]+)\/([^/]+)\/pull\/(\d+)/i)
    if (match) {
      setCustomOwner(match[1])
      setCustomRepo(match[2])
      setCustomPrNum(match[3])
    }
  }

  const handleCustomSubmit = (e) => {
    e.preventDefault()
    if (!customOwner.trim() || !customRepo.trim() || !customPrNum) return
    onRunReview(customOwner.trim(), customRepo.trim(), parseInt(customPrNum, 10))
  }

  return (
    <div className="page-content pull-requests-page">
      {/* Header Row */}
      <div className="page-header-row">
        <div>
          <div className="breadcrumbs-tag">
            <span>Repositories</span>
            <span>/</span>
            <span className="current-crumb">{currentRepoName}</span>
          </div>
          <h1 className="page-title">Pull Requests</h1>
          <p className="page-subtitle">
            Trigger automated Groq LLM code analysis, vulnerability detection, and fix suggestions on any PR.
          </p>
        </div>

        {/* Repository Switcher Dropdown */}
        <div className="page-header-actions">
          <label style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginRight: 4 }}>
            Active Repo:
          </label>
          <select
            className="repo-select-dropdown"
            value={selectedRepo?.id || 'ai-code-review'}
            onChange={(e) => {
              const found = allRepos.find((r) => r.id === e.target.value)
              if (found && onSwitchRepo) onSwitchRepo(found)
            }}
          >
            {allRepos.map((r) => (
              <option key={r.id} value={r.id}>
                {r.fullName}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Universal Quick PR Review Box */}
      <div className="card-panel universal-review-box">
        <div className="card-panel-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '1.2rem' }}>⚡</span>
            <div>
              <h2 className="card-panel-title">Review ANY Pull Request URL</h2>
              <div className="card-panel-subtitle">Paste any GitHub Pull Request link to review it instantly</div>
            </div>
          </div>
        </div>
        <div className="card-panel-body">
          <form className="custom-pr-form" onSubmit={handleCustomSubmit}>
            <div className="form-group full-width">
              <label>Full GitHub PR URL</label>
              <div style={{ display: 'flex', gap: 10 }}>
                <input
                  type="text"
                  placeholder="https://github.com/owner/repository/pull/123"
                  value={urlInput}
                  onChange={(e) => handleUrlParse(e.target.value)}
                  style={{ flex: 1 }}
                />
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading || (!urlInput && (!customOwner || !customRepo || !customPrNum))}
                >
                  🚀 Run AI Review
                </button>
              </div>
            </div>

            <div className="form-row-3" style={{ marginTop: 12 }}>
              <div className="form-group">
                <label>GitHub Owner</label>
                <input
                  type="text"
                  placeholder="e.g. facebook"
                  value={customOwner}
                  onChange={(e) => setCustomOwner(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Repository Name</label>
                <input
                  type="text"
                  placeholder="e.g. react"
                  value={customRepo}
                  onChange={(e) => setCustomRepo(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>PR Number</label>
                <input
                  type="number"
                  min="1"
                  placeholder="e.g. 12"
                  value={customPrNum}
                  onChange={(e) => setCustomPrNum(e.target.value)}
                  required
                />
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="error-banner" role="alert">
          <div className="error-banner-icon">⛔</div>
          <div className="error-banner-body">
            <div className="error-banner-title">Review Execution Failed</div>
            <div className="error-banner-message">{error}</div>
            <div className="error-banner-hint">
              Tip: Verify that the FastAPI backend is running on port 8000 and that your <code>GROQ_API_KEY</code> is configured in <code>backend/.env</code>.
            </div>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={onClearError}>
            Dismiss
          </button>
        </div>
      )}

      {/* Progressive Loading State */}
      {loading && (
        <div className="pr-loading-overlay">
          <LoadingSteps />
        </div>
      )}

      {/* Pull Requests for the Selected Repository */}
      {!loading && (
        <div>
          <div className="section-title-row" style={{ margin: '20px 0 14px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>
              Pull Requests for <code>{currentRepoName}</code> ({prList.length})
            </h3>
          </div>

          {loadingPrs ? (
            <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)' }}>
              Loading pull requests for {currentRepoName}...
            </div>
          ) : prList.length === 0 ? (
            <div className="empty-panel" style={{ padding: 24 }}>
              <div className="empty-title">No pull requests listed</div>
              <div className="empty-description">
                Use the box above to review any specific PR number in this repository.
              </div>
            </div>
          ) : (
            <div className="pr-cards-list">
              {prList.map((pr) => {
                return (
                  <div
                    key={pr.number}
                    className="pr-card"
                    id={`pr-card-${pr.number}`}
                  >
                    <div className="pr-card-left">
                      <div className="pr-number-status">
                        <span className="pr-badge-num">PR #{pr.number}</span>
                        <span className="pr-branch-flow">
                          <code className="branch-source">{pr.sourceBranch}</code>
                          <span className="branch-arrow">→</span>
                          <code className="branch-target">{pr.targetBranch}</code>
                        </span>
                      </div>

                      <h3 className="pr-card-title">{pr.title}</h3>

                      <div className="pr-meta-row">
                        <div className="meta-author">
                          <span className="author-avatar-chip">
                            {pr.author.charAt(0).toUpperCase()}
                          </span>
                          <span>Author: <strong>{pr.author}</strong></span>
                        </div>

                        <span className="meta-dot">·</span>

                        <div className="meta-stats">
                          <span>Files: <strong>{pr.filesChanged}</strong></span>
                          <span className="meta-dot">·</span>
                          <span>Commits: <strong>{pr.commits}</strong></span>
                          {pr.additions > 0 && (
                            <>
                              <span className="meta-dot">·</span>
                              <span className="stat-diff-add">+{pr.additions}</span>
                            </>
                          )}
                          {pr.deletions > 0 && (
                            <span className="stat-diff-del">-{pr.deletions}</span>
                          )}
                        </div>
                      </div>

                      {pr.hasReview && pr.lastReviewScore && (
                        <div className="pr-review-status-bar">
                          <span className="status-label">Last AI Review:</span>
                          <span className={`status-score-pill ${pr.lastReviewScore >= 90 ? 'score-high' : 'score-mid'}`}>
                            {pr.lastReviewScore}/100
                          </span>
                          <span className="status-rec-pill">
                            {pr.lastReviewRecommendation}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="pr-card-right">
                      <button
                        className="btn btn-primary btn-run-review"
                        onClick={() => {
                          const owner = selectedRepo?.owner || customOwner
                          const repo = selectedRepo?.name || customRepo
                          onRunReview(owner, repo, pr.number)
                        }}
                        id={`run-review-pr-${pr.number}`}
                        title="Execute AI Code Review with Groq LLM"
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polygon points="5 3 19 12 5 21 5 3" />
                        </svg>
                        <span>Run AI Review</span>
                      </button>

                      {pr.hasReview && onOpenExistingReview && (
                        <button
                          className="btn btn-subtle-link"
                          onClick={() => onOpenExistingReview(pr.number)}
                          style={{ fontSize: '0.8rem', marginTop: 4 }}
                        >
                          View Previous Results →
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
