"""
Core orchestration service.

Coordinates: GitHub → diff parsing → chunking → Groq → validation
             → filtering → GitHub comments → response.
"""
from __future__ import annotations

import logging

from app.github.client      import fetch_pr_diff, fetch_pr_metadata
from app.github.comments    import build_diff_position_map, post_review_comments
from app.github.diff_parser import build_line_set, parse_diff
from app.llm.groq_client    import review_chunk
from app.models             import ReviewIssue, ReviewResponse
from app.services.chunker   import chunk_diff
from app.services.filters   import deduplicate, filter_false_positives, limit_per_severity
from app.services.validator import validate_issues

logger = logging.getLogger(__name__)


async def run_review(owner: str, repo: str, pr_number: int) -> ReviewResponse:
    """End-to-end PR review orchestration."""

    # ── 1. Fetch PR metadata ──────────────────────────────────────────────
    logger.info("Fetching PR metadata: %s/%s#%s", owner, repo, pr_number)
    metadata   = await fetch_pr_metadata(owner, repo, pr_number)
    commit_sha = metadata.get("head", {}).get("sha", "")

    # ── 2. Fetch diff ─────────────────────────────────────────────────────
    logger.info("Fetching PR diff")
    raw_diff = await fetch_pr_diff(owner, repo, pr_number)

    if not raw_diff.strip():
        logger.warning("Empty diff received – nothing to review")
        return ReviewResponse(
            status="success",
            pr_number=pr_number,
            files_reviewed=0,
            issues_found=0,
            comments_posted=0,
            issues=[],
        )

    # ── 3. Parse diff ─────────────────────────────────────────────────────
    parsed          = parse_diff(raw_diff)
    valid_line_set  = build_line_set(parsed)
    diff_pos_map    = build_diff_position_map(raw_diff)

    logger.info(
        "Parsed diff: %d files, %d changed lines",
        len(parsed.files), len(parsed.changed_lines),
    )

    # ── 4. Chunk + send to Groq ───────────────────────────────────────────
    chunks    = chunk_diff(parsed)
    all_raw:  list[ReviewIssue] = []

    for i, chunk in enumerate(chunks, start=1):
        logger.info("Sending chunk %d/%d to Groq", i, len(chunks))
        response = await review_chunk(chunk)
        all_raw.extend(response.issues)

    logger.info("Raw issues from Groq: %d", len(all_raw))

    # ── 5. Validate ───────────────────────────────────────────────────────
    validated = validate_issues(all_raw)

    # ── 6. Filter + deduplicate ───────────────────────────────────────────
    deduped   = deduplicate(validated)
    filtered  = filter_false_positives(deduped)
    final     = limit_per_severity(filtered)

    logger.info("Final issues after filtering: %d", len(final))

    # ── 7. Post GitHub comments ───────────────────────────────────────────
    comments_posted = 0
    if commit_sha and final:
        comments_posted = await post_review_comments(
            owner, repo, pr_number, commit_sha, final, diff_pos_map
        )

    return ReviewResponse(
        status="success",
        pr_number=pr_number,
        files_reviewed=len(parsed.files),
        issues_found=len(final),
        comments_posted=comments_posted,
        issues=final,
    )
