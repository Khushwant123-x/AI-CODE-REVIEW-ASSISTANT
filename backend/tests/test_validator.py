"""
Unit tests for Pydantic validation.
"""
import pytest
from pydantic import ValidationError
from app.models import ReviewIssue, LLMResponse
from app.services.validator import validate_issues


def _make_issue(**kwargs) -> ReviewIssue:
    defaults = dict(
        issue_type="bug",
        file="app.py",
        line=10,
        severity="Warning",
        title="Test issue",
        explanation="This is a real problem",
        suggestion="Fix it this way",
    )
    defaults.update(kwargs)
    return ReviewIssue(**defaults)


def test_valid_issue_passes():
    issue = _make_issue()
    assert issue.file == "app.py"


def test_invalid_issue_type_rejected():
    with pytest.raises(ValidationError):
        _make_issue(issue_type="unknown_type")


def test_invalid_severity_rejected():
    with pytest.raises(ValidationError):
        _make_issue(severity="low")


def test_negative_line_rejected():
    with pytest.raises(ValidationError):
        _make_issue(line=-1)


def test_zero_line_rejected():
    with pytest.raises(ValidationError):
        _make_issue(line=0)


def test_llm_response_empty_issues():
    resp = LLMResponse(issues=[])
    assert resp.issues == []


def test_validate_issues_removes_invalid():
    issues = [
        _make_issue(title="   "),    # empty title – should be dropped
        _make_issue(),               # valid
    ]
    # Force an empty title through (bypass Pydantic)
    issues[0] = issues[0].model_copy(update={"title": "   "})
    valid = validate_issues(issues)
    # Empty title is caught by validate_issues
    assert all(i.title.strip() for i in valid)


def test_validate_issues_keeps_valid():
    issues = [_make_issue() for _ in range(5)]
    valid  = validate_issues(issues)
    assert len(valid) == 5


def test_validate_issues_empty_file():
    issues = [_make_issue(file="")]
    valid  = validate_issues(issues)
    assert len(valid) == 0
