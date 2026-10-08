import React, { useState, useEffect } from 'react'

const REVIEW_STEPS = [
  { id: 'files', label: 'Fetching changed files' },
  { id: 'analysis', label: 'Analyzing code' },
  { id: 'llm', label: 'Running AI review' },
  { id: 'suggestions', label: 'Generating suggestions' },
]

export default function LoadingSteps({ onCancel }) {
  const [currentStepIdx, setCurrentStepIdx] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentStepIdx((prev) => {
        if (prev < REVIEW_STEPS.length - 1) {
          return prev + 1
        }
        return prev
      })
    }, 1400)

    return () => clearInterval(timer)
  }, [])

  return (
    <div className="review-loading-card" role="status" aria-live="polite">
      <div className="loading-card-header">
        <div className="loading-spinner-ring" />
        <div className="loading-card-title">Analyzing Pull Request...</div>
      </div>

      <div className="loading-steps-list">
        {REVIEW_STEPS.map((step, idx) => {
          let status = 'pending' // pending
          let icon = '○'

          if (idx < currentStepIdx) {
            status = 'completed'
            icon = '✓'
          } else if (idx === currentStepIdx) {
            status = 'active'
            icon = '●'
          }

          return (
            <div key={step.id} className={`step-row step-${status}`}>
              <span className="step-bullet">{icon}</span>
              <span className="step-label">{step.label}</span>
              {status === 'active' && <span className="step-active-pulse" />}
            </div>
          )
        })}
      </div>

      <div className="loading-footer-tip">
        Groq LLM is scanning parsed diff hunks for logic defects, SQL injections, and performance risks.
      </div>
    </div>
  )
}
