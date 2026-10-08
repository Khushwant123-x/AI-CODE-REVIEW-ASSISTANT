import React, { useState } from 'react'
import { SeverityBadge, CategoryBadge } from './Badges.jsx'

export default function IssueCard({ issue, onViewCode, isSelected }) {
  const [expanded, setExpanded] = useState(isSelected || false)
  const [copied, setCopied] = useState(false)

  const filename = issue.file.split('/').pop()

  const handleCopyFix = (e) => {
    e.stopPropagation()
    const fixText = issue.after_code || issue.suggestion || ''
    if (!fixText) return
    navigator.clipboard.writeText(fixText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  const handleViewCode = (e) => {
    e.stopPropagation()
    if (onViewCode) {
      onViewCode(issue.file, issue.line)
    }
  }

  return (
    <div
      className={`issue-card severity-${issue.severity.toLowerCase()} ${isSelected ? 'selected' : ''}`}
      id={`issue-card-${issue.id || `${issue.file}-${issue.line}`}`}
    >
      <div
        className="issue-card-header"
        onClick={() => setExpanded(!expanded)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && setExpanded(!expanded)}
      >
        <div className="issue-card-top-row">
          <div className="issue-badges-row">
            <SeverityBadge severity={issue.severity} />
            <CategoryBadge type={issue.issue_type} />
          </div>

          <div className="issue-location-chip" title={issue.file}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
            <span className="loc-filename">{filename}</span>
            <span className="loc-divider">:</span>
            <span className="loc-line">Line {issue.line}</span>
          </div>
        </div>

        <div className="issue-title-row">
          <h3 className="issue-title-text">{issue.title}</h3>
          <span className={`issue-chevron ${expanded ? 'open' : ''}`}>▼</span>
        </div>

        <div className="issue-actions-row">
          <button
            type="button"
            className="btn btn-action-subtle"
            onClick={handleViewCode}
            title="Inspect line in Code Diff viewer"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="16 18 22 12 16 6" />
              <polyline points="8 6 2 12 8 18" />
            </svg>
            <span>View Code</span>
          </button>

          {(issue.after_code || issue.suggestion) && (
            <button
              type="button"
              className="btn btn-action-subtle"
              onClick={(e) => {
                e.stopPropagation()
                setExpanded(true)
              }}
              title="Expand suggested fix"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
              </svg>
              <span>View Fix</span>
            </button>
          )}
        </div>
      </div>

      {expanded && (
        <div className="issue-card-body">
          {/* Section: What is wrong? */}
          <div className="explanation-section">
            <div className="section-subtitle">What is wrong?</div>
            <p className="section-body-text">{issue.what || issue.explanation}</p>
          </div>

          {/* Section: Why does it matter? */}
          <div className="explanation-section">
            <div className="section-subtitle">Why does it matter?</div>
            <p className="section-body-text">{issue.why || 'Introduces security or logic instability under production workloads.'}</p>
          </div>

          {/* Section: How should it be fixed? */}
          <div className="explanation-section">
            <div className="section-subtitle">How should it be fixed?</div>
            <p className="section-body-text">{issue.how || issue.suggestion || 'Apply parameterized pattern or safe traversal.'}</p>
          </div>

          {/* Suggested Fix Code Container */}
          {(issue.before_code || issue.after_code || issue.suggestion) && (
            <div className="suggested-fix-container">
              <div className="fix-header">
                <span className="fix-header-title">Suggested Fix</span>
                <button
                  type="button"
                  className="btn btn-copy-fix"
                  onClick={handleCopyFix}
                  title="Copy fix to clipboard"
                >
                  {copied ? '✓ Copied Fix!' : '📋 Copy Fix'}
                </button>
              </div>

              {issue.before_code && (
                <div className="code-diff-box before-box">
                  <div className="code-box-label">Before</div>
                  <pre><code>{issue.before_code}</code></pre>
                </div>
              )}

              <div className="code-diff-box after-box">
                <div className="code-box-label">After</div>
                <pre><code>{issue.after_code || issue.suggestion}</code></pre>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
