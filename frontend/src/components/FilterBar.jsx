/**
 * Severity and type filter bar.
 */
const SEVERITIES = ['All', 'Critical', 'Warning', 'Info']
const TYPES      = ['bug', 'security', 'performance', 'style', 'maintainability']

const TYPE_LABEL = {
  bug:             '🐛 Bug',
  security:        '🔒 Security',
  performance:     '⚡ Perf',
  style:           '🎨 Style',
  maintainability: '🔧 Maintain',
}

export default function FilterBar({ severityFilter, typeFilter, onSeverity, onType }) {
  return (
    <div className="filter-bar">
      <span className="filter-label">Severity</span>

      {SEVERITIES.map(sev => (
        <button
          key={sev}
          id={`filter-sev-${sev.toLowerCase()}`}
          className={`btn btn-filter ${severityFilter === sev ? 'active' : ''}`}
          onClick={() => onSeverity(sev)}
        >
          {sev}
        </button>
      ))}

      <div className="filter-divider" />

      <span className="filter-label">Type</span>

      {TYPES.map(t => (
        <button
          key={t}
          id={`filter-type-${t}`}
          className={`btn btn-filter ${typeFilter === t ? 'active' : ''}`}
          onClick={() => onType(typeFilter === t ? null : t)}
        >
          {TYPE_LABEL[t]}
        </button>
      ))}
    </div>
  )
}
