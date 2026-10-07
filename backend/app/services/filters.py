"""
Filter and de-duplicate review findings.

Rules applied (in order):
1. Remove exact duplicates (same file + line + issue_type).
2. Remove near-duplicates (same file + line, different issue_type but same title).
3. Keep at most one Critical, one Warning, and one Info issue per line.
"""
from __future__ import annotations

from app.models import ReviewIssue


def deduplicate(issues: list[ReviewIssue]) -> list[ReviewIssue]:
    """Remove exact and near-duplicate findings."""
    seen_exact:   set[tuple[str, int, str]] = set()
    seen_line:    dict[tuple[str, int], set[str]] = {}
    result: list[ReviewIssue] = []

    for issue in issues:
        exact_key = (issue.file, issue.line, issue.issue_type)
        if exact_key in seen_exact:
            continue
        seen_exact.add(exact_key)

        # Near-duplicate check: same file+line, same title (case-insensitive)
        line_key = (issue.file, issue.line)
        titles   = seen_line.setdefault(line_key, set())
        norm_title = issue.title.strip().lower()
        if norm_title in titles:
            continue
        titles.add(norm_title)

        result.append(issue)

    return result


def filter_false_positives(issues: list[ReviewIssue]) -> list[ReviewIssue]:
    """
    Heuristic filter to drop low-confidence findings.

    Currently removes 'Info' severity style issues that have very short
    explanations (< 20 chars) which are often generic LLM noise.
    """
    filtered: list[ReviewIssue] = []
    for issue in issues:
        if issue.severity == "Info" and issue.issue_type == "style":
            if len(issue.explanation.strip()) < 20:
                continue
        filtered.append(issue)
    return filtered


def limit_per_severity(
    issues: list[ReviewIssue],
    max_critical: int = 10,
    max_warning:  int = 20,
    max_info:     int = 20,
) -> list[ReviewIssue]:
    """Cap the number of issues per severity to avoid comment spam."""
    counts: dict[str, int] = {"Critical": 0, "Warning": 0, "Info": 0}
    result: list[ReviewIssue] = []
    limits = {"Critical": max_critical, "Warning": max_warning, "Info": max_info}

    for issue in issues:
        cap = limits.get(issue.severity, 999)
        if counts.get(issue.severity, 0) < cap:
            result.append(issue)
            counts[issue.severity] = counts.get(issue.severity, 0) + 1

    return result
