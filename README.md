# AI Code Review Assistant

> **LLM-powered GitHub Pull Request code review using Groq + FastAPI + React**

---

## Overview

The AI Code Review Assistant automatically analyses GitHub Pull Requests using a Groq LLM. When a PR is opened or updated, a GitHub Action triggers the FastAPI backend which fetches the diff, chunks it, sends each chunk to Groq for analysis, validates and deduplicates the findings, posts inline review comments to the PR, and surfaces results in a React dashboard.

---

## Architecture

```
Pull Request (opened / updated)
        │
        ▼
  GitHub Actions workflow
        │
        ▼
  FastAPI  /review  endpoint
        │
        ├─── GitHub API ──► Fetch PR diff
        │
        ├─── Diff parser ──► Parse changed lines + line numbers
        │
        ├─── Chunker ──► Split large diffs into ≤300-line chunks
        │
        ├─── Groq LLM ──► Structured JSON findings per chunk
        │
        ├─── Validator + Filters ──► Deduplicate, validate, cap
        │
        └─── GitHub API ──► Post inline PR comments
        │
        ▼
  JSON response → React Dashboard
```

---

## Features

- 🤖 **Groq-powered analysis** – uses configurable model (default: `llama3-70b-8192`)
- 🔍 **Proper diff parsing** – accurate line numbers via hunk headers
- 📦 **Smart chunking** – large PRs split into ≤300-line chunks
- ✅ **Pydantic validation** – structured, typed findings
- 🔄 **Deduplication & filtering** – removes noise and false positives
- 💬 **Inline PR comments** – line-level with severity badges
- 📊 **React dashboard** – filters, file sidebar, expandable issue cards
- ⚡ **GitHub Action** – automatic review on PR events

---

## Tech Stack

| Layer     | Technology                |
|-----------|---------------------------|
| Backend   | Python · FastAPI · Pydantic · httpx |
| LLM       | Groq API (llama3-70b-8192) |
| Frontend  | React · Vite · Vanilla CSS |
| CI/CD     | GitHub Actions             |

---

## Folder Structure

```
project-root/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI entry point
│   │   ├── config.py            # Settings (pydantic-settings)
│   │   ├── models.py            # Pydantic models
│   │   ├── github/
│   │   │   ├── client.py        # GitHub REST API calls
│   │   │   ├── diff_parser.py   # Unified diff parser
│   │   │   └── comments.py      # Post review comments
│   │   ├── llm/
│   │   │   ├── groq_client.py   # Groq API client (isolated)
│   │   │   └── prompts.py       # System + user prompts
│   │   └── services/
│   │       ├── review_service.py # Orchestration
│   │       ├── chunker.py        # Diff chunking
│   │       ├── validator.py      # Issue validation
│   │       └── filters.py        # Deduplication + filtering
│   ├── tests/
│   │   ├── test_diff_parser.py
│   │   ├── test_validator.py
│   │   ├── test_chunker.py
│   │   └── test_filters.py
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   ├── index.css
│   │   ├── components/
│   │   │   ├── Header.jsx
│   │   │   ├── PRInputPanel.jsx
│   │   │   ├── SummaryCards.jsx
│   │   │   ├── FilterBar.jsx
│   │   │   ├── IssueList.jsx
│   │   │   ├── FileSidebar.jsx
│   │   │   └── LoadingState.jsx
│   │   └── services/
│   │       └── api.js
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── .env.example
├── .github/
│   └── workflows/
│       └── code-review.yml
├── .gitignore
└── README.md
```

---

## Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv .venv
.venv\Scripts\activate          # Windows
# source .venv/bin/activate     # macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Copy and fill in environment variables
copy .env.example .env
# Edit .env with your tokens
```

---

## Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Copy and fill in environment variables
copy .env.example .env
# Edit VITE_API_URL if needed
```

---

## Environment Variables

### `backend/.env`

| Variable          | Description                              | Example                  |
|-------------------|------------------------------------------|--------------------------|
| `GITHUB_TOKEN`    | GitHub PAT (repo + pull_requests scopes) | `ghp_xxxx`               |
| `GROQ_API_KEY`    | Groq API key                             | `gsk_xxxx`               |
| `GROQ_MODEL`      | Groq model name                          | `llama3-70b-8192`        |
| `MAX_CHUNK_LINES` | Max diff lines per LLM chunk             | `300`                    |

### `frontend/.env`

| Variable       | Description           | Example                  |
|----------------|-----------------------|--------------------------|
| `VITE_API_URL` | FastAPI backend URL   | `http://localhost:8000`  |

---

## Run Locally

### Backend

```bash
cd backend
uvicorn app.main:app --reload
# API: http://localhost:8000
# Docs: http://localhost:8000/docs
```

### Frontend

```bash
cd frontend
npm run dev
# UI: http://localhost:5173
```

---

## GitHub Action Setup

The workflow `.github/workflows/code-review.yml` is already created. It triggers on PR events.

### Required GitHub Secrets

Go to **Settings → Secrets and variables → Actions → New repository secret**:

| Secret          | Value                                          |
|-----------------|------------------------------------------------|
| `GH_TOKEN`      | GitHub PAT with `repo` + `pull_requests` scope |
| `GROQ_API_KEY`  | Your Groq API key                              |
| `GROQ_MODEL`    | (Optional) e.g. `llama3-70b-8192`             |
| `BACKEND_URL`   | (Optional) External backend URL                |

> **Note:** The workflow starts the backend *locally within the runner* by default. For a production setup, deploy the backend externally and set `BACKEND_URL` to its URL.

---

## Groq API Setup

1. Go to [console.groq.com](https://console.groq.com)
2. Create an account and generate an API key
3. Add the key to `backend/.env` as `GROQ_API_KEY`
4. Choose a model – `llama3-70b-8192` (default) is recommended

---

## Testing with a Real PR

```bash
# With the backend running locally:
curl -X POST http://localhost:8000/review \
  -H "Content-Type: application/json" \
  -d '{"owner": "your-org", "repo": "your-repo", "pr_number": 1}'
```

Or use the dashboard at `http://localhost:5173`.

---

## Running Tests

```bash
cd backend
python -m pytest tests/ -v
```

Tests cover:
- Diff parser (line numbers, multi-file, new files)
- Pydantic validation
- Chunking (single/multi chunk, empty)
- Filters (deduplication, false positives, caps)

No real API keys are needed – all external calls are mocked.

---

## Example Review Output

```json
{
  "status": "success",
  "pr_number": 42,
  "files_reviewed": 3,
  "issues_found": 2,
  "comments_posted": 2,
  "issues": [
    {
      "issue_type": "security",
      "file": "app/database.py",
      "line": 28,
      "severity": "Critical",
      "title": "SQL Injection via string concatenation",
      "explanation": "User-controlled input is directly interpolated into the SQL query string.",
      "suggestion": "Use parameterized queries: cursor.execute('SELECT * FROM users WHERE id = %s', (user_id,))"
    }
  ]
}
```

---

## Known Limitations

1. **GitHub Action self-hosted backend** – the default workflow starts the backend inside the runner; for real production use deploy the backend to a server and set `BACKEND_URL`.
2. **Rate limits** – Groq has per-minute token limits; very large PRs may be throttled.
3. **Context window** – very long individual files are chunked, but the model may lose cross-file context.
4. **Line numbers** – the diff position map covers added lines; removed-line comments use general PR comments.
5. **No authentication** – the FastAPI backend has no auth layer (suitable for local use; add auth before exposing publicly).
#   A I - C O D E - R E V I E W - A S S I S T A N T  
 