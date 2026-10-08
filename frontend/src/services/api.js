/**
 * API service layer – central communication for backend and GitHub integration.
 * Connects to FastAPI backend (/health, /review).
 * Works for ANY GitHub repository and ANY Pull Request!
 */

import {
  DEFAULT_REPOSITORIES,
  DEFAULT_PULL_REQUESTS,
  DEMO_REVIEW_PR3,
  MOCK_DIFFS,
} from './mockData.js'
import { getAllRepositories } from './storage.js'
import { getStoredAuthToken, fetchRepoPullRequestsWithAuth } from './githubAuth.js'

let customApiUrl = localStorage.getItem('ai_code_review_api_url') || ''
const BASE_URL = customApiUrl || import.meta.env.VITE_API_URL || 'http://localhost:8000'

export function getApiBaseUrl() {
  return customApiUrl || import.meta.env.VITE_API_URL || 'http://localhost:8000'
}

export function setApiBaseUrl(url) {
  customApiUrl = url
  if (url) {
    localStorage.setItem('ai_code_review_api_url', url)
  } else {
    localStorage.removeItem('ai_code_review_api_url')
  }
}

/**
 * Check backend health and get Groq model configuration.
 */
export async function checkHealth() {
  const url = `${getApiBaseUrl()}/health`
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 3500)

    const resp = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
    })
    clearTimeout(timer)

    if (!resp.ok) {
      return { status: 'error', online: false, error: `HTTP ${resp.status}` }
    }
    const data = await resp.json()
    return { ...data, online: true }
  } catch (err) {
    return {
      status: 'offline',
      online: false,
      error: err.name === 'AbortError' ? 'Connection timed out' : 'Backend offline or unreachable',
    }
  }
}

/**
 * Normalizes a ReviewResponse from backend into standard UI format
 * with score calculation, severity breakdowns, and structured explanations.
 */
export function normalizeReviewResponse(raw, owner, repo, prNumber) {
  const issues = (raw.issues || []).map((iss, index) => {
    let sev = iss.severity || 'Info'
    if (sev.toLowerCase() === 'critical') sev = 'Critical'
    else if (sev.toLowerCase() === 'warning' || sev.toLowerCase() === 'high') sev = 'Warning'
    else if (sev.toLowerCase() === 'info' || sev.toLowerCase() === 'low') sev = 'Info'

    const what = iss.what || iss.title || 'Code defect identified'
    const why = iss.why || iss.explanation || 'May impact application security or stability'
    const how = iss.how || (iss.suggestion ? 'Apply the recommended code fix below.' : 'Refactor the affected lines.')

    return {
      id: iss.id || `issue-${index + 1}`,
      file: iss.file || 'unknown',
      line: Number(iss.line) || 1,
      severity: sev,
      issue_type: iss.issue_type || 'bug',
      title: iss.title || 'Review Finding',
      explanation: iss.explanation || why,
      what,
      why,
      how,
      suggestion: iss.suggestion || '',
      before_code: iss.before_code || '',
      after_code: iss.after_code || iss.suggestion || '',
    }
  })

  // Severity counts
  const critical = issues.filter(i => i.severity === 'Critical').length
  const high = issues.filter(i => i.severity === 'Warning').length
  const medium = issues.filter(i => i.severity === 'Info' && (i.issue_type === 'performance' || i.issue_type === 'bug')).length
  const low = issues.filter(i => i.severity === 'Info' && !(i.issue_type === 'performance' || i.issue_type === 'bug')).length
  const passed = Math.max(0, 15 - issues.length)

  // Compute review score
  let computedScore = raw.score
  if (computedScore === undefined || computedScore === null) {
    const deductions = (critical * 15) + (high * 6) + (low * 2)
    computedScore = Math.max(25, Math.min(100, 100 - deductions))
  }

  // Determine Recommendation
  let recommendation = raw.recommendation
  if (!recommendation) {
    if (critical > 0) {
      recommendation = 'Changes Requested'
    } else if (high > 1) {
      recommendation = 'Needs Review'
    } else {
      recommendation = 'Approved'
    }
  }

  // Summary generation
  let summary = raw.summary
  if (!summary) {
    if (issues.length === 0) {
      summary = 'All automated AI inspection checks passed cleanly. No security vulnerabilities or defect patterns detected in the PR diff.'
    } else {
      const topIssues = issues.slice(0, 2).map(i => `"${i.title}"`).join(' and ')
      summary = `The AI review identified ${issues.length} potential issue(s), notably ${topIssues}. Please inspect the line-level findings and suggested fixes below.`
    }
  }

  return {
    status: raw.status || 'success',
    pr_number: Number(prNumber),
    repo_name: repo,
    owner,
    source_branch: raw.source_branch || 'feature-branch',
    target_branch: raw.target_branch || 'main',
    author: raw.author || owner,
    files_reviewed: raw.files_reviewed ?? [...new Set(issues.map(i => i.file))].length,
    issues_found: issues.length,
    comments_posted: raw.comments_posted || 0,
    score: computedScore,
    recommendation,
    summary,
    severity_breakdown: {
      critical,
      high,
      medium,
      low,
      passed,
    },
    categories_breakdown: {
      security: issues.filter(i => i.issue_type === 'security').length,
      bug: issues.filter(i => i.issue_type === 'bug').length,
      performance: issues.filter(i => i.issue_type === 'performance').length,
      maintainability: issues.filter(i => i.issue_type === 'maintainability').length,
      style: issues.filter(i => i.issue_type === 'style').length,
    },
    issues,
  }
}

