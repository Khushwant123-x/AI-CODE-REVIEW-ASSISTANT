/**
 * File list sidebar – shows all reviewed files with issue counts.
 * Clicking a file filters the main issue list.
 */
export default function FileSidebar({ files, issues, activeFile, onFileClick }) {
  function issueCount(file) {
    return issues.filter(i => i.file === file).length
  }

  function fileIcon(file) {
    const count = issueCount(file)
    if (count === 0) return '✓'
    const hasC = issues.some(i => i.file === file && i.severity === 'Critical')
    if (hasC) return '🔴'
    return '⚠'
  }

  return (
    <div className="panel">
      <div className="panel-header">
        <span className="panel-title">Files Reviewed</span>
        <span className="section-count">{files.length}</span>
      </div>
      <div className="panel-body" style={{ padding: '8px' }}>
        {files.length === 0 ? (
          <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
            No files yet
          </div>
        ) : (
          <ul className="file-list">
            <li
              className={`file-item ${activeFile === null ? 'active' : ''}`}
              onClick={() => onFileClick(null)}
              id="file-filter-all"
            >
              <span className="file-item-icon">📁</span>
              <span className="file-item-name">All files</span>
              <span className="file-issue-count">{issues.length}</span>
            </li>
            {files.map(file => {
              const count = issueCount(file)
              const icon  = fileIcon(file)
              const name  = file.split('/').pop()
              return (
                <li
                  key={file}
                  className={`file-item ${activeFile === file ? 'active' : ''}`}
                  onClick={() => onFileClick(file)}
                  title={file}
                  id={`file-filter-${name}`}
                >
                  <span className="file-item-icon">{icon}</span>
                  <span className="file-item-name">{name}</span>
                  {count > 0 && (
                    <span className="file-issue-count">{count}</span>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
