/**
 * API service layer – all backend communication happens here.
 * Backend URL comes from the VITE_API_URL env variable.
 */

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

/**
 * Check backend health.
 * @returns {Promise<{status: string, groq_model: string}>}
 */
export async function checkHealth() {
  const resp = await fetch(`${BASE_URL}/health`)
  if (!resp.ok) throw new Error(`Health check failed: ${resp.status}`)
  return resp.json()
}

/**
 * Submit a pull request for AI code review.
 *
 * @param {string} owner      - GitHub repository owner
 * @param {string} repo       - GitHub repository name
 * @param {number} prNumber   - Pull request number
 * @returns {Promise<ReviewResponse>}
 */
export async function reviewPullRequest(owner, repo, prNumber) {
  const resp = await fetch(`${BASE_URL}/review`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      owner,
      repo,
      pr_number: Number(prNumber),
    }),
  })

  if (!resp.ok) {
    let message = `Server error: ${resp.status}`
    try {
      const err = await resp.json()
      message = err.detail || message
    } catch (_) {}
    throw new Error(message)
  }

  return resp.json()
}
