import React, { useState, useMemo } from 'react'
import ScoreGauge from '../components/ScoreGauge.jsx'
import DiffViewer from '../components/DiffViewer.jsx'
import IssueCard from '../components/IssueCard.jsx'
import { getDiffForFile } from '../services/api.js'

export default function ReviewResultsPage({
  reviewResult,
  onRerunReview,
  onNavigate,
}) {
  const [selectedFile, setSelectedFile] = useState(null)
  const [severityFilter, setSeverityFilter] = useState('All')
  const [categoryFilter, setCategoryFilter] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [highlightedLine, setHighlightedLine] = useState(null)
  const [viewMode, setViewMode] = useState('split') // 'split' | 'diff' | 'issues'
  const [copiedReport, setCopiedReport] = useState(false)

  if (!reviewResult) {
    return (
      <div className="page-content empty-results-page">
        <div className="empty-panel">
          <div className="empty-icon">🔍</div>
          <div className="empty-title">No Active Review</div>
          <div className="empty-description">
            Select a pull request from the Pull Requests page and click "Run AI Review" to view results.
          </div>
          <button className="btn btn-primary" onClick={() => onNavigate('pull-requests')}>
            Go to Pull Requests
          </button>
        </div>
      </div>
    )
  }

  // Extract distinct files from issues or metadata
  const distinctFiles = useMemo(() => {
    const list = [...new Set((reviewResult.issues || []).map((i) => i.file))]
    if (list.length === 0) {
      return ['backend/buggy_calculator.py', 'backend/app/auth/security.py']
    }
    return list
  }, [reviewResult])

  // Active file for diff viewer
  const activeFile = selectedFile || distinctFiles[0] || 'backend/buggy_calculator.py'
  const currentDiff = getDiffForFile(activeFile)

  // Filter issues
  const filteredIssues = useMemo(() => {
    return (reviewResult.issues || []).filter((issue) => {
      // File filter
      if (selectedFile && issue.file !== selectedFile) {
        return false
      }

      // Severity filter
      if (severityFilter !== 'All') {
        const s = (issue.severity || '').toLowerCase()
        const target = severityFilter.toLowerCase()
        if (target === 'critical' && s !== 'critical') return false
        if (target === 'warning' && s !== 'warning' && s !== 'high') return false
        if (target === 'info' && s !== 'info' && s !== 'low') return false
      }

      // Category filter
      if (categoryFilter !== 'All') {
        const c = (issue.issue_type || '').toLowerCase()
        const target = categoryFilter.toLowerCase()
        if (c !== target) return false
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matched =
          issue.title?.toLowerCase().includes(q) ||
          issue.file?.toLowerCase().includes(q) ||
          issue.explanation?.toLowerCase().includes(q) ||
          issue.what?.toLowerCase().includes(q)
        if (!matched) return false
      }

      return true
    })
  }, [reviewResult, selectedFile, severityFilter, categoryFilter, searchQuery])

  // Issue counts per file
  const fileIssueCounts = useMemo(() => {
    const counts = {}
    distinctFiles.forEach((f) => {
      counts[f] = (reviewResult.issues || []).filter((i) => i.file === f).length
    })
    return counts
  }, [reviewResult, distinctFiles])

  // Jump to code handler
  const handleViewCode = (file, line) => {
    setSelectedFile(file)
    setHighlightedLine(line)
    if (viewMode === 'issues') {
      setViewMode('split')
    }
    // Also scroll down to diff on mobile
    const el = document.getElementById(`diff-line-${line}`)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }

  // Copy full markdown report
  const handleCopyReport = () => {
    const lines = [
      `# 🤖 AI Code Review Summary - PR #${reviewResult.pr_number}`,
      `**Repository:** ${reviewResult.owner}/${reviewResult.repo_name}`,
      `**Score:** ${reviewResult.score}/100 · **Recommendation:** ${reviewResult.recommendation}`,
      ``,
      `### Review Summary`,
      `${reviewResult.summary}`,
      ``,
      `### Metrics`,
      `- **Files Reviewed:** ${reviewResult.files_reviewed}`,
      `- **Issues Found:** ${reviewResult.issues_found}`,
      `- **Critical:** ${reviewResult.severity_breakdown?.critical || 0}`,
      `- **High/Warning:** ${reviewResult.severity_breakdown?.high || 0}`,
      `- **Medium/Low:** ${reviewResult.severity_breakdown?.low || 0}`,
      `- **Passed Checks:** ${reviewResult.severity_breakdown?.passed || 12}`,
      ``,
      `## Detailed Findings`,
      ``,
      ...(reviewResult.issues || []).map((iss, i) =>
        `### ${i + 1}. [${iss.severity}] ${iss.title}\n` +
        `- **Location:** \`${iss.file}\` (Line ${iss.line})\n` +
        `- **Category:** \`${iss.issue_type}\`\n` +
        `- **Explanation:** ${iss.explanation || iss.what}\n` +
        (iss.after_code || iss.suggestion ? `- **Suggested Fix:**\n\`\`\`python\n${iss.after_code || iss.suggestion}\n\`\`\`\n` : '')
      ),
      `---\n*Generated by AI Code Review Assistant (Groq LLM)*`,
    ]

    navigator.clipboard.writeText(lines.join('\n'))
    setCopiedReport(true)
    setTimeout(() => setCopiedReport(false), 2500)
  }

  return (
    <div className="page-content review-results-page">
      {/* PR Header Banner */}
      <div className="results-header-banner">
        <div className="results-header-left">
          <div className="pr-meta-breadcrumbs">
            <span>{reviewResult.owner} / {reviewResult.repo_name}</span>
            <span className="dot-sep">·</span>
            <span className="pr-number-pill-lg">PR #{reviewResult.pr_number}</span>
            <span className="branch-flow-inline">
              <code>{reviewResult.source_branch}</code> → <code>{reviewResult.target_branch}</code>
            </span>
          </div>
          <h1 className="results-title">AI Pull Request Review Report</h1>
        </div>

        <div className="results-header-actions">
          <button
            className="btn btn-secondary btn-sm"
            onClick={handleCopyReport}
            id="copy-markdown-report-btn"
            title="Copy full review report in Markdown format"
          >
            {copiedReport ? '✓ Copied Markdown!' : '📋 Copy Report'}
          </button>

          <button
            className="btn btn-primary btn-sm"
            onClick={() => onRerunReview(reviewResult.owner, reviewResult.repo_name, reviewResult.pr_number)}
            id="rerun-ai-review-btn"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="23 4 23 10 17 10" />
              <polyline points="1 20 1 14 7 14" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
            <span>Re-run Review</span>
          </button>
        </div>
      </div>

      {/* Score Gauge & Breakdown Card */}
      <ScoreGauge
        score={reviewResult.score}
        recommendation={reviewResult.recommendation}
        breakdown={reviewResult.severity_breakdown}
      />

      {/* Review Executive Summary */}
      <div className="card-panel review-summary-panel">
        <div className="card-panel-header">
          <div className="summary-header-title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
            <span>Executive Review Summary</span>
          </div>
          <span className={`recommendation-pill-sm ${reviewResult.recommendation?.toLowerCase().includes('approve') ? 'pill-green' : 'pill-red'}`}>
            Recommendation: {reviewResult.recommendation}
          </span>
        </div>
        <div className="card-panel-body">
          <p className="summary-paragraph-text">{reviewResult.summary}</p>
        </div>
      </div>

      {/* Filter and View Mode Toolbar */}
      <div className="results-toolbar">
        {/* Severity Filters */}
        <div className="filter-group">
          <span className="filter-group-label">Severity:</span>
          {['All', 'Critical', 'Warning', 'Info'].map((sev) => (
            <button
              key={sev}
              id={`filter-sev-${sev.toLowerCase()}`}
              className={`filter-pill ${severityFilter === sev ? 'active' : ''}`}
              onClick={() => setSeverityFilter(sev)}
            >
              {sev === 'Critical' && '🔴 '}
              {sev === 'Warning' && '🟠 '}
              {sev === 'Info' && '🔵 '}
              {sev}
            </button>
          ))}
        </div>

        {/* Category Filters */}
        <div className="filter-group">
          <span className="filter-group-label">Category:</span>
          {['All', 'security', 'bug', 'performance', 'maintainability'].map((cat) => (
            <button
              key={cat}
              id={`filter-cat-${cat}`}
              className={`filter-pill ${categoryFilter === cat ? 'active' : ''}`}
              onClick={() => setCategoryFilter(cat)}
            >
              {cat === 'All' ? 'All' : cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="toolbar-search">
          <input
            type="text"
            placeholder="Search issues..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Layout Mode Toggle */}
        <div className="view-mode-toggle">
          <button
            className={`mode-btn ${viewMode === 'split' ? 'active' : ''}`}
            onClick={() => setViewMode('split')}
            title="Split Side-by-Side (Diff + Issues)"
          >
            Split View
          </button>
          <button
            className={`mode-btn ${viewMode === 'diff' ? 'active' : ''}`}
            onClick={() => setViewMode('diff')}
            title="Full Code Diff"
          >
            Code Diff
          </button>
          <button
            className={`mode-btn ${viewMode === 'issues' ? 'active' : ''}`}
            onClick={() => setViewMode('issues')}
            title="Issues Only"
          >
            Issues List
          </button>
        </div>
      </div>

      {/* Core Workspace Layout: Changed Files Sidebar + (Diff / Issues) */}
      <div className="results-main-grid">
        {/* Changed Files Sidebar Panel */}
        <div className="changed-files-panel">
          <div className="changed-files-header">
            <span className="panel-heading">Changed Files ({distinctFiles.length})</span>
          </div>

          <div className="changed-files-list">
            <button
              className={`file-row-btn ${selectedFile === null ? 'active' : ''}`}
              onClick={() => setSelectedFile(null)}
              id="file-filter-all"
            >
              <div className="file-name-col">
                <span className="file-icon">📁</span>
                <span className="file-name">All Changed Files</span>
              </div>
              <span className="file-issues-badge">
                {(reviewResult.issues || []).length}
              </span>
            </button>

            {distinctFiles.map((file) => {
              const count = fileIssueCounts[file] || 0
              const shortName = file.split('/').pop()
              const isCurrent = activeFile === file

              return (
                <button
                  key={file}
                  className={`file-row-btn ${isCurrent && selectedFile === file ? 'active' : ''}`}
                  onClick={() => setSelectedFile(file)}
                  id={`file-filter-${shortName}`}
                  title={file}
                >
                  <div className="file-name-col">
                    <span className="file-icon">
                      {count > 0 ? (count >= 2 ? '🔴' : '⚠️') : '✓'}
                    </span>
                    <span className="file-name">{shortName}</span>
                  </div>
                  {count > 0 && (
                    <span className={`file-issues-badge ${count >= 2 ? 'badge-critical' : 'badge-warning'}`}>
                      {count} issue{count > 1 ? 's' : ''}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Content Area: Diff Viewer and/or Issues List */}
        <div className={`results-content-area view-mode-${viewMode}`}>
          {/* Diff Viewer Column */}
          {(viewMode === 'split' || viewMode === 'diff') && (
            <div className="diff-column">
              <div className="column-header">
                <span className="column-title">GitHub-Style Code Diff</span>
                <span className="column-subtitle">Inspecting: <code>{activeFile}</code></span>
              </div>
              <DiffViewer
                filename={activeFile}
                diffText={currentDiff}
                issues={reviewResult.issues || []}
                highlightedLine={highlightedLine}
                onLineClick={(line) => setHighlightedLine(line)}
              />
            </div>
          )}

          {/* Issues Findings Column */}
          {(viewMode === 'split' || viewMode === 'issues') && (
            <div className="issues-column">
              <div className="column-header">
                <span className="column-title">
                  AI Review Findings ({filteredIssues.length})
                </span>
                {selectedFile && (
                  <span className="column-subtitle">
                    Filtering by <code>{selectedFile.split('/').pop()}</code>
                  </span>
                )}
              </div>

              {filteredIssues.length === 0 ? (
                <div className="no-issues-clean-card">
                  <div className="clean-icon">✅</div>
                  <div className="clean-title">No issues found matching filters</div>
                  <div className="clean-desc">
                    All lines in this selection passed automated code review checks without warnings.
                  </div>
                </div>
              ) : (
                <div className="issues-cards-stack">
                  {filteredIssues.map((issue) => (
                    <IssueCard
                      key={issue.id || `${issue.file}-${issue.line}`}
                      issue={issue}
                      onViewCode={handleViewCode}
                      isSelected={highlightedLine === issue.line && activeFile === issue.file}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
