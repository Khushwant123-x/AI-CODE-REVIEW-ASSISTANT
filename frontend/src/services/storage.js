/**
 * Local storage manager for persisting review history,
 * custom user-added repositories, and application preferences.
 */

import { DEFAULT_REPOSITORIES, DEMO_REVIEW_PR3 } from './mockData.js'

const HISTORY_KEY = 'ai_code_review_history'
const REPOS_KEY = 'ai_code_review_custom_repos'
const THEME_KEY = 'ai_code_review_theme'
const USER_KEY = 'ai_code_review_github_user'

export function getStoredTheme() {
  return localStorage.getItem(THEME_KEY) || 'dark'
}

export function saveStoredTheme(theme) {
  localStorage.setItem(THEME_KEY, theme)
}

export function getStoredGitHubUser() {
  return localStorage.getItem(USER_KEY) || 'Khushwant123-x'
}

export function saveStoredGitHubUser(user) {
  localStorage.setItem(USER_KEY, user)
}

/**
 * Get all repositories (defaults + any repositories added by any user)
 */
export function getAllRepositories() {
  try {
    const raw = localStorage.getItem(REPOS_KEY)
    if (raw) {
      const customRepos = JSON.parse(raw)
      // Merge custom repos on top of defaults
      const existingIds = new Set(customRepos.map((r) => r.id))
      const combined = [
        ...customRepos,
        ...DEFAULT_REPOSITORIES.filter((r) => !existingIds.has(r.id)),
      ]
      return combined
    }
  } catch (err) {
    console.error('Failed to read repositories from localStorage:', err)
  }
  return DEFAULT_REPOSITORIES
}

/**
 * Add a new repository to the user's list
 */
export function addCustomRepository(owner, repoName, description = '') {
  const current = getAllRepositories()
  const fullName = `${owner.trim()}/${repoName.trim()}`
  const id = fullName.toLowerCase().replace(/[^a-z0-9_-]/g, '-')

  // Check if exists
  const exists = current.find((r) => r.id === id || r.fullName.toLowerCase() === fullName.toLowerCase())
  if (exists) {
    return { repository: exists, all: current }
  }

  const newRepo = {
    id,
    name: repoName.trim(),
    owner: owner.trim(),
    fullName,
    description: description || `GitHub repository ${fullName}`,
    defaultBranch: 'main',
    stars: 0,
    forks: 0,
    openPrsCount: 1,
    lastReviewed: 'Not reviewed yet',
    lastReviewScore: null,
    status: 'pending',
    isPrimary: false,
    isCustom: true,
  }

  const updated = [newRepo, ...current]
  try {
    localStorage.setItem(REPOS_KEY, JSON.stringify(updated))
  } catch (err) {
    console.error('Failed to save custom repo:', err)
  }
  return { repository: newRepo, all: updated }
}

/**
 * Remove a repository from the list
 */
export function removeCustomRepository(repoId) {
  const current = getAllRepositories()
  const updated = current.filter((r) => r.id !== repoId)
  try {
    localStorage.setItem(REPOS_KEY, JSON.stringify(updated))
  } catch (err) {
    console.error('Failed to update repositories:', err)
  }
  return updated
}

/**
 * Returns review history list from localStorage.
 */
export function getReviewHistory() {
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    if (raw) {
      return JSON.parse(raw)
    }
  } catch (err) {
    console.error('Failed to read review history from localStorage:', err)
  }

  const initialHistory = [
    {
      id: 'rev-3',
      repoName: 'AI-CODE-REVIEW-ASSISTANT',
      owner: 'Khushwant123-x',
      prNumber: 3,
      prTitle: 'Fix math operators and add division error handling in calculator',
      score: 82,
      issuesFound: 5,
      criticalCount: 2,
      warningCount: 2,
      infoCount: 1,
      recommendation: 'Changes Requested',
      reviewedAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
      resultData: DEMO_REVIEW_PR3,
    },
    {
      id: 'rev-2',
      repoName: 'backend-api',
      owner: 'Khushwant123-x',
      prNumber: 12,
      prTitle: 'feat: Implement JWT refresh token rotation with Redis store',
      score: 94,
      issuesFound: 2,
      criticalCount: 0,
      warningCount: 1,
      infoCount: 1,
      recommendation: 'Approved',
      reviewedAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
      resultData: {
        status: 'success',
        pr_number: 12,
        repo_name: 'backend-api',
        owner: 'Khushwant123-x',
        score: 94,
        recommendation: 'Approved',
        summary: 'Solid implementation of token rotation with Redis TTL enforcement.',
        files_reviewed: 4,
        issues_found: 2,
        comments_posted: 0,
        severity_breakdown: { critical: 0, high: 1, medium: 0, low: 1, passed: 18 },
        issues: []
      }
    }
  ]

  saveReviewHistory(initialHistory)
  return initialHistory
}

export function saveReviewHistory(historyList) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(historyList))
  } catch (err) {
    console.error('Failed to save review history:', err)
  }
}

/**
 * Record a newly completed review to history
 */
export function recordReviewInHistory(reviewResult, owner, repo, prNumber) {
  const history = getReviewHistory()
  const critical = reviewResult.issues?.filter(i => i.severity === 'Critical').length || 0
  const warning = reviewResult.issues?.filter(i => i.severity === 'Warning' || i.severity === 'High').length || 0
  const info = reviewResult.issues?.filter(i => i.severity === 'Info' || i.severity === 'Low').length || 0

  const newEntry = {
    id: `rev-${Date.now()}`,
    repoName: repo,
    owner: owner,
    prNumber: Number(prNumber),
    prTitle: reviewResult.pr_title || `PR #${prNumber} in ${owner}/${repo}`,
    score: reviewResult.score || (100 - (critical * 12 + warning * 5 + info * 2)),
    issuesFound: reviewResult.issues_found ?? (reviewResult.issues?.length || 0),
    criticalCount: critical,
    warningCount: warning,
    infoCount: info,
    recommendation: reviewResult.recommendation || (critical > 0 ? 'Changes Requested' : warning > 2 ? 'Needs Review' : 'Approved'),
    reviewedAt: new Date().toISOString(),
    resultData: reviewResult,
  }

  const updated = [newEntry, ...history.filter(h => !(h.repoName === repo && h.owner === owner && h.prNumber === Number(prNumber)))].slice(0, 50)
  saveReviewHistory(updated)
  return updated
}

export function clearReviewHistory() {
  localStorage.removeItem(HISTORY_KEY)
  return []
}
