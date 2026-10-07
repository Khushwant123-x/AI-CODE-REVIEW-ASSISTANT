/**
 * Loading overlay with animated step indicators.
 */
import { useState, useEffect } from 'react'

const STEPS = [
  'Connecting to GitHub…',
  'Fetching PR diff…',
  'Parsing changed files…',
  'Chunking diff…',
  'Running Groq analysis…',
  'Validating findings…',
  'Filtering duplicates…',
  'Posting review comments…',
]

export default function LoadingState() {
  const [stepIdx, setStepIdx] = useState(0)

  useEffect(() => {
    const id = setInterval(() => {
      setStepIdx(i => Math.min(i + 1, STEPS.length - 1))
    }, 1800)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="loading-overlay">
      <div className="spinner" />
      <div className="loading-text">Analyzing Pull Request…</div>
      <div className="loading-steps">
        {STEPS.slice(0, stepIdx + 1).map((step, i) => (
          <div
            key={step}
            className={`loading-step ${i < stepIdx ? 'done' : ''}`}
            style={{ animationDelay: `${i * 0.05}s` }}
          >
            <div className="loading-step-dot" />
            {step}
          </div>
        ))}
      </div>
    </div>
  )
}
