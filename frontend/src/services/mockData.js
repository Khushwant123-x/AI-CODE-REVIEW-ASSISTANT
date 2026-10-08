/**
 * Mock data for Repositories, PRs, and Diffs.
 * Provides realistic GitHub PR review data when backend only exposes /review,
 * or for instant seamless demo workflows.
 */

export const DEFAULT_REPOSITORIES = [
  {
    id: 'ai-code-review',
    name: 'AI-CODE-REVIEW-ASSISTANT',
    owner: 'Khushwant123-x',
    fullName: 'Khushwant123-x/AI-CODE-REVIEW-ASSISTANT',
    description: 'LLM-powered GitHub Pull Request code review assistant using Groq and FastAPI',
    defaultBranch: 'main',
    stars: 14,
    forks: 3,
    openPrsCount: 3,
    lastReviewed: '10 minutes ago',
    lastReviewScore: 82,
    status: 'needs_changes',
    isPrimary: true,
  },
  {
    id: 'backend-api',
    name: 'backend-api',
    owner: 'Khushwant123-x',
    fullName: 'Khushwant123-x/backend-api',
    description: 'RESTful API gateway for microservices and database connectors',
    defaultBranch: 'main',
    stars: 8,
    forks: 1,
    openPrsCount: 2,
    lastReviewed: '2 hours ago',
    lastReviewScore: 94,
    status: 'passed',
    isPrimary: false,
  },
  {
    id: 'ml-service',
    name: 'ml-service',
    owner: 'Khushwant123-x',
    fullName: 'Khushwant123-x/ml-service',
    description: 'Model inference pipelines and token batching worker services',
    defaultBranch: 'develop',
    stars: 22,
    forks: 5,
    openPrsCount: 1,
    lastReviewed: 'Yesterday',
    lastReviewScore: 71,
    status: 'needs_changes',
    isPrimary: false,
  },
]

export const DEFAULT_PULL_REQUESTS = {
  'Khushwant123-x/AI-CODE-REVIEW-ASSISTANT': [
    {
      number: 3,
      title: 'Fix math operators and add division error handling in calculator',
      author: 'Khushwant123-x',
      authorAvatar: 'https://github.com/Khushwant123-x.png',
      sourceBranch: 'test-pr-3',
      targetBranch: 'main',
      filesChanged: 2,
      commits: 3,
      additions: 48,
      deletions: 12,
      createdAt: '1 day ago',
      status: 'open',
      lastReviewScore: 82,
      lastReviewRecommendation: 'Changes Requested',
      hasReview: true,
    },
    {
      number: 2,
      title: 'feat: Add diff chunker with token boundary protection',
      author: 'Khushwant123-x',
      authorAvatar: 'https://github.com/Khushwant123-x.png',
      sourceBranch: 'feat/chunker',
      targetBranch: 'main',
      filesChanged: 3,
      commits: 4,
      additions: 110,
      deletions: 18,
      createdAt: '3 days ago',
      status: 'open',
      lastReviewScore: 91,
      lastReviewRecommendation: 'Approved',
      hasReview: true,
    },
    {
      number: 1,
      title: 'chore: Initial FastAPI boilerplate and CORS configuration',
      author: 'Khushwant123-x',
      authorAvatar: 'https://github.com/Khushwant123-x.png',
      sourceBranch: 'chore/setup',
      targetBranch: 'main',
      filesChanged: 6,
      commits: 7,
      additions: 240,
      deletions: 5,
      createdAt: '5 days ago',
      status: 'merged',
      lastReviewScore: 95,
      lastReviewRecommendation: 'Approved',
      hasReview: true,
    },
  ],
  'Khushwant123-x/backend-api': [
    {
      number: 12,
      title: 'feat: Implement JWT refresh token rotation with Redis store',
      author: 'Khushwant123-x',
      authorAvatar: 'https://github.com/Khushwant123-x.png',
      sourceBranch: 'feat/jwt-rotation',
      targetBranch: 'main',
      filesChanged: 4,
      commits: 5,
      additions: 135,
      deletions: 22,
      createdAt: '2 hours ago',
      status: 'open',
      lastReviewScore: 94,
      lastReviewRecommendation: 'Approved',
      hasReview: true,
    },
  ],
  'Khushwant123-x/ml-service': [
    {
      number: 7,
      title: 'fix: Address memory leak in asynchronous batch tokenizer',
      author: 'Khushwant123-x',
      authorAvatar: 'https://github.com/Khushwant123-x.png',
      sourceBranch: 'fix/tokenizer-leak',
      targetBranch: 'develop',
      filesChanged: 5,
      commits: 6,
      additions: 89,
      deletions: 64,
      createdAt: 'Yesterday',
      status: 'open',
      lastReviewScore: 71,
      lastReviewRecommendation: 'Changes Requested',
      hasReview: true,
    },
  ],
}

