"""
GitHub REST API client.
Wraps httpx calls for fetching PR metadata and diffs.
"""
from __future__ import annotations

import httpx
from app.config import get_settings

_BASE = "https://api.github.com"


def _headers(token: str | None = None) -> dict[str, str]:
    tok = token or get_settings().github_token
    headers = {
        "Accept": "application/vnd.github.v3+json",
        "X-GitHub-Api-Version": "2022-11-28",
    }
    if tok:
        headers["Authorization"] = f"Bearer {tok}"
    return headers


async def verify_github_token(token: str) -> dict:
    """Verify a GitHub Personal Access Token and return user profile."""
    url = f"{_BASE}/user"
    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.get(url, headers=_headers(token))
    if resp.status_code == 401:
        raise ValueError("Invalid GitHub token. Please verify your token permissions.")
    resp.raise_for_status()
    return resp.json()


async def fetch_pr_metadata(owner: str, repo: str, pr_number: int, token: str | None = None) -> dict:
    url = f"{_BASE}/repos/{owner}/{repo}/pulls/{pr_number}"
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.get(url, headers=_headers(token))
    if resp.status_code == 404:
        raise ValueError(f"GitHub Pull Request not found: {owner}/{repo}#{pr_number}. Please verify the repository name and PR number.")
    elif resp.status_code == 403:
        raise ValueError("GitHub API rate limit exceeded or access forbidden. Please set GITHUB_TOKEN or authenticate with GitHub.")
    elif resp.status_code == 401:
        raise ValueError("GitHub authentication failed. Please check your GITHUB_TOKEN.")
    resp.raise_for_status()
    return resp.json()


async def fetch_pr_diff(owner: str, repo: str, pr_number: int, token: str | None = None) -> str:
    """Return the unified diff text for a pull request."""
    url = f"{_BASE}/repos/{owner}/{repo}/pulls/{pr_number}"
    async with httpx.AsyncClient(timeout=60) as client:
        resp = await client.get(
            url,
            headers={**_headers(token), "Accept": "application/vnd.github.v3.diff"},
        )
    if resp.status_code == 404:
        raise ValueError(f"GitHub PR diff not found for {owner}/{repo}#{pr_number}.")
    elif resp.status_code == 403:
        raise ValueError("GitHub API rate limit reached or access forbidden while fetching diff.")
    resp.raise_for_status()
    return resp.text


async def get_pr_files(owner: str, repo: str, pr_number: int, token: str | None = None) -> list[dict]:
    """Return list of files changed in the PR (GitHub files endpoint)."""
    url = f"{_BASE}/repos/{owner}/{repo}/pulls/{pr_number}/files"
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.get(url, headers=_headers(token))
    resp.raise_for_status()
    return resp.json()
