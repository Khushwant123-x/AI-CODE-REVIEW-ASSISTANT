import { useState } from 'react'

/**
 * PR input panel – owner, repo, PR number fields + URL quick paste + submit button.
 */
export default function PRInputPanel({ onSubmit, onDemo, loading }) {
  const [owner, setOwner] = useState('')
  const [repo, setRepo]   = useState('')
  const [prNum, setPrNum] = useState('')
  const [urlInput, setUrlInput] = useState('')

  const handleUrlParse = (url) => {
    setUrlInput(url)
    const match = url.trim().match(/github\.com\/([^\/]+)\/([^\/]+)\/pull\/(\d+)/i)
    if (match) {
      setOwner(match[1])
      setRepo(match[2])
      setPrNum(match[3])
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!owner.trim() || !repo.trim() || !prNum) return
    onSubmit(owner.trim(), repo.trim(), parseInt(prNum, 10))
  }

  return (
    <div className="panel">
      <div className="panel-header">
        <span className="panel-title">Pull Request</span>
        {onDemo && (
          <button
            type="button"
            className="btn btn-secondary"
            style={{ fontSize: '0.75rem', padding: '4px 10px' }}
            onClick={onDemo}
            disabled={loading}
            id="demo-review-btn"
          >
            ⚡ Load Demo
          </button>
        )}
      </div>
      <div className="panel-body">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="url-input" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Paste Full PR URL (Optional)
            </label>
            <input
              id="url-input"
              type="text"
              placeholder="https://github.com/owner/repo/pull/123"
              value={urlInput}
              onChange={(e) => handleUrlParse(e.target.value)}
              disabled={loading}
              autoComplete="off"
              style={{ fontSize: '0.8rem' }}
            />
          </div>

          <div className="form-group">
            <label htmlFor="owner-input">GitHub Owner</label>
            <input
              id="owner-input"
              type="text"
              placeholder="e.g. facebook"
              value={owner}
              onChange={(e) => setOwner(e.target.value)}
              disabled={loading}
              autoComplete="off"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="repo-input">Repository</label>
            <input
              id="repo-input"
              type="text"
              placeholder="e.g. react"
              value={repo}
              onChange={(e) => setRepo(e.target.value)}
              disabled={loading}
              autoComplete="off"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="pr-input">Pull Request #</label>
            <input
              id="pr-input"
              type="number"
              placeholder="e.g. 31415"
              min="1"
              value={prNum}
              onChange={(e) => setPrNum(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <button
            id="review-btn"
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center' }}
            disabled={loading || !owner || !repo || !prNum}
          >
            {loading ? (
              <>
                <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
                Analyzing PR…
              </>
            ) : (
              <>🔍 Review Pull Request</>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
