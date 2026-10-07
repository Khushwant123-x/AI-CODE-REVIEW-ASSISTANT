import { useState, useEffect, useMemo } from 'react'
import Header       from './components/Header.jsx'
import PRInputPanel from './components/PRInputPanel.jsx'
import SummaryCards from './components/SummaryCards.jsx'
import FilterBar    from './components/FilterBar.jsx'
import IssueList    from './components/IssueList.jsx'
import FileSidebar  from './components/FileSidebar.jsx'
import LoadingState from './components/LoadingState.jsx'
import { reviewPullRequest, checkHealth } from './services/api.js'

export default function App() {
  const [systemReady,     setSystemReady]     = useState(false)
  const [loading,         setLoading]         = useState(false)
  const [result,          setResult]          = useState(null)
  const [error,           setError]           = useState(null)
  const [severityFilter,  setSeverityFilter]  = useState('All')
  const [typeFilter,      setTypeFilter]      = useState(null)
  const [activeFile,      setActiveFile]      = useState(null)

  // ── Health check on mount ────────────────────────────────────────
  useEffect(() => {
    checkHealth()
      .then(() => setSystemReady(true))
      .catch(() => setSystemReady(false))
  }, [])

  // ── Submit handler ───────────────────────────────────────────────
  async function handleReview(owner, repo, prNumber) {
    setLoading(true)
    setError(null)
    setResult(null)
    setSeverityFilter('All')
    setTypeFilter(null)
    setActiveFile(null)

    try {
      const data = await reviewPullRequest(owner, repo, prNumber)
      setResult(data)
    } catch (err) {
      setError(err.message || 'An unexpected error occurred.')
    } finally {
      setLoading(false)
    }
  }

  const [copied, setCopied] = useState(false)

  // ── Demo review loader ───────────────────────────────────────────
  function handleDemo() {
    setError(null)
    setSeverityFilter('All')
    setTypeFilter(null)
    setActiveFile(null)
    setResult({
      status: 'success',
      pr_number: 42,
      files_reviewed: 3,
      issues_found: 4,
      comments_posted: 0,
      issues: [
        {
          file: 'backend/app/auth/security.py',
          line: 45,
          severity: 'Critical',
          issue_type: 'security',
          title: 'Hardcoded JWT secret key allows signature forgery',
          explanation: 'The HMAC secret key is hardcoded as a fallback string literal in the source code. Anyone with access to the repository can forge arbitrary authentication tokens with elevated admin claims.',
          suggestion: 'Fetch the secret strictly from an environment variable and fail fast on startup if unset:\nsecret = os.environ["JWT_SECRET_KEY"]'
        },
        {
          file: 'backend/app/api/users.py',
          line: 112,
          severity: 'Warning',
          issue_type: 'bug',
          title: 'Uncaught AttributeError on optional user profile avatar',
          explanation: 'Accessing user.profile.avatar_url directly will raise an AttributeError when profile is None for newly registered accounts or external OAuth users.',
          suggestion: 'Use safe traversal or getattr:\navatar_url = user.profile.avatar_url if user.profile else None'
        },
        {
          file: 'backend/app/db/repositories.py',
          line: 78,
          severity: 'Warning',
          issue_type: 'performance',
          title: 'N+1 database query inside serialization loop',
          explanation: 'Querying user permissions inside the loop generates N individual SQL queries, which causes excessive database roundtrips and degrades response latency under load.',
          suggestion: 'Use joinedload or selectinload in the initial database query:\nquery = select(User).options(selectinload(User.permissions))'
        },
        {
          file: 'backend/app/auth/security.py',
          line: 94,
          severity: 'Info',
          issue_type: 'maintainability',
          title: 'Missing type annotations and docstring on public helper',
          explanation: 'Function verify_token_payload lacks return type annotations and docstring describing accepted claims and expiry rules.',
          suggestion: 'Add clear type annotations:\ndef verify_token_payload(payload: dict[str, Any]) -> TokenData:'
        }
      ]
    })
  }

  function handleCopyMarkdown() {
    if (!result) return
    const lines = [
      `# 🤖 AI Code Review Summary - PR #${result.pr_number}`,
      ``,
      `| Metric | Count |`,
      `| --- | --- |`,
      `| **Files Reviewed** | ${result.files_reviewed} |`,
      `| **Issues Found** | ${result.issues_found} |`,
      `| **Comments Posted** | ${result.comments_posted} |`,
      ``,
      `## Detailed Findings`,
      ``,
      ...result.issues.map(
        (iss, i) =>
          `### ${i + 1}. [${iss.severity}] ${iss.title}\n` +
          `- **File:** \`${iss.file}\` (Line ${iss.line})\n` +
          `- **Type:** \`${iss.issue_type}\`\n` +
          `- **Explanation:** ${iss.explanation}\n` +
          `- **Suggestion:**\n\`\`\`\n${iss.suggestion}\n\`\`\`\n`
      ),
      `---\n*Generated by AI Code Review Assistant (Groq LLM)*`
    ]
    navigator.clipboard.writeText(lines.join('\n'))
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  // ── Filtered issues ──────────────────────────────────────────────
  const filteredIssues = useMemo(() => {
    if (!result) return []
    return result.issues.filter(issue => {
      if (severityFilter !== 'All' && issue.severity !== severityFilter) return false
      if (typeFilter && issue.issue_type !== typeFilter) return false
      if (activeFile && issue.file !== activeFile) return false
      return true
    })
  }, [result, severityFilter, typeFilter, activeFile])

  // ── Files in result ──────────────────────────────────────────────
  const files = useMemo(() => {
    if (!result) return []
    // Build from parsed files list if available
    const fromIssues = [...new Set(result.issues.map(i => i.file))]
    return fromIssues
  }, [result])

  return (
    <div className="app">
      <Header systemReady={systemReady} />

      <main className="main">
        <div className="container">

          {/* ── Error banner ───────────────────────────────────── */}
          {error && (
            <div className="error-state" role="alert">
              <span className="error-icon">⛔</span>
              <div>
                <div className="error-title">Review Failed</div>
                <div className="error-message">{error}</div>
              </div>
            </div>
          )}

          <div className="page-layout">
            {/* ── Left sidebar ─────────────────────────────────── */}
            <aside style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <PRInputPanel onSubmit={handleReview} onDemo={handleDemo} loading={loading} />

              {result && (
                <FileSidebar
                  files={files}
                  issues={result.issues}
                  activeFile={activeFile}
                  onFileClick={setActiveFile}
                />
              )}

              {!result && !loading && !error && (
                <div className="panel">
                  <div className="panel-body">
                    <div className="empty-state" style={{ padding: '24px 0' }}>
                      <div className="empty-state-icon">📋</div>
                      <div className="empty-state-title">No review yet</div>
                      <div className="empty-state-description">
                        Enter a GitHub repository and Pull Request number, or click <strong>Load Demo</strong> to preview findings.
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </aside>

            {/* ── Main content ──────────────────────────────────── */}
            <section>
              {loading && <LoadingState />}

              {!loading && result && (
                <>
                  <SummaryCards result={result} />

                  <FilterBar
                    severityFilter={severityFilter}
                    typeFilter={typeFilter}
                    onSeverity={setSeverityFilter}
                    onType={setTypeFilter}
                  />

                  <div className="section-header">
                    <h1 className="section-title">
                      Review Findings
                      {activeFile && (
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: 8, fontWeight: 400 }}>
                          · {activeFile.split('/').pop()}
                        </span>
                      )}
                    </h1>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <button
                        className="btn btn-secondary"
                        style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                        onClick={handleCopyMarkdown}
                        title="Copy full review report as Markdown"
                      >
                        {copied ? '✓ Copied Markdown!' : '📋 Copy Report'}
                      </button>
                      <span className="section-count">{filteredIssues.length} issue{filteredIssues.length !== 1 ? 's' : ''}</span>
                    </div>
                  </div>

                  {result.issues_found === 0 ? (
                    <div className="no-issues">
                      <div className="no-issues-icon">✅</div>
                      <div className="no-issues-text">
                        No issues found — this PR looks clean!
                      </div>
                    </div>
                  ) : (
                    <IssueList issues={filteredIssues} />
                  )}
                </>
              )}

              {!loading && !result && !error && (
                <div className="empty-state">
                  <div className="empty-state-icon">🔍</div>
                  <div className="empty-state-title">Ready to review</div>
                  <div className="empty-state-description">
                    Fill in the form on the left with a GitHub owner, repository name,
                    and pull request number, then click <strong>Review Pull Request</strong> to
                    start the AI-powered analysis.
                  </div>
                </div>
              )}
            </section>
          </div>

        </div>
      </main>
    </div>
  )
}
