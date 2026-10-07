"""
Unified-diff parser.

Parses a GitHub PR unified diff into a list of ChangedLine objects that carry
accurate new-file line numbers so they can be used for GitHub review comments.
"""
from __future__ import annotations

import re
from typing import Generator

from app.models import ChangedLine, ParsedDiff

# Matches:  @@ -a,b +c,d @@  (the +c part gives us the new-file start line)
_HUNK_RE = re.compile(r"^@@ -\d+(?:,\d+)? \+(\d+)(?:,\d+)? @@")
_FILE_RE = re.compile(r"^\+\+\+ b/(.+)$")


def parse_diff(raw_diff: str) -> ParsedDiff:
    """Parse a unified diff string and return a ParsedDiff."""
    changed_lines: list[ChangedLine] = []
    files_seen: list[str] = []

    current_file: str | None = None
    new_line_no: int = 0

    for line in raw_diff.splitlines():
        # ── new file header ───────────────────────────────────────────────
        m = _FILE_RE.match(line)
        if m:
            current_file = m.group(1)
            if current_file not in files_seen:
                files_seen.append(current_file)
            continue

        # skip --- header lines
        if line.startswith("--- "):
            continue

        # ── hunk header ───────────────────────────────────────────────────
        m = _HUNK_RE.match(line)
        if m:
            new_line_no = int(m.group(1))
            continue

        # ── content lines ─────────────────────────────────────────────────
        if current_file is None:
            continue

        if line.startswith("+"):
            changed_lines.append(
                ChangedLine(
                    file=current_file,
                    line=new_line_no,
                    content=line[1:],
                    change_type="added",
                )
            )
            new_line_no += 1

        elif line.startswith("-"):
            # removed lines do NOT advance the new-file line counter
            changed_lines.append(
                ChangedLine(
                    file=current_file,
                    line=new_line_no,   # use current position as reference
                    content=line[1:],
                    change_type="removed",
                )
            )

        else:
            # context line – advances new-file line counter
            changed_lines.append(
                ChangedLine(
                    file=current_file,
                    line=new_line_no,
                    content=line[1:] if line.startswith(" ") else line,
                    change_type="context",
                )
            )
            new_line_no += 1

    return ParsedDiff(files=files_seen, changed_lines=changed_lines)


def changed_lines_only(parsed: ParsedDiff) -> list[ChangedLine]:
    """Return only added/removed lines (context excluded)."""
    return [cl for cl in parsed.changed_lines if cl.change_type != "context"]


def build_line_set(parsed: ParsedDiff) -> set[tuple[str, int]]:
    """
    Return a set of (file, line) tuples that represent valid changed lines.
    Used downstream to filter LLM findings that reference non-changed lines.
    """
    return {(cl.file, cl.line) for cl in parsed.changed_lines if cl.change_type == "added"}
