import React from 'react'

export default function ScoreGauge({
  score = 82,
  recommendation = 'Changes Requested',
  breakdown = {},
}) {
  const critical = breakdown.critical ?? 0
  const high = breakdown.high ?? 0
  const medium = breakdown.medium ?? 0
  const low = breakdown.low ?? 0
  const passed = breakdown.passed ?? 12

  // Score color calculation
  let strokeColor = '#3fb950' // green
  let scoreClass = 'score-passed'
  if (score < 75 || critical > 0) {
    strokeColor = '#f85149' // red
    scoreClass = 'score-critical'
  } else if (score < 90 || high > 0) {
    strokeColor = '#d29922' // yellow
    scoreClass = 'score-warning'
  }

  // Recommendation status
  let recClass = 'rec-changes'
  let recIcon = '⛔'
  let recText = 'Changes Requested'

  const recNormalized = (recommendation || '').toLowerCase()
  if (recNormalized.includes('approve') || (critical === 0 && high === 0 && score >= 90)) {
    recClass = 'rec-approved'
    recIcon = '✅'
    recText = 'Approved'
  } else if (recNormalized.includes('review') || (critical === 0 && high <= 2)) {
    recClass = 'rec-review'
    recIcon = '⚠️'
    recText = 'Needs Review'
  } else {
    recClass = 'rec-changes'
    recIcon = '🛑'
    recText = 'Changes Requested'
  }

  // SVG circular gauge math
  const radius = 46
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (score / 100) * circumference

  return (
    <div className="review-score-panel">
      <div className="score-main-col">
        {/* Circular Gauge */}
        <div className="score-gauge-wrapper">
          <svg className="score-gauge-svg" width="120" height="120" viewBox="0 0 120 120">
            <circle
              className="score-gauge-bg"
              cx="60"
              cy="60"
              r={radius}
              strokeWidth="9"
            />
            <circle
              className="score-gauge-bar"
              cx="60"
              cy="60"
              r={radius}
              strokeWidth="9"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              stroke={strokeColor}
              strokeLinecap="round"
            />
          </svg>
          <div className="score-gauge-text">
            <span className={`score-number ${scoreClass}`}>{score}</span>
            <span className="score-out-of">/ 100</span>
          </div>
        </div>

        {/* Score Title & Recommendation Badge */}
        <div className="score-meta">
          <div className="score-header-title">Overall Review Score</div>
          <div className={`recommendation-badge ${recClass}`}>
            <span className="rec-icon">{recIcon}</span>
            <span className="rec-text">{recText}</span>
          </div>
          <div className="score-description">
            {critical > 0
              ? `${critical} critical security/correctness finding(s) require resolution before merge.`
              : high > 0
              ? `${high} warning(s) should be investigated by the PR author.`
              : 'Pull request diff conforms to quality and security standards.'}
          </div>
        </div>
      </div>

      {/* Severity Breakdown Badges Grid */}
      <div className="severity-counts-grid">
        <div className="severity-count-item count-critical">
          <div className="count-icon">🔴</div>
          <div className="count-val">{critical}</div>
          <div className="count-lbl">Critical</div>
        </div>

        <div className="severity-count-item count-high">
          <div className="count-icon">🟠</div>
          <div className="count-val">{high}</div>
          <div className="count-lbl">High</div>
        </div>

        <div className="severity-count-item count-medium">
          <div className="count-icon">🟡</div>
          <div className="count-val">{medium}</div>
          <div className="count-lbl">Medium</div>
        </div>

        <div className="severity-count-item count-low">
          <div className="count-icon">🔵</div>
          <div className="count-val">{low}</div>
          <div className="count-lbl">Low</div>
        </div>

        <div className="severity-count-item count-passed">
          <div className="count-icon">🟢</div>
          <div className="count-val">{passed}</div>
          <div className="count-lbl">Passed</div>
        </div>
      </div>
    </div>
  )
}
