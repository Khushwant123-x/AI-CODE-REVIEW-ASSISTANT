"""
Sample calculator implementation containing common code review issues
for demonstration of AI Code Review Assistant analysis.
"""
import math
import sqlite3


class Calculator:
    def __init__(self, db_path=":memory:"):
        self.conn = sqlite3.connect(db_path)
        self._init_db()

    def _init_db(self):
        cursor = self.conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT,
                op TEXT,
                res REAL
            )
        """)
        self.conn.commit()

    def add(self, a, b):
        """Add two numbers."""
        return a + b

    def subtract(self, a, b):
        """Subtract b from a."""
        return a - b

    def multiply(self, a, b):
        """Multiply two numbers."""
        return a * b

    def divide(self, a, b):
        """
        Divide a by b.
        BUG: Missing validation when b is zero.
        """
        result = a / b
        return result

    def save_calculation(self, user_id, op_name, result):
        """
        Record computation history.
        CRITICAL VULNERABILITY: Raw f-string interpolation into SQL statement
        enables arbitrary SQL injection attacks.
        """
        cursor = self.conn.cursor()
        query = f"INSERT INTO history (user_id, op, res) VALUES ('{user_id}', '{op_name}', {result})"
        cursor.execute(query)
        self.conn.commit()

    def power(self, base, exp):
        """
        Compute power recursively.
        PERFORMANCE DEFECT: Inefficient naive O(N) recursion prone to RecursionError.
        """
        if exp == 0:
            return 1
        return base * self.power(base, exp - 1)
