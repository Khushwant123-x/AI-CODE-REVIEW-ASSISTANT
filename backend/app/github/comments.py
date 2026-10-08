"""
Post review findings as GitHub PR comments.

Tries line-level review comments first; falls back to a general PR comment
if the line is not part of the diff position map.
"""
from __future__ import annotations

import httpx
import logging

from app.config import get_settings
from app.models import ReviewIssue

logger = logging.getLogger(__name__)

_BASE = "https://api.github.com"

_SEVERITY_EMOJI = {
    "Critical": "🔴",
    "Warning":  "🟡",
    "Info":     "🔵",
}

_TYPE_LABEL = {
    "bug":             "🐛 Bug",
    "security":        "🔒 Security",
    "performance":     "⚡ Performance",
    "style":           "🎨 Style",
    "maintainability": "🔧 Maintainability",
}


def _headers(token: str | None = None) -> dict[str, str]:
    tok = token or get_settings().github_token
    h = {
        "Accept": "application/vnd.github.v3+json",
        "X-GitHub-Api-Version": "2022-11-28",
    }
    if tok:
        h["Authorization"] = f"Bearer {tok}"
    return h


def _format_body(issue: ReviewIssue) -> str:
    emoji   = _SEVERITY_EMOJI.get(issue.severity, "⚪")
    type_lb = _TYPE_LABEL.get(issue.issue_type, issue.issue_type)
    return (
        f"## {emoji} [{issue.severity}] {issue.title}\n\n"
        f"**Type:** {type_lb}\n\n"
        f"**Explanation:**\n{issue.explanation}\n\n"
        f"**Suggestion:**\n{issue.suggestion}\n\n"
        f"---\n*AI Code Review – powered by Groq*"
    )


async def post_review_comments(
    owner: str,
    repo: str,
    pr_number: int,
    commit_sha: str,
    issues: list[ReviewIssue],
    diff_position_map: dict[tuple[str, int], int],
    token: str | None = None,
) -> int:
    """
    Post review comments for each issue.

    diff_position_map maps (file, line) → diff position integer required by
    GitHub's pull-request review-comment API.

    Returns the number of comments successfully posted.
    """
    active_token = token or get_settings().github_token
    if not active_token:
        logger.info("No GitHub token provided; skipping posting review comments to GitHub.")
        return 0

    posted = 0

    async with httpx.AsyncClient(timeout=30) as client:
        for issue in issues:
            body = _format_body(issue)
            key  = (issue.file, issue.line)
            position = diff_position_map.get(key)

            if position is not None:
                # Attempt line-level comment
                url     = f"{_BASE}/repos/{owner}/{repo}/pulls/{pr_number}/comments"
                payload = {
                    "body":      body,
                    "commit_id": commit_sha,
                    "path":      issue.file,
                    "position":  position,
                }
                resp = await client.post(url, json=payload, headers=_headers(active_token))
                if resp.status_code in (200, 201):
                    posted += 1
                    logger.info("Line-level comment posted for %s:%s", issue.file, issue.line)
                    continue
                else:
                    logger.warning(
                        "Line-level comment failed (%s) – falling back to PR comment",
                        resp.status_code,
                    )

            # Fallback: general issue comment
            fallback_body = (
                f"**File:** `{issue.file}` · **Line:** {issue.line}\n\n{body}"
            )
            url  = f"{_BASE}/repos/{owner}/{repo}/issues/{pr_number}/comments"
            resp = await client.post(
                url, json={"body": fallback_body}, headers=_headers(active_token)
            )
            if resp.status_code in (200, 201):
                posted += 1
                logger.info("Fallback comment posted for %s:%s", issue.file, issue.line)
            else:
                logger.error(
                    "Failed to post any comment for %s:%s – status %s",
                    issue.file, issue.line, resp.status_code,
                )

    return posted


def build_diff_position_map(raw_diff: str) -> dict[tuple[str, int], int]:
    """
    Build a mapping from (file, new_line_no) → diff position.

    The diff position is the 1-based count of lines in the diff hunk
    (including hunk headers), which is what GitHub's review-comment API
    requires for the `position` field.
    """
    import re

    FILE_RE = re.compile(r"^\+\+\+ b/(.+)$")
    HUNK_RE = re.compile(r"^@@ -\d+(?:,\d+)? \+(\d+)(?:,\d+)? @@")

    result: dict[tuple[str, int], int] = {}
    current_file: str | None = None
    new_line_no  = 0
    diff_pos     = 0          # 1-based position within the diff

    for line in raw_diff.splitlines():
        m = FILE_RE.match(line)
        if m:
            current_file = m.group(1)
            diff_pos     = 0
            continue

        if line.startswith("--- "):
            continue

        m = HUNK_RE.match(line)
        if m:
            diff_pos    += 1
            new_line_no  = int(m.group(1))
            continue

        if current_file is None:
            continue

        diff_pos += 1

        if line.startswith("+"):
            result[(current_file, new_line_no)] = diff_pos
            new_line_no += 1
        elif line.startswith("-"):
            pass   # does not advance new file line counter
        else:
            # context line
            new_line_no += 1

    return result
