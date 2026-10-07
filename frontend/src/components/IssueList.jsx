import { useState } from 'react'

const TYPE_EMOJI = {
  bug:             '🐛',
  security:        '🔒',
  performance:     '⚡',
  style:           '🎨',
  maintainability: '🔧',
}

const SEV_CLASS = {
  Critical: 'critical',
  Warning:  'warning',
  Info:     'info',
}

function IssueCard({ issue }) {
  const [open, setOpen] = useState(false)
  const sevClass = SEV_CLASS[issue.severity] || 'info'
  const emoji    = TYPE_EMOJI[issue.issue_type] || '📌'
  const filename = issue.file.split('/').pop()

  return (
    <div className={`issue-card ${sevClass}`}>
      <div
        className="issue-card-header"
        onClick={() => setOpen(o => !o)}
        role="button"
        aria-expanded={open}
        tabIndex={0}
        onKeyDown={e => e.key === 'Enter' && setOpen(o => !o)}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="issue-card-meta">
            <span className={`severity-badge ${sevClass}`}>{issue.severity}</span>
            <span className="type-badge">{emoji} {issue.issue_type}</span>
          </div>
          <div className="issue-card-title">{issue.title}</div>
          <div className="issue-card-location">
            <span>📄</span>
            <span>{filename}</span>
            <span style={{ color: 'var(--border)' }}>·</span>
            <span>Line {issue.line}</span>
            {filename !== issue.file && (
              <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>
                ({issue.file})
              </span>
            )}
          </div>
        </div>
        <span className={`issue-card-chevron ${open ? 'open' : ''}`}>▼</span>
      </div>

      {open && (
        <div className="issue-card-body">
          <div className="issue-section">
            <div className="issue-section-label">Explanation</div>
            <div className="issue-section-text">{issue.explanation}</div>
          </div>
          <div className="issue-section">
            <div className="issue-section-label">Suggestion</div>
            <div className="issue-section-text suggestion">{issue.suggestion}</div>
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Scrollable list of expandable issue cards.
 */
export default function IssueList({ issues }) {
  if (issues.length === 0) {
    return (
      <div className="no-issues">
        <div className="no-issues-icon">✅</div>
        <div className="no-issues-text">No issues match the current filters.</div>
      </div>
    )
  }

  return (
    <div className="issue-list">
      {issues.map((issue, idx) => (
        <IssueCard key={`${issue.file}-${issue.line}-${issue.issue_type}-${idx}`} issue={issue} />
      ))}
    </div>
  )
}
