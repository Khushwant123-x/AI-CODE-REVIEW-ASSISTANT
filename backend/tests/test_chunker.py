"""
Unit tests for the chunker service.
"""
import pytest
from unittest.mock import patch
from app.github.diff_parser import parse_diff
from app.services.chunker   import chunk_diff

SMALL_DIFF = """\
diff --git a/a.py b/a.py
--- a/a.py
+++ b/a.py
@@ -1,3 +1,3 @@
 ctx
+added
-removed
"""

LARGE_DIFF_TEMPLATE = """\
diff --git a/big.py b/big.py
--- a/big.py
+++ b/big.py
@@ -1,{n} +1,{n} @@
{lines}
"""


def _make_large_diff(n: int) -> str:
    lines = "\n".join(f"+line_{i}" for i in range(n))
    return LARGE_DIFF_TEMPLATE.format(n=n, lines=lines)


def test_chunk_small_diff_single_chunk():
    parsed = parse_diff(SMALL_DIFF)
    with patch("app.services.chunker.get_settings") as mock_cfg:
        mock_cfg.return_value.max_chunk_lines = 300
        chunks = chunk_diff(parsed)
    assert len(chunks) == 1


def test_chunk_large_diff_multiple_chunks():
    parsed = parse_diff(_make_large_diff(700))
    with patch("app.services.chunker.get_settings") as mock_cfg:
        mock_cfg.return_value.max_chunk_lines = 300
        chunks = chunk_diff(parsed)
    # 700 lines with max 300 → 3 chunks
    assert len(chunks) >= 2


def test_chunks_are_strings():
    parsed = parse_diff(SMALL_DIFF)
    with patch("app.services.chunker.get_settings") as mock_cfg:
        mock_cfg.return_value.max_chunk_lines = 300
        chunks = chunk_diff(parsed)
    for chunk in chunks:
        assert isinstance(chunk, str)


def test_chunk_preserves_file_info():
    parsed = parse_diff(SMALL_DIFF)
    with patch("app.services.chunker.get_settings") as mock_cfg:
        mock_cfg.return_value.max_chunk_lines = 300
        chunks = chunk_diff(parsed)
    assert any("a.py" in chunk for chunk in chunks)


def test_empty_diff_returns_no_chunks():
    parsed = parse_diff("")
    with patch("app.services.chunker.get_settings") as mock_cfg:
        mock_cfg.return_value.max_chunk_lines = 300
        chunks = chunk_diff(parsed)
    assert chunks == []
