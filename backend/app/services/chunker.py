"""
Diff chunker – splits a large ParsedDiff into manageable slices.

Each chunk is returned as a formatted diff string that can be sent directly
to the LLM. All chunks preserve file name and line number context.
"""
from __future__ import annotations

from app.config import get_settings
from app.models import ChangedLine, ParsedDiff


def _format_lines(lines: list[ChangedLine]) -> str:
    """Format a list of ChangedLine objects back into a diff-style string."""
    parts: list[str] = []
    last_file = None
    last_line = None

    for cl in lines:
        if cl.file != last_file:
            parts.append(f"\n--- a/{cl.file}")
            parts.append(f"+++ b/{cl.file}")
            last_file = cl.file
            last_line = None

        # Emit a synthetic hunk header when there is a gap in line numbers
        if last_line is None or cl.line > last_line + 5:
            parts.append(f"@@ +{cl.line} @@")

        prefix = {
            "added":   "+",
            "removed": "-",
            "context": " ",
        }.get(cl.change_type, " ")

        parts.append(f"{prefix}{cl.content}")
        last_line = cl.line

    return "\n".join(parts)


def chunk_diff(parsed: ParsedDiff) -> list[str]:
    """
    Split parsed diff into chunks of at most MAX_CHUNK_LINES lines.

    Returns a list of formatted diff strings ready to send to the LLM.
    """
    max_lines = get_settings().max_chunk_lines
    lines     = parsed.changed_lines

    if not lines:
        return []

    chunks: list[str] = []
    start = 0

    while start < len(lines):
        end   = min(start + max_lines, len(lines))
        chunk = _format_lines(lines[start:end])
        if chunk.strip():
            chunks.append(chunk)
        start = end

    return chunks
