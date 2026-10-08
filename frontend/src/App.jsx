import React, { useState, useEffect } from 'react'
import Navbar from './components/Navbar.jsx'
import Sidebar from './components/Sidebar.jsx'
import GitHubAuthModal from './components/GitHubAuthModal.jsx'
import DashboardPage from './pages/DashboardPage.jsx'
import RepositoriesPage from './pages/RepositoriesPage.jsx'
import PullRequestsPage from './pages/PullRequestsPage.jsx'
import ReviewResultsPage from './pages/ReviewResultsPage.jsx'
import ReviewHistoryPage from './pages/ReviewHistoryPage.jsx'
import SettingsPage from './pages/SettingsPage.jsx'

import {
  checkHealth,
  reviewPullRequest,
  getDemoReview,
} from './services/api.js'
import {
  getStoredTheme,
  saveStoredTheme,
  getReviewHistory,
  recordReviewInHistory,
  getAllRepositories,
  addCustomRepository,
} from './services/storage.js'
import {
  getStoredAuthUser,
  logoutGitHub,
  fetchAuthenticatedUserRepos,
} from './services/githubAuth.js'

export default function App() {
  const [currentView, setCurrentView] = useState('dashboard')
  const [theme, setTheme] = useState(getStoredTheme())
  const [sidebarOpen, setSidebarOpen] = useState(false)
  
  // GitHub Authentication
  const [authUser, setAuthUser] = useState(getStoredAuthUser())
  const [authModalOpen, setAuthModalOpen] = useState(false)

  // System & backend status
  const [systemHealth, setSystemHealth] = useState({ online: false, groq_model: 'llama3-70b-8192' })

  // Active review result
  const [reviewResult, setReviewResult] = useState(null)
  const [loadingReview, setLoadingReview] = useState(false)
  const [reviewError, setReviewError] = useState(null)

  // Repositories & selected repo
  const [repositories, setRepositories] = useState(getAllRepositories())
  const [selectedRepo, setSelectedRepo] = useState(repositories[0])

  // Review history
  const [reviewHistory, setReviewHistory] = useState(getReviewHistory())

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    saveStoredTheme(theme)
  }, [theme])

  // Health check on startup & periodic poll
  useEffect(() => {
    const doHealthCheck = () => {
      checkHealth()
        .then((health) => setSystemHealth(health))
        .catch(() => setSystemHealth({ online: false }))
    }
    doHealthCheck()
    const timer = setInterval(doHealthCheck, 30000)
    return () => clearInterval(timer)
  }, [])

  // Auto-sync repos if authenticated user exists on startup
  useEffect(() => {
    if (authUser) {
      handleSyncUserRepos(false)
    }
  }, [])

  const handleToggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))
  }

  // GitHub Auth Handlers
  const handleAuthSuccess = (user) => {
    setAuthUser(user)
    handleSyncUserRepos(true)
  }

  const handleLogout = () => {
    logoutGitHub()
    setAuthUser(null)
  }

  const handleSyncUserRepos = async (shouldSelectFirst = false) => {
    try {
      const userRepos = await fetchAuthenticatedUserRepos()
      if (userRepos && userRepos.length > 0) {
        // Merge with existing
        const existingMap = new Map(getAllRepositories().map((r) => [r.fullName.toLowerCase(), r]))
        userRepos.forEach((r) => {
          existingMap.set(r.fullName.toLowerCase(), r)
        })
        const merged = Array.from(existingMap.values())
        setRepositories(merged)
        localStorage.setItem('ai_code_review_custom_repos', JSON.stringify(merged))

        if (shouldSelectFirst && userRepos[0]) {
          setSelectedRepo(userRepos[0])
        }
      }
    } catch (err) {
      console.warn('Could not sync user repos:', err)
    }
  }

  // Core review trigger: Works for ANY owner, repo, and PR number
  const handleRunReview = async (owner, repo, prNumber) => {
    setLoadingReview(true)
    setReviewError(null)
    setCurrentView('pull-requests')

    // Automatically ensure this repository is in user's saved repository list
    const { all } = addCustomRepository(owner, repo)
    setRepositories(all)

    try {
      const data = await reviewPullRequest(owner, repo, prNumber)
      setReviewResult(data)
      const updatedHistory = recordReviewInHistory(data, owner, repo, prNumber)
      setReviewHistory(updatedHistory)
      setCurrentView('reviews')
    } catch (err) {
      console.warn('Real review error:', err)
      setReviewError(
        `${err.message || 'Unable to review PR'}. Please ensure the repository is accessible and GROQ_API_KEY is configured in the backend.`
      )
    } finally {
      setLoadingReview(false)
    }
  }

  // Handle reviewing ANY PR URL directly from Navbar or quick bar
  const handleReviewAnyUrl = (url) => {
    const match = url.trim().match(/github\.com\/([^/]+)\/([^/]+)\/pull\/(\d+)/i)
    if (match) {
      const owner = match[1]
      const repo = match[2]
      const prNumber = parseInt(match[3], 10)
      handleRunReview(owner, repo, prNumber)
    } else {
      setReviewError('Invalid GitHub PR URL. Format must be: https://github.com/owner/repository/pull/number')
      setCurrentView('pull-requests')
    }
  }

  // Open existing review from History or Dashboard
  const handleOpenExistingReview = (item) => {
    if (item.resultData) {
      setReviewResult(item.resultData)
    } else {
      const demo = getDemoReview()
      setReviewResult(demo)
    }
    setCurrentView('reviews')
  }

  const handleSelectRepo = (repo) => {
    setSelectedRepo(repo)
    setCurrentView('pull-requests')
  }

  return (
    <div className="app-root">
      <Navbar
        systemHealth={systemHealth}
        currentView={currentView}
        onNavigate={setCurrentView}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        onReviewAnyUrl={handleReviewAnyUrl}
        authUser={authUser}
        onOpenAuthModal={() => setAuthModalOpen(true)}
        onLogout={handleLogout}
        onSyncRepos={handleSyncUserRepos}
      />

      <div className="app-body">
        <Sidebar
          currentView={currentView}
          onNavigate={setCurrentView}
          hasActiveReview={Boolean(reviewResult)}
          activeReviewCount={reviewResult?.issues_found || 0}
          isOpen={sidebarOpen}
          onCloseMobile={() => setSidebarOpen(false)}
          selectedRepo={selectedRepo}
        />

        <main className="app-main-content">
          {currentView === 'dashboard' && (
            <DashboardPage
              reviewHistory={reviewHistory}
              onOpenReview={handleOpenExistingReview}
              onNavigate={setCurrentView}
              authUser={authUser}
              onOpenAuthModal={() => setAuthModalOpen(true)}
            />
          )}

          {currentView === 'repositories' && (
            <RepositoriesPage
              onSelectRepo={handleSelectRepo}
              onNavigate={setCurrentView}
              authUser={authUser}
              onOpenAuthModal={() => setAuthModalOpen(true)}
              onSyncRepos={handleSyncUserRepos}
            />
          )}

          {currentView === 'pull-requests' && (
            <PullRequestsPage
              selectedRepo={selectedRepo}
              onRunReview={handleRunReview}
              loading={loadingReview}
              error={reviewError}
              onClearError={() => setReviewError(null)}
              onOpenExistingReview={() => setCurrentView('reviews')}
              onSwitchRepo={handleSelectRepo}
              authUser={authUser}
              onOpenAuthModal={() => setAuthModalOpen(true)}
            />
          )}

          {currentView === 'reviews' && (
            <ReviewResultsPage
              reviewResult={reviewResult}
              onRerunReview={handleRunReview}
              onNavigate={setCurrentView}
            />
          )}

          {currentView === 'history' && (
            <ReviewHistoryPage
              reviewHistory={reviewHistory}
              onOpenReview={handleOpenExistingReview}
              onHistoryUpdated={setReviewHistory}
              onNavigate={setCurrentView}
            />
          )}

          {currentView === 'settings' && (
            <SettingsPage
              systemHealth={systemHealth}
              onHealthUpdated={setSystemHealth}
              authUser={authUser}
              onOpenAuthModal={() => setAuthModalOpen(true)}
              onLogout={handleLogout}
            />
          )}
        </main>
      </div>

      {/* GitHub Authentication Dialog */}
      <GitHubAuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        authUser={authUser}
        onAuthSuccess={handleAuthSuccess}
        onLogout={handleLogout}
        onSyncRepos={handleSyncUserRepos}
      />
    </div>
  )
}
