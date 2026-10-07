/**
 * Summary cards row – files reviewed, issues found, critical, warnings, info.
 */
export default function SummaryCards({ result }) {
  const critical = result.issues.filter(i => i.severity === 'Critical').length
  const warning  = result.issues.filter(i => i.severity === 'Warning').length
  const info     = result.issues.filter(i => i.severity === 'Info').length

  const cards = [
    { label: 'Files Reviewed', value: result.files_reviewed, cls: 'card-files'    },
    { label: 'Issues Found',   value: result.issues_found,   cls: 'card-total'    },
    { label: 'Critical',       value: critical,              cls: 'card-critical' },
    { label: 'Warnings',       value: warning,               cls: 'card-warning'  },
    { label: 'Info',           value: info,                  cls: 'card-info'     },
  ]

  return (
    <div className="summary-cards">
      {cards.map(c => (
        <div key={c.label} className={`summary-card ${c.cls}`}>
          <div className="summary-card-value">{c.value}</div>
          <div className="summary-card-label">{c.label}</div>
        </div>
      ))}
    </div>
  )
}
