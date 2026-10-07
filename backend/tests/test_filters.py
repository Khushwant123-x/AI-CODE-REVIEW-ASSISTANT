"""
Unit tests for filter and deduplication logic.
"""
import pytest
from app.models import ReviewIssue
from app.services.filters import deduplicate, filter_false_positives, limit_per_severity


def _issue(file="app.py", line=10, itype="bug", severity="Warning", title="T", explanation="E"*30):
    return ReviewIssue(
        issue_type=itype,
        file=file,
        line=line,
        severity=severity,
        title=title,
        explanation=explanation,
        suggestion="Fix it",
    )


# ── deduplicate ───────────────────────────────────────────────────────────────

def test_deduplicate_removes_exact_duplicates():
    issues = [_issue(), _issue()]
    result = deduplicate(issues)
    assert len(result) == 1


def test_deduplicate_keeps_different_types():
    # Different issue types AND different titles → both should survive
    issues = [
        _issue(itype="bug",      title="Null pointer"),
        _issue(itype="security", title="SQL Injection"),
    ]
    result = deduplicate(issues)
    assert len(result) == 2


def test_deduplicate_removes_same_title_same_line():
    issues = [
        _issue(itype="bug",      title="SQL Injection"),
        _issue(itype="security", title="SQL Injection"),  # same title, same line
    ]
    result = deduplicate(issues)
    assert len(result) == 1


def test_deduplicate_keeps_different_lines():
    issues = [_issue(line=10), _issue(line=20)]
    result = deduplicate(issues)
    assert len(result) == 2


def test_deduplicate_empty_list():
    assert deduplicate([]) == []


# ── filter_false_positives ────────────────────────────────────────────────────

def test_filter_removes_short_info_style():
    short_issue = _issue(severity="Info", itype="style", explanation="x" * 5)
    issues  = [short_issue]
    result  = filter_false_positives(issues)
    assert len(result) == 0


def test_filter_keeps_long_info_style():
    good = _issue(severity="Info", itype="style", explanation="x" * 30)
    result = filter_false_positives([good])
    assert len(result) == 1


def test_filter_keeps_critical_always():
    crit = _issue(severity="Critical", itype="security", explanation="short")
    result = filter_false_positives([crit])
    assert len(result) == 1


# ── limit_per_severity ────────────────────────────────────────────────────────

def test_limit_caps_critical():
    issues = [_issue(severity="Critical", line=i) for i in range(1, 21)]
    result = limit_per_severity(issues, max_critical=5)
    critical = [i for i in result if i.severity == "Critical"]
    assert len(critical) == 5


def test_limit_does_not_drop_below_cap():
    issues = [_issue(severity="Warning", line=i) for i in range(1, 4)]
    result = limit_per_severity(issues, max_warning=10)
    assert len(result) == 3
