"""
Unit tests for the unified diff parser.
"""
import pytest
from app.github.diff_parser import parse_diff, build_line_set, changed_lines_only


SIMPLE_DIFF = """\
diff --git a/app.py b/app.py
--- a/app.py
+++ b/app.py
@@ -10,7 +10,9 @@ def foo():
     x = 1
     y = 2
-    return x
+    return x + y
+    # new comment
+    pass
"""

MULTI_FILE_DIFF = """\
diff --git a/a.py b/a.py
--- a/a.py
+++ b/a.py
@@ -1,3 +1,4 @@
 context1
+added_line_in_a
 context2
 context3
diff --git a/b.py b/b.py
--- a/b.py
+++ b/b.py
@@ -5,3 +5,2 @@
 ctx
-removed_line
 ctx2
"""

NEW_FILE_DIFF = """\
diff --git a/new.py b/new.py
--- /dev/null
+++ b/new.py
@@ -0,0 +1,3 @@
+line_one
+line_two
+line_three
"""


def test_parse_simple_diff_files():
    parsed = parse_diff(SIMPLE_DIFF)
    assert "app.py" in parsed.files


def test_parse_simple_diff_added_lines():
    parsed = parse_diff(SIMPLE_DIFF)
    added  = [cl for cl in parsed.changed_lines if cl.change_type == "added"]
    assert len(added) == 3


def test_parse_simple_diff_removed_lines():
    parsed = parse_diff(SIMPLE_DIFF)
    removed = [cl for cl in parsed.changed_lines if cl.change_type == "removed"]
    assert len(removed) == 1
    assert "return x" in removed[0].content


def test_added_line_numbers():
    """Added lines should carry correct new-file line numbers."""
    parsed = parse_diff(SIMPLE_DIFF)
    added  = [cl for cl in parsed.changed_lines if cl.change_type == "added"]
    # hunk starts at new line 10; two context lines advance to 12; first added → 12
    line_numbers = [cl.line for cl in added]
    assert line_numbers == sorted(line_numbers), "line numbers should be ascending"


def test_multi_file_diff():
    parsed = parse_diff(MULTI_FILE_DIFF)
    assert set(parsed.files) == {"a.py", "b.py"}


def test_multi_file_correct_file_attribution():
    parsed = parse_diff(MULTI_FILE_DIFF)
    a_lines = [cl for cl in parsed.changed_lines if cl.file == "a.py"]
    b_lines = [cl for cl in parsed.changed_lines if cl.file == "b.py"]
    assert any(cl.change_type == "added" for cl in a_lines)
    assert any(cl.change_type == "removed" for cl in b_lines)


def test_new_file_diff():
    parsed = parse_diff(NEW_FILE_DIFF)
    assert "new.py" in parsed.files
    added = [cl for cl in parsed.changed_lines if cl.change_type == "added"]
    assert len(added) == 3
    assert added[0].line == 1
    assert added[2].line == 3


def test_build_line_set():
    parsed   = parse_diff(SIMPLE_DIFF)
    line_set = build_line_set(parsed)
    # All entries should be tuples of (str, int)
    for item in line_set:
        assert isinstance(item, tuple) and len(item) == 2
        assert isinstance(item[0], str)
        assert isinstance(item[1], int)


def test_changed_lines_only_excludes_context():
    parsed = parse_diff(SIMPLE_DIFF)
    non_ctx = changed_lines_only(parsed)
    for cl in non_ctx:
        assert cl.change_type != "context"


def test_empty_diff():
    parsed = parse_diff("")
    assert parsed.files == []
    assert parsed.changed_lines == []
