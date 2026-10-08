import React, { useState } from 'react'
import { clearReviewHistory } from '../services/storage.js'

export default function ReviewHistoryPage({
  reviewHistory = [],
  onOpenReview,
  onHistoryUpdated,
  onNavigate,
}) {
  const [filterQuery, setFilterQuery] = useState('')

  const handleClear = () => {
    if (window.confirm('Are you sure you want to clear stored review history?')) {
      const empty = clearReviewHistory()
      if (onHistoryUpdated) onHistoryUpdated(empty)
    }
  }

  const filtered = reviewHistory.filter((r) =>
    r.repoName?.toLowerCase().includes(filterQuery.toLowerCase()) ||
    r.prTitle?.toLowerCase().includes(filterQuery.toLowerCase()) ||
    String(r.prNumber).includes(filterQuery)
  )

  return (
    <div className="page-content history-page">
      <div className="page-header-row">
        <div>
          <h1 className="page-title">Review History</h1>
          <p className="page-subtitle">
            Auditable archive of all AI pull request code reviews, scores, and findings.
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
              placeholder="Search history..."
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
            />
          </div>

          {reviewHistory.length > 0 && (
            <button
              className="btn btn-secondary btn-sm"
              onClick={handleClear}
              title="Clear stored history in localStorage"
            >
              Clear History
            </button>
          )}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-panel">
          <div className="empty-icon">🕒</div>
          <div className="empty-title">No reviews yet</div>
          <div className="empty-description">
            Select a Pull Request and run your first AI code review to view persisted historical findings here.
          </div>
          <button className="btn btn-primary" onClick={() => onNavigate('pull-requests')}>
            Browse Pull Requests
          </button>
        </div>
      ) : (
        <div className="card-panel">
          <div className="table-responsive">
            <table className="dev-table" id="history-table">
              <thead>
                <tr>
                  <th>Repository</th>
                  <th>PR</th>
                  <th>PR Title</th>
                  <th>Score</th>
                  <th>Status</th>
                  <th>Issues</th>
                  <th>Reviewed</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => {
                  const isPassed = item.recommendation?.toLowerCase().includes('approve') || item.score >= 90
                  const statusCls = isPassed ? 'status-pill-success' : 'status-pill-warning'
                  const scoreCls = item.score >= 90 ? 'text-success' : item.score >= 75 ? 'text-warning' : 'text-danger'

                  const dateStr = item.reviewedAt
                    ? new Date(item.reviewedAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : 'Recent'

                  return (
                    <tr
                      key={item.id}
                      className="clickable-table-row"
                      onClick={() => onOpenReview(item)}
                    >
                      <td>
                        <div className="repo-cell">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                          </svg>
                          <span className="repo-cell-name">{item.repoName}</span>
                        </div>
                      </td>
                      <td>
                        <span className="pr-number-pill">#{item.prNumber}</span>
                      </td>
                      <td>
                        <div className="history-pr-title" title={item.prTitle}>
                          {item.prTitle}
                        </div>
                      </td>
                      <td>
                        <span className={`score-badge-inline ${scoreCls}`}>
                          {item.score} / 100
                        </span>
                      </td>
                      <td>
                        <span className={`status-pill ${statusCls}`}>
                          {item.recommendation}
                        </span>
                      </td>
                      <td>
                        <span className="history-issues-count">
                          {item.criticalCount > 0 ? (
                            <span className="critical-text-pill">{item.criticalCount} Critical</span>
                          ) : item.issuesFound > 0 ? (
                            <span>{item.issuesFound} Findings</span>
                          ) : (
                            <span className="clean-text-pill">0 Issues</span>
                          )}
                        </span>
                      </td>
                      <td>
                        <span className="history-date-text">{dateStr}</span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          className="btn btn-table-action"
                          onClick={(e) => {
                            e.stopPropagation()
                            onOpenReview(item)
                          }}
                        >
                          Open Review →
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