/**
 * Realistic diff representations for PR #3
 */
export const MOCK_DIFFS = {
  'backend/buggy_calculator.py': `diff --git a/backend/buggy_calculator.py b/backend/buggy_calculator.py
index 4b825dc..e69de29 100644
--- a/backend/buggy_calculator.py
+++ b/backend/buggy_calculator.py
@@ -1,18 +1,28 @@
+import math
+import sqlite3
+
 class Calculator:
-    def __init__(self):
-        pass
+    def __init__(self, db_path=":memory:"):
+        self.conn = sqlite3.connect(db_path)
 
-    def add(self, a, b):
-        return a - b
+    def add(self, a, b):
+        return a + b
 
     def divide(self, a, b):
-        return a / b
+        # BUG: missing zero division check before division
+        result = a / b
+        return result
 
-    def calculate_tax(self, amount, rate):
-        return amount * rate
+    def save_calculation(self, user_id, op_name, result):
+        # VULNERABILITY: Raw SQL string formatting allows SQL injection
+        cursor = self.conn.cursor()
+        query = f"INSERT INTO history (user_id, op, res) VALUES ('{user_id}', '{op_name}', {result})"
+        cursor.execute(query)
+        self.conn.commit()
+
+    def power(self, base, exp):
+        # PERFORMANCE: inefficient recursive multiplication
+        if exp == 0:
+            return 1
+        return base * self.power(base, exp - 1)
`,
  'backend/app/auth/security.py': `diff --git a/backend/app/auth/security.py b/backend/app/auth/security.py
index 9a204fe..b18c721 100644
--- a/backend/app/auth/security.py
+++ b/backend/app/auth/security.py
@@ -40,12 +40,16 @@ def generate_jwt(user_id: str, role: str) -> str:
     payload = {
         "sub": user_id,
         "role": role,
         "exp": datetime.utcnow() + timedelta(hours=2)
     }
-    secret = os.environ.get("JWT_SECRET")
+    # SECURITY: Insecure fallback secret key
+    secret = os.environ.get("JWT_SECRET", "super-secret-default-key-12345")
     return jwt.encode(payload, secret, algorithm="HS256")
 
 def verify_signature(token: str) -> dict:
+    # Missing signature expiry validation
+    unverified = jwt.decode(token, options={"verify_signature": False})
+    return unverified
`,
}

/**
 * Standard complete review result for demo & PR #3 inspection
 */
