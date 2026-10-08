"""
FastAPI application entry point.
"""
from __future__ import annotations

import logging

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app.config  import get_settings
from app.models  import ReviewRequest, ReviewResponse
from app.services.review_service import run_review

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(name)s  %(message)s",
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="AI Code Review Assistant",
    description="LLM-powered GitHub Pull Request review using Groq",
    version="1.0.0",
)

# ── CORS ──────────────────────────────────────────────────────────────────────
settings = get_settings()
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"https?://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Root & Health check ───────────────────────────────────────────────────────
@app.get("/", tags=["meta"])
async def root():
    return {
        "service": "AI Code Review Assistant API",
        "status": "online",
        "docs": "/docs",
        "groq_model": settings.groq_model,
        "version": "1.0.0",
    }


@app.api_route("/health", methods=["GET", "HEAD"], tags=["meta"])
async def health():
    return {
        "status": "ok",
        "online": True,
        "groq_model": settings.groq_model,
        "has_github_token": bool(settings.github_token),
    }


# ── GitHub Auth Verification ──────────────────────────────────────────────────
from app.github.client import verify_github_token
from app.models import GitHubVerifyRequest


@app.post("/auth/github/verify", tags=["auth"])
async def verify_github_account(body: GitHubVerifyRequest):
    """
    Verify a GitHub Personal Access Token and return user profile details.
    """
    try:
        user_info = await verify_github_token(body.token)
        return {
            "status": "authenticated",
            "user": {
                "login": user_info.get("login"),
                "name": user_info.get("name") or user_info.get("login"),
                "avatar_url": user_info.get("avatar_url"),
                "bio": user_info.get("bio"),
                "public_repos": user_info.get("public_repos", 0),
                "followers": user_info.get("followers", 0),
                "html_url": user_info.get("html_url"),
            },
        }
    except Exception as exc:
        raise HTTPException(status_code=401, detail=f"GitHub authentication failed: {str(exc)}") from exc


# ── Review endpoint ───────────────────────────────────────────────────────────
from fastapi import Header


@app.post("/review", response_model=ReviewResponse, tags=["review"])
async def review(
    request: ReviewRequest,
    authorization: str | None = Header(None),
) -> ReviewResponse:
    """
    Trigger an AI code review for a GitHub Pull Request.

    - Fetches the PR diff from GitHub (using user token or server token)
    - Parses and chunks the diff
    - Sends chunks to Groq for analysis
    - Validates and deduplicates findings
    - Posts review comments to GitHub
    - Returns structured results
    """
    logger.info(
        "Review request: %s/%s PR#%s",
        request.owner, request.repo, request.pr_number,
    )
    # Prefer token in body, then Bearer header
    active_token = request.github_token
    if not active_token and authorization and authorization.startswith("Bearer "):
        active_token = authorization.replace("Bearer ", "").strip()

    try:
        result = await run_review(
            request.owner,
            request.repo,
            request.pr_number,
            token=active_token,
        )
        return result
    except Exception as exc:
        logger.exception("Review failed: %s", exc)
        raise HTTPException(status_code=500, detail=str(exc)) from exc
