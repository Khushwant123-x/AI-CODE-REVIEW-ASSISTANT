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
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Health check ──────────────────────────────────────────────────────────────
@app.api_route("/health", methods=["GET", "HEAD"], tags=["meta"])
async def health():
    return {"status": "ok", "groq_model": settings.groq_model}


# ── Review endpoint ───────────────────────────────────────────────────────────
@app.post("/review", response_model=ReviewResponse, tags=["review"])
async def review(request: ReviewRequest) -> ReviewResponse:
    """
    Trigger an AI code review for a GitHub Pull Request.

    - Fetches the PR diff from GitHub
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
    try:
        result = await run_review(request.owner, request.repo, request.pr_number)
        return result
    except Exception as exc:
        logger.exception("Review failed: %s", exc)
        raise HTTPException(status_code=500, detail=str(exc)) from exc
