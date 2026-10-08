/**
 * GitHub Authentication & User Service
 * Manages GitHub account connection, Personal Access Token validation,
 * user profile persistence, and fetching authenticated user repositories.
 */

const TOKEN_KEY = 'ai_code_review_gh_token'
const USER_KEY = 'ai_code_review_gh_user'

/**
 * Get current GitHub auth token from storage
 */
export function getStoredAuthToken() {
  return localStorage.getItem(TOKEN_KEY) || ''
}

/**
 * Get currently authenticated GitHub user profile
 */
export function getStoredAuthUser() {
  try {
    const raw = localStorage.getItem(USER_KEY)
    return raw ? JSON.parse(raw) : null
  } catch (_) {
    return null
  }
}

/**
 * Verify GitHub Personal Access Token against GitHub API and save profile
 * @param {string} rawToken
 * @returns {Promise<{ success: boolean, user?: object, error?: string }>}
 */
export async function verifyAndLoginToken(rawToken) {
  const token = rawToken.trim()
  if (!token) {
    return { success: false, error: 'Please enter a GitHub Personal Access Token' }
  }

  try {
    const resp = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3+json',
      },
    })

    if (!resp.ok) {
      if (resp.status === 401) {
        return { success: false, error: 'Invalid or expired GitHub token. Check permissions and try again.' }
      }
      if (resp.status === 403) {
        return { success: false, error: 'Rate limit exceeded or token forbidden.' }
      }
      return { success: false, error: `GitHub API error (HTTP ${resp.status})` }
    }

    const data = await resp.json()
    const userProfile = {
      login: data.login,
      id: data.id,
      name: data.name || data.login,
      avatarUrl: data.avatar_url,
      bio: data.bio || '',
      htmlUrl: data.html_url,
      publicRepos: data.public_repos || 0,
      totalPrivateRepos: data.total_private_repos || 0,
      followers: data.followers || 0,
      connectedAt: new Date().toISOString(),
    }

    localStorage.setItem(TOKEN_KEY, token)
    localStorage.setItem(USER_KEY, JSON.stringify(userProfile))

    return { success: true, user: userProfile }
  } catch (err) {
    return { success: false, error: err.message || 'Network error verifying GitHub token' }
  }
}

/**
 * Disconnect GitHub account and clear session
 */
export function logoutGitHub() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

/**
 * Fetch all repositories belonging to or collaborated by the authenticated user
 * @returns {Promise<Array>}
 */
export async function fetchAuthenticatedUserRepos() {
  const token = getStoredAuthToken()
  if (!token) return []

  try {
    const resp = await fetch(
      'https://api.github.com/user/repos?sort=updated&per_page=50&affiliation=owner,collaborator',
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github.v3+json',
        },
      }
    )

    if (!resp.ok) return []

    const repos = await resp.json()
    return repos.map((r) => ({
      id: r.full_name.toLowerCase().replace(/[^a-z0-9_-]/g, '-'),
      name: r.name,
      owner: r.owner?.login || '',
      fullName: r.full_name,
      description: r.description || `Repository ${r.full_name}`,
      defaultBranch: r.default_branch || 'main',
      stars: r.stargazers_count || 0,
      forks: r.forks_count || 0,
      openPrsCount: r.open_issues_count || 0,
      isPrivate: Boolean(r.private),
      htmlUrl: r.html_url,
      lastReviewed: 'Not reviewed yet',
      lastReviewScore: null,
      status: 'pending',
      isPrimary: false,
      isCustom: true,
      isUserOwned: true,
    }))
  } catch (err) {
    console.error('Failed to fetch authenticated user repos:', err)
    return []
  }
}

/**
 * Fetch pull requests for a repository using the authenticated user's token (higher rate limit)
 */
export async function fetchRepoPullRequestsWithAuth(fullName) {
  const token = getStoredAuthToken()
  const headers = {
    Accept: 'application/vnd.github.v3+json',
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  try {
    const resp = await fetch(`https://api.github.com/repos/${fullName}/pulls?state=all&per_page=15`, {
      headers,
    })

    if (!resp.ok) return null

    const pulls = await resp.json()
    if (!Array.isArray(pulls)) return null

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
  } catch (err) {
    console.warn('Authenticated PR fetch failed:', err)
    return null
  }
}
