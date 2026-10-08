import React from 'react'

export default function DashboardPage({
  reviewHistory = [],
  onOpenReview,
  onNavigate,
  onQuickReviewPR3,
}) {
  // Aggregate stats from history or baseline defaults
  const totalReviews = reviewHistory.length > 0 ? reviewHistory.length : 24
  const passedReviews = reviewHistory.length > 0
    ? reviewHistory.filter((r) => r.recommendation?.toLowerCase().includes('approve') || r.score >= 90).length
    : 17
  const needsChanges = totalReviews - passedReviews
  const criticalIssues = reviewHistory.reduce((acc, curr) => acc + (curr.criticalCount || 0), 0) || 5

  const totalScore = reviewHistory.reduce((acc, curr) => acc + (curr.score || 80), 0)
  const averageScore = reviewHistory.length > 0
    ? Math.round(totalScore / reviewHistory.length)
    : 84

  // Sample or real recent review rows
  const recentReviews = reviewHistory.length > 0 ? reviewHistory.slice(0, 6) : [
    {
      id: 'demo-3',
      repoName: 'AI-CODE-REVIEW-ASSISTANT',
      owner: 'Khushwant123-x',
      prNumber: 3,
      prTitle: 'Fix math operators and add division error handling in calculator',
      score: 82,
      recommendation: 'Needs Changes',
      reviewedAt: '10 mins ago',
      criticalCount: 2,
    },
    {
      id: 'demo-12',
      repoName: 'backend-api',
      owner: 'Khushwant123-x',
      prNumber: 12,
      prTitle: 'feat: Implement JWT refresh token rotation with Redis store',
      score: 94,
      recommendation: 'Passed',
      reviewedAt: '2 hours ago',
      criticalCount: 0,
    },
    {
      id: 'demo-7',
      repoName: 'ml-service',
      owner: 'Khushwant123-x',
      prNumber: 7,
      prTitle: 'fix: Address memory leak in asynchronous batch tokenizer',
      score: 71,
      recommendation: 'Needs Changes',
      reviewedAt: 'Yesterday',
      criticalCount: 2,
    },
  ]

  return (
    <div className="page-content dashboard-page">
      {/* Page Title & Quick Actions */}
      <div className="page-header-row">
        <div>
          <h1 className="page-title">Developer Review Dashboard</h1>
          <p className="page-subtitle">
            Overview of AI-automated pull request quality, security posture, and recent reviews
          </p>
        </div>

        <div className="page-header-actions">
          <button
            className="btn btn-primary"
            onClick={() => onNavigate('pull-requests')}
            id="dash-run-review-btn"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
            <span>Review a Pull Request</span>
          </button>

          <button
            className="btn btn-secondary"
            onClick={() => onNavigate('repositories')}
          >
            <span>Connected Repositories</span>
          </button>
        </div>
      </div>

      {/* Metrics Cards Grid */}
      <div className="dashboard-stats-grid">
        <div className="stat-card">
          <div className="stat-card-top">
            <span className="stat-label">Total Reviews</span>
            <span className="stat-icon-badge">📊</span>
          </div>
          <div className="stat-value">{totalReviews}</div>
          <div className="stat-meta">Analyzed across all connected repos</div>
        </div>

        <div className="stat-card stat-card-success">
          <div className="stat-card-top">
            <span className="stat-label">Passed Reviews</span>
            <span className="stat-icon-badge text-success">✓</span>
          </div>
          <div className="stat-value">{passedReviews}</div>
          <div className="stat-meta">Approved with no blocking defects</div>
        </div>

        <div className="stat-card stat-card-warning">
          <div className="stat-card-top">
            <span className="stat-label">Needs Changes</span>
            <span className="stat-icon-badge text-warning">⚠️</span>
          </div>
          <div className="stat-value">{needsChanges}</div>
          <div className="stat-meta">Required author updates before merge</div>
        </div>

        <div className="stat-card stat-card-danger">
          <div className="stat-card-top">
            <span className="stat-label">Critical Issues</span>
            <span className="stat-icon-badge text-danger">🔴</span>
          </div>
          <div className="stat-value">{criticalIssues}</div>
          <div className="stat-meta">High-severity security or crash bugs</div>
        </div>

        <div className="stat-card stat-card-score">
          <div className="stat-card-top">
            <span className="stat-label">Average Score</span>
            <span className="stat-icon-badge">🎯</span>
          </div>
          <div className="stat-value">{averageScore} <span className="stat-unit">/100</span></div>
          <div className="stat-meta">Across all scanned commits</div>
        </div>
      </div>

      {/* Recent Reviews Table */}
      <div className="card-panel">
        <div className="card-panel-header">
          <div>
            <h2 className="card-panel-title">Recent Reviews</h2>
            <div className="card-panel-subtitle">Click any row to open the complete inspection and diff results</div>
          </div>
          <button
            className="btn btn-subtle-link"
            onClick={() => onNavigate('history')}
          >
            View all history →
          </button>
        </div>

        <div className="table-responsive">
          <table className="dev-table" id="recent-reviews-table">
            <thead>
              <tr>
                <th>Repository</th>
                <th>PR</th>
                <th>Score</th>
                <th>Status</th>
                <th>Findings</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {recentReviews.map((rev) => {
                const isPassed = rev.recommendation?.toLowerCase().includes('approve') || rev.recommendation === 'Passed'
                const statusCls = isPassed ? 'status-pill-success' : 'status-pill-warning'
                const scoreCls = rev.score >= 90 ? 'text-success' : rev.score >= 75 ? 'text-warning' : 'text-danger'

                return (
                  <tr
                    key={rev.id || `${rev.repoName}-${rev.prNumber}`}
                    className="clickable-table-row"
                    onClick={() => onOpenReview(rev)}
                  >
                    <td>
                      <div className="repo-cell">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                        </svg>
                        <span className="repo-cell-name">{rev.repoName}</span>
                      </div>
                    </td>
                    <td>
                      <span className="pr-number-pill">#{rev.prNumber}</span>
                    </td>
                    <td>
                      <span className={`score-badge-inline ${scoreCls}`}>
                        {rev.score} / 100
                      </span>
                    </td>
                    <td>
                      <span className={`status-pill ${statusCls}`}>
                        {rev.recommendation}
                      </span>
                    </td>
                    <td>
                      <span className="findings-summary-text">
                        {rev.criticalCount > 0 && <span className="critical-text-pill">{rev.criticalCount} Critical</span>}
                        {rev.warningCount > 0 && <span className="warning-text-pill">{rev.warningCount} Warning</span>}
                        {rev.criticalCount === 0 && rev.warningCount === 0 && <span className="clean-text-pill">Clean</span>}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="btn btn-table-action"
                        onClick={(e) => {
                          e.stopPropagation()
                          onOpenReview(rev)
                        }}
                      >
                        Inspect Result →
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Target Repository Quick Banner */}
      <div className="repo-target-banner">
        <div className="banner-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="2" y1="12" x2="22" y2="12" />
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
          </svg>
        </div>
        <div className="banner-content">
          <div className="banner-title">Universal AI Pull Request Code Review</div>
          <div className="banner-text">
            Enter any public or private GitHub Pull Request URL to run automated vulnerability checks and receive instant line-level suggestions.
          </div>
        </div>
        <div className="banner-actions">
          <button
            className="btn btn-primary"
            onClick={() => onNavigate('pull-requests')}
          >
            Start New Review →
          </button>
        </div>
      </div>
    </div>
  )
}
