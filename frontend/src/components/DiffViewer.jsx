import React, { useState, useEffect, useRef } from 'react'
import { parseUnifiedDiff, getLanguageFromFile } from '../utils/diffParser.js'
import { SeverityBadge, CategoryBadge } from './Badges.jsx'

export default function DiffViewer({
  filename,
  diffText,
  issues = [],
  highlightedLine = null,
  onLineClick,
}) {
  const [copiedFixId, setCopiedFixId] = useState(null)
  const lineRefs = useRef({})

  const parsedFiles = parseUnifiedDiff(diffText)
  const currentFile = parsedFiles.length > 0 ? parsedFiles[0] : null
  const language = getLanguageFromFile(filename)

  // Auto-scroll to highlighted line if requested
  useEffect(() => {
    if (highlightedLine && lineRefs.current[highlightedLine]) {
      lineRefs.current[highlightedLine].scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      })
    }
  }, [highlightedLine, filename])

  const handleCopy = (id, text) => {
    if (!text) return
    navigator.clipboard.writeText(text)
    setCopiedFixId(id)
    setTimeout(() => setCopiedFixId(null), 2500)
  }

  // Count additions and deletions
  let additions = 0
  let deletions = 0
  if (currentFile) {
    currentFile.hunks.forEach((hunk) => {
      hunk.lines.forEach((l) => {
        if (l.type === 'add') additions++
        if (l.type === 'del') deletions++
      })
    })
  }

  // Map issues for this file by line number
  const issuesByLine = {}
  issues.forEach((iss) => {
    if (iss.file === filename || iss.file.endsWith(filename) || filename.endsWith(iss.file)) {
      if (!issuesByLine[iss.line]) {
        issuesByLine[iss.line] = []
      }
      issuesByLine[iss.line].push(iss)
    }
  })

  if (!diffText || !currentFile) {
    return (
      <div className="diff-viewer-empty">
        <div className="diff-empty-icon">📄</div>
        <div className="diff-empty-title">Diff Preview Not Available</div>
        <div className="diff-empty-desc">
          Diff data for <code>{filename}</code> could not be parsed directly.
        </div>
      </div>
    )
  }

  return (
    <div className="github-diff-container">
      {/* Diff File Header */}
      <div className="diff-file-header">
        <div className="diff-file-info">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
          <span className="diff-file-path">{filename}</span>
          <span className="diff-lang-badge">{language}</span>
        </div>
        <div className="diff-stat-counts">
          <span className="diff-add-count">+{additions}</span>
          <span className="diff-del-count">-{deletions}</span>
          {Object.keys(issuesByLine).length > 0 && (
            <span className="diff-issue-pill">
              ⚠️ {Object.keys(issuesByLine).length} line issue(s)
            </span>
          )}
        </div>
      </div>

      {/* Diff Content Table */}
      <div className="diff-table-wrapper">
        <table className="diff-table">
          <tbody>
            {currentFile.hunks.map((hunk, hIdx) => (
              <React.Fragment key={`hunk-${hIdx}`}>
                {/* Hunk Header */}
                <tr className="diff-hunk-row">
                  <td className="diff-line-num hunk-num">...</td>
                  <td className="diff-line-num hunk-num">...</td>
                  <td className="diff-hunk-content" colSpan="2">
                    {hunk.header}
                  </td>
                </tr>

                {/* Hunk Lines */}
                {hunk.lines.map((line, lIdx) => {
                  const lineNum = line.newLineNo || line.oldLineNo
                  const lineIssues = line.newLineNo ? issuesByLine[line.newLineNo] : null
                  const isHighlighted = highlightedLine === line.newLineNo

                  return (
                    <React.Fragment key={`line-${hIdx}-${lIdx}`}>
                      <tr
                        ref={(el) => {
                          if (line.newLineNo) {
                            lineRefs.current[line.newLineNo] = el
                          }
                        }}
                        id={`diff-line-${line.newLineNo || `del-${line.oldLineNo}`}`}
                        className={`diff-row diff-${line.type} ${isHighlighted ? 'row-highlighted' : ''} ${lineIssues ? 'row-has-issue' : ''}`}
                        onClick={() => line.newLineNo && onLineClick && onLineClick(line.newLineNo)}
                      >
                        <td className="diff-line-num old-num">
                          {line.oldLineNo || ''}
                        </td>
                        <td className="diff-line-num new-num">
                          {line.newLineNo || ''}
                        </td>
                        <td className="diff-sign">
                          {line.type === 'add' ? '+' : line.type === 'del' ? '-' : ' '}
                        </td>
                        <td className="diff-code">
                          <code>{line.content || ' '}</code>
                        </td>
                      </tr>

                      {/* Line-level AI Issues Inline Banner */}
                      {lineIssues && lineIssues.map((issue, issIdx) => (
                        <tr key={`inline-iss-${issIdx}`} className="diff-inline-issue-row">
                          <td colSpan="4" className="diff-inline-issue-cell">
                            <div className={`inline-issue-box severity-${issue.severity.toLowerCase()}`}>
                              <div className="inline-issue-header">
                                <div className="inline-issue-tags">
                                  <SeverityBadge severity={issue.severity} size="small" />
                                  <CategoryBadge type={issue.issue_type} />
                                  <span className="inline-issue-loc">
                                    Line {issue.line}
                                  </span>
                                </div>
                                <span className="inline-issue-title">{issue.title}</span>
                              </div>

                              {/* Structured Explanation */}
                              <div className="inline-issue-body">
                                {issue.what && (
                                  <div className="explanation-block">
                                    <div className="block-label">What is wrong?</div>
                                    <div className="block-text">{issue.what}</div>
                                  </div>
                                )}

                                {issue.why && (
                                  <div className="explanation-block">
                                    <div className="block-label">Why does it matter?</div>
                                    <div className="block-text">{issue.why}</div>
                                  </div>
                                )}

                                {issue.how && (
                                  <div className="explanation-block">
                                    <div className="block-label">How should it be fixed?</div>
                                    <div className="block-text">{issue.how}</div>
                                  </div>
                                )}

                                {/* Suggested Fix Before / After */}
                                {(issue.before_code || issue.after_code || issue.suggestion) && (
                                  <div className="suggested-fix-box">
                                    <div className="suggested-fix-header">
                                      <span>Suggested Fix</span>
                                      <button
                                        type="button"
                                        className="btn btn-copy-fix"
                                        onClick={() => handleCopy(issue.id || issIdx, issue.after_code || issue.suggestion)}
                                        title="Copy suggested fix to clipboard"
                                      >
                                        {copiedFixId === (issue.id || issIdx) ? '✓ Copied!' : '📋 Copy Fix'}
                                      </button>
                                    </div>

                                    {issue.before_code && (
                                      <div className="fix-code-block before">
                                        <div className="fix-label">Before</div>
                                        <pre><code>{issue.before_code}</code></pre>
                                      </div>
                                    )}

                                    <div className="fix-code-block after">
                                      <div className="fix-label">After</div>
                                      <pre><code>{issue.after_code || issue.suggestion}</code></pre>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </React.Fragment>
                  )
                })}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
