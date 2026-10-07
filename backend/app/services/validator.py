"""
Pydantic-level validation of LLM findings.

After the Groq response is parsed into ReviewIssue objects, this module
runs additional sanity checks that cannot be expressed as pure Pydantic
field validators.
"""
from __future__ import annotations

import logging

from app.models import ReviewIssue

logger = logging.getLogger(__name__)

_VALID_ISSUE_TYPES = {"bug", "security", "performance", "style", "maintainability"}
_VALID_SEVERITIES  = {"Critical", "Warning", "Info"}


def validate_issues(issues: list[ReviewIssue]) -> list[ReviewIssue]:
    """
    Return only issues that pass all validation rules.
    Invalid issues are logged and discarded.
    """
    valid: list[ReviewIssue] = []

    for issue in issues:
        if issue.issue_type not in _VALID_ISSUE_TYPES:
            logger.warning("Dropping issue with unknown type: %s", issue.issue_type)
            continue

        if issue.severity not in _VALID_SEVERITIES:
            logger.warning("Dropping issue with unknown severity: %s", issue.severity)
            continue

        if not issue.file or not issue.file.strip():
            logger.warning("Dropping issue with empty file name")
            continue

        if issue.line <= 0:
            logger.warning("Dropping issue with invalid line number: %s", issue.line)
            continue

        if not issue.title or not issue.title.strip():
            logger.warning("Dropping issue with empty title")
            continue

        if not issue.explanation or not issue.explanation.strip():
            logger.warning("Dropping issue with empty explanation")
            continue

        valid.append(issue)

    return valid


def validate_against_diff(
    issues: list[ReviewIssue],
    valid_lines: set[tuple[str, int]],
) -> list[ReviewIssue]:
    """
    Keep only issues whose (file, line) exists in the set of actual changed
    lines from the diff.  This prevents phantom issues on lines the model
    hallucinated.
    """
    kept: list[ReviewIssue] = []
    for issue in issues:
        if (issue.file, issue.line) in valid_lines:
            kept.append(issue)
        else:
            # Line not in diff → still keep it but log a warning.
            # The comment poster will use the fallback path (general comment).
            logger.info(
                "Issue references line not in diff: %s:%s – keeping with fallback comment",
                issue.file, issue.line,
            )
            kept.append(issue)
    return kept
