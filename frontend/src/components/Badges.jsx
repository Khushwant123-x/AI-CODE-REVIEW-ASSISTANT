import React from 'react'

export function SeverityBadge({ severity, size = 'normal' }) {
  const sev = (severity || 'info').toLowerCase()

  let label = severity || 'Info'
  let dotColor = '#58a6ff'
  let cls = 'badge-info'

  if (sev === 'critical') {
    label = 'Critical'
    dotColor = '#f85149'
    cls = 'badge-critical'
  } else if (sev === 'warning' || sev === 'high') {
    label = 'Warning'
    dotColor = '#d29922'
    cls = 'badge-warning'
  } else if (sev === 'info' || sev === 'low') {
    label = 'Info'
    dotColor = '#58a6ff'
    cls = 'badge-info'
  }

  return (
    <span className={`severity-tag ${cls} ${size === 'small' ? 'size-sm' : ''}`}>
      <span className="severity-dot" style={{ backgroundColor: dotColor }} />
      <span>{label}</span>
    </span>
  )
}

export function CategoryBadge({ type }) {
  const t = (type || 'general').toLowerCase()
  let icon = '📌'
  let cls = 'cat-default'

  switch (t) {
    case 'security':
      icon = '🛡️'
      cls = 'cat-security'
      break
    case 'bug':
      icon = '🐛'
      cls = 'cat-bug'
      break
    case 'performance':
      icon = '⚡'
      cls = 'cat-performance'
      break
    case 'maintainability':
    case 'quality':
      icon = '🔧'
      cls = 'cat-maintainability'
      break
    case 'style':
      icon = '🎨'
      cls = 'cat-style'
      break
    case 'testing':
      icon = '🧪'
      cls = 'cat-testing'
      break
    default:
      icon = '📋'
      cls = 'cat-default'
  }

  return (
    <span className={`category-tag ${cls}`}>
      <span className="category-icon">{icon}</span>
      <span className="category-label">{type}</span>
    </span>
  )
}
