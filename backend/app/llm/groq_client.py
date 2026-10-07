"""
Isolated Groq API client.

All Groq-specific logic lives here so it can be swapped for any other LLM
provider without touching the rest of the application.
"""
from __future__ import annotations

import json
import logging
import re
from typing import Any

import httpx

from app.config import get_settings
from app.llm.prompts import SYSTEM_PROMPT, build_user_prompt
from app.models import LLMResponse, ReviewIssue

logger = logging.getLogger(__name__)

_GROQ_CHAT_URL = "https://api.groq.com/openai/v1/chat/completions"


def _extract_json(text: str) -> str:
    """
    Strip markdown code fences if the model wraps its JSON output in them.
    Returns the raw JSON string.
    """
    # Remove ```json ... ``` or ``` ... ```
    fenced = re.search(r"```(?:json)?\s*([\s\S]+?)```", text)
    if fenced:
        return fenced.group(1).strip()
    return text.strip()


async def review_chunk(diff_chunk: str) -> LLMResponse:
    """
    Send a diff chunk to Groq and return a validated LLMResponse.
    Returns an empty LLMResponse on any error so the caller can continue.
    """
    settings = get_settings()

    if not settings.groq_api_key:
        raise ValueError(
            "GROQ_API_KEY is not configured. Please set your GROQ_API_KEY in backend/.env "
            "(get a free API key at https://console.groq.com)."
        )

    headers = {
        "Authorization": f"Bearer {settings.groq_api_key}",
        "Content-Type":  "application/json",
    }

    payload: dict[str, Any] = {
        "model": settings.groq_model,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user",   "content": build_user_prompt(diff_chunk)},
        ],
        "temperature": 0.1,    # low temperature → deterministic, conservative output
        "max_tokens":  4096,
        "response_format": {"type": "json_object"},
    }

    try:
        async with httpx.AsyncClient(timeout=120) as client:
            resp = await client.post(_GROQ_CHAT_URL, json=payload, headers=headers)
        if resp.status_code == 401:
            raise ValueError("Invalid GROQ_API_KEY. Please check your key at https://console.groq.com.")
        elif resp.status_code == 429:
            raise ValueError("Groq API rate limit exceeded. Please wait a moment before trying again.")
        resp.raise_for_status()
    except httpx.HTTPStatusError as exc:
        logger.error("Groq API HTTP error: %s – %s", exc.response.status_code, exc.response.text)
        raise ValueError(f"Groq API error ({exc.response.status_code}): {exc.response.text}") from exc
    except httpx.RequestError as exc:
        logger.error("Groq API request error: %s", exc)
        raise ValueError(f"Failed to connect to Groq API: {exc}") from exc

    try:
        data      = resp.json()
        raw_text  = data["choices"][0]["message"]["content"]
        json_text = _extract_json(raw_text)
        parsed    = json.loads(json_text)
        return LLMResponse(**parsed)
    except (KeyError, json.JSONDecodeError, Exception) as exc:
        logger.error("Failed to parse Groq response: %s", exc)
        return LLMResponse(issues=[])