export const DEMO_REVIEW_PR3 = {
  status: 'success',
  pr_number: 3,
  repo_name: 'AI-CODE-REVIEW-ASSISTANT',
  owner: 'Khushwant123-x',
  source_branch: 'test-pr-3',
  target_branch: 'main',
  author: 'Khushwant123-x',
  files_reviewed: 2,
  issues_found: 5,
  comments_posted: 0,
  score: 82,
  recommendation: 'Changes Requested',
  summary:
    'The pull request introduces a critical SQL injection vulnerability in `save_calculation` via unescaped string formatting and an uncaught ZeroDivisionError in `divide`. Additionally, a hardcoded fallback JWT secret was detected in security auth helper. Recommended changes must be resolved before merging into main.',
  severity_breakdown: {
    critical: 2,
    high: 1,
    medium: 1,
    low: 1,
    passed: 12,
  },
  categories_breakdown: {
    security: 2,
    bug: 1,
    performance: 1,
    maintainability: 1,
  },
  issues: [
    {
      id: 'issue-1',
      file: 'backend/buggy_calculator.py',
      line: 19,
      severity: 'Critical',
      issue_type: 'security',
      title: 'SQL Injection Vulnerability in save_calculation query',
      what: 'User input `user_id` is interpolated directly into an SQL string with Python f-string formatting instead of using parameterized queries.',
      why: 'An attacker can supply malicious input (e.g. `\' OR 1=1; --`) to execute unauthorized arbitrary SQL commands, potentially exposing or modifying the entire database.',
      how: 'Use parameterized queries with question mark (`?`) placeholders so SQLite safely escapes all inputs.',
      explanation:
        'The query string is constructed via f-string formatting (`f"INSERT INTO history ... VALUES (\'{user_id}\'..."`). This directly embeds arbitrary SQL from the caller into the database execution pipeline without escaping.',
      suggestion:
        'query = "INSERT INTO history (user_id, op, res) VALUES (?, ?, ?)"\ncursor.execute(query, (user_id, op_name, result))',
      before_code:
        'query = f"INSERT INTO history (user_id, op, res) VALUES (\'{user_id}\', \'{op_name}\', {result})"\ncursor.execute(query)',
      after_code:
        'query = "INSERT INTO history (user_id, op, res) VALUES (?, ?, ?)"\ncursor.execute(query, (user_id, op_name, result))',
    },
    {
      id: 'issue-2',
      file: 'backend/app/auth/security.py',
      line: 45,
      severity: 'Critical',
      issue_type: 'security',
      title: 'Hardcoded Fallback JWT Secret Key Allows Token Forgery',
      what: 'A static hardcoded secret `"super-secret-default-key-12345"` is used as the default fallback when the `JWT_SECRET` environment variable is not defined.',
      why: 'Anyone with access to the source code can sign valid JWT tokens with admin privileges and bypass all application authentication barriers.',
      how: 'Strictly retrieve the secret from environment variables without default fallbacks and raise an explicit configuration error on application startup if unset.',
      explanation:
        'The HMAC secret key is hardcoded as a fallback string literal. In production or test environments missing the env variable, the well-known static key will be active.',
      suggestion:
        'secret = os.environ.get("JWT_SECRET")\nif not secret:\n    raise RuntimeError("JWT_SECRET environment variable is required and must not be empty")',
      before_code:
        'secret = os.environ.get("JWT_SECRET", "super-secret-default-key-12345")',
      after_code:
        'secret = os.environ.get("JWT_SECRET")\nif not secret:\n    raise RuntimeError("JWT_SECRET environment variable is missing")',
    },
    {
      id: 'issue-3',
      file: 'backend/buggy_calculator.py',
      line: 13,
      severity: 'Warning',
      issue_type: 'bug',
      title: 'Unchecked ZeroDivisionError in divide() method',
      what: 'Division operation `a / b` lacks checking whether divisor `b` is zero or near zero.',
      why: 'Passing `0` as the divisor will raise an unhandled `ZeroDivisionError` exception, causing an abrupt application crash or 500 Internal Server Error in API endpoints.',
      how: 'Validate `if b == 0:` before executing division and raise a controlled `ValueError` or return a domain error.',
      explanation:
        'The method performs `result = a / b` directly. When callers invoke `divide(10, 0)`, an unhandled exception will propagate up the stack.',
      suggestion:
        'if b == 0:\n    raise ValueError("Divisor cannot be zero")\nreturn a / b',
      before_code:
        'def divide(self, a, b):\n    result = a / b\n    return result',
      after_code:
        'def divide(self, a, b):\n    if b == 0:\n        raise ValueError("Divisor cannot be zero")\n    return a / b',
    },
    {
      id: 'issue-4',
      file: 'backend/buggy_calculator.py',
      line: 27,
      severity: 'Warning',
      issue_type: 'performance',
      title: 'Inefficient recursive power implementation causes stack overflow risk',
      what: 'The `power` function computes exponents using naive O(N) recursion.',
      why: 'For large exponent values, this consumes excessive stack frames and raises Python `RecursionError` while running in linear time instead of logarithmic time.',
      how: 'Use Python\'s built-in `pow(base, exp)` or exponentiation by squaring O(log N).',
      explanation:
        'Recursive multiplication requires N stack calls. For exp >= 1000, Python hits `sys.getrecursionlimit()` causing an immediate failure.',
      suggestion:
        'return pow(base, exp)',
      before_code:
        'def power(self, base, exp):\n    if exp == 0:\n        return 1\n    return base * self.power(base, exp - 1)',
      after_code:
        'def power(self, base, exp):\n    return pow(base, exp)',
    },
    {
      id: 'issue-5',
      file: 'backend/app/auth/security.py',
      line: 50,
      severity: 'Info',
      issue_type: 'maintainability',
      title: 'verify_signature disables verification options',
      what: 'The helper `verify_signature` explicitly passes `{"verify_signature": False}` to `jwt.decode`.',
      why: 'This function misleadingly names itself `verify_signature` while actually decoding payloads completely unverified.',
      how: 'Rename to `decode_unverified_payload` or implement genuine cryptographic signature verification with proper key.',
      explanation:
        'The function title suggests cryptographic validation, but the options dictionary explicitly disables signature checking, causing confusion for downstream developers.',
      suggestion:
        'def decode_unverified_claims(token: str) -> dict:\n    return jwt.decode(token, options={"verify_signature": False})',
      before_code:
        'def verify_signature(token: str) -> dict:\n    unverified = jwt.decode(token, options={"verify_signature": False})\n    return unverified',
      after_code:
        'def decode_unverified_claims(token: str) -> dict:\n    return jwt.decode(token, options={"verify_signature": False})',
    },
  ],
}
