"""
Pydantic models for request/response and internal data structures.
"""
from __future__ import annotations
from typing import Literal, Optional
from pydantic import BaseModel, Field, field_validator


# ── Request ──────────────────────────────────────────────────────────────────

class ReviewRequest(BaseModel):
    owner: str = Field(..., description="GitHub repository owner / org")
    repo: str = Field(..., description="GitHub repository name")
    pr_number: int = Field(..., gt=0, description="Pull-request number")


# ── Diff / parsing ────────────────────────────────────────────────────────────

class ChangedLine(BaseModel):
    file: str
    line: int                                      # line number in the new file
    content: str
    change_type: Literal["added", "removed", "context"]


class ParsedDiff(BaseModel):
    files: list[str]
    changed_lines: list[ChangedLine]


# ── LLM / review ─────────────────────────────────────────────────────────────

IssueType = Literal["bug", "security", "performance", "style", "maintainability"]
Severity   = Literal["Critical", "Warning", "Info"]


class ReviewIssue(BaseModel):
    issue_type:  IssueType
    file:        str
    line:        int
    severity:    Severity
    title:       str
    explanation: str
    suggestion:  str

    @field_validator("line")
    @classmethod
    def line_must_be_positive(cls, v: int) -> int:
        if v <= 0:
            raise ValueError("line must be a positive integer")
        return v


class LLMResponse(BaseModel):
    issues: list[ReviewIssue]


# ── Response ──────────────────────────────────────────────────────────────────

class ReviewResponse(BaseModel):
    status:           str
    pr_number:        int
    files_reviewed:   int
    issues_found:     int
    comments_posted:  int
    issues:           list[ReviewIssue]