/**
 * Submit ANY pull request for AI code review to the FastAPI backend.
 * Works for ANY GitHub owner, repo, and PR number.
 *
 * @param {string} owner      - GitHub repository owner (e.g. "facebook", "torvalds", "my-org")
 * @param {string} repo       - GitHub repository name (e.g. "react", "linux", "backend")
 * @param {number} prNumber   - Pull request number
 * @returns {Promise<NormalizedReviewResponse>}
 */
export async function reviewPullRequest(owner, repo, prNumber) {
  const url = `${getApiBaseUrl()}/review`
  const token = getStoredAuthToken()

  const headers = { 'Content-Type': 'application/json' }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const resp = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      owner: owner.trim(),
      repo: repo.trim(),
      pr_number: Number(prNumber),
      github_token: token || undefined,
    }),
  })

  if (!resp.ok) {
    let message = `Server error (${resp.status})`
    try {
      const err = await resp.json()
      message = err.detail || message
    } catch (_) {
      message = resp.statusText || message
    }
    throw new Error(message)
  }

  const rawData = await resp.json()
  return normalizeReviewResponse(rawData, owner, repo, prNumber)
}

/**
 * Returns demo review for instant presentation or offline testing.
 */
export function getDemoReview() {
  return normalizeReviewResponse(
    DEMO_REVIEW_PR3,
    DEMO_REVIEW_PR3.owner,
    DEMO_REVIEW_PR3.repo_name,
    DEMO_REVIEW_PR3.pr_number
  )
}

/**
 * Get all repositories (both defaults and custom user-added repos)
 */
export function fetchRepositories() {
  return getAllRepositories()
}

/**
 * Fetch pull requests for ANY repository
 * If mock data exists, returns it; otherwise provides a dynamic PR template
 * or queries GitHub public API if reachable.
 */
export async function fetchPullRequests(fullName) {
  if (DEFAULT_PULL_REQUESTS[fullName]) {
    return DEFAULT_PULL_REQUESTS[fullName]
  }

  // Attempt authenticated or public GitHub PR listing
  try {
    const authPulls = await fetchRepoPullRequestsWithAuth(fullName)
    if (authPulls && authPulls.length > 0) {
      return authPulls
    }
  } catch (_) {
    // Continue with public fallback
  }

  // Attempt public GitHub PR listing
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 2500)
    const resp = await fetch(`https://api.github.com/repos/${fullName}/pulls?state=all&per_page=10`, {
      signal: controller.signal,
    })
    clearTimeout(timer)
    if (resp.ok) {
      const pulls = await resp.json()
      if (Array.isArray(pulls) && pulls.length > 0) {
        return pulls.map((p) => ({
          number: p.number,
          title: p.title,
          author: p.user?.login || 'contributor',
          authorAvatar: p.user?.avatar_url || '',
          sourceBranch: p.head?.ref || 'feature',
          targetBranch: p.base?.ref || 'main',
          filesChanged: p.changed_files || 1,
          commits: p.commits || 1,
          additions: p.additions || 0,
          deletions: p.deletions || 0,
          createdAt: new Date(p.created_at).toLocaleDateString(),
          status: p.state,
          lastReviewScore: null,
          hasReview: false,
        }))
      }
    }
  } catch (_) {
    // Fallback if rate limited or offline
  }

  // Default dynamic PR placeholder for any newly added repo
  const parts = fullName.split('/')
  const owner = parts[0] || 'owner'
  return [
    {
      number: 1,
      title: `Latest pull request for ${fullName}`,
      author: owner,
      sourceBranch: 'feature/updates',
      targetBranch: 'main',
      filesChanged: 2,
      commits: 2,
      additions: 35,
      deletions: 8,
      createdAt: 'Recently',
      status: 'open',
      lastReviewScore: null,
      hasReview: false,
    },
  ]
}

/**
 * Get diff text for a given file
 */
export function getDiffForFile(filename) {
  return MOCK_DIFFS[filename] || null
}
