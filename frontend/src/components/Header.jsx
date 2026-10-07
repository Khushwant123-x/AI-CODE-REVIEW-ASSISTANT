/**
 * Header component – brand, title, system status badge.
 */
export default function Header({ systemReady }) {
  return (
    <header className="header">
      <div className="container">
        <div className="header-inner">
          <div className="header-brand">
            <div className="header-logo">🤖</div>
            <div>
              <div className="header-title">AI Code Review Assistant</div>
              <div className="header-subtitle">Automated GitHub Pull Request Analysis · Powered by Groq</div>
            </div>
          </div>

          <div className="status-badge">
            <div className="status-dot" style={{ background: systemReady ? 'var(--success-text)' : 'var(--warning-text)' }} />
            <span>{systemReady ? 'System Ready' : 'Connecting…'}</span>
          </div>
        </div>
      </div>
    </header>
  )
}
