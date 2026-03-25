"""LLM client abstraction with three-tier fallback.

Primary: Claude Sonnet via ANTHROPIC_API_KEY
Fallback 1: Gemini 2.5 Flash via GOOGLE_AI_API_KEY
Fallback 2: Ollama (local) via OLLAMA_BASE_URL (default localhost:11434)

Includes: retry with exponential backoff, timeout handling, robust JSON parsing.
"""

from __future__ import annotations

import json
import logging
import os
import re
import time
from dataclasses import dataclass

logger = logging.getLogger(__name__)

MAX_RETRIES = 2
RETRY_BACKOFF = [2, 5]  # seconds between retries


@dataclass
class LLMResponse:
    text: str
    model: str
    tokens_used: int
    latency_ms: int


def _has_anthropic_key() -> bool:
    return bool(os.environ.get("ANTHROPIC_API_KEY"))


def _has_gemini_key() -> bool:
    return bool(os.environ.get("GOOGLE_AI_API_KEY"))


def _has_ollama() -> bool:
    """Check if Ollama is reachable at the configured base URL."""
    import urllib.request
    base = os.environ.get("OLLAMA_BASE_URL", "http://localhost:11434")
    try:
        urllib.request.urlopen(f"{base}/api/tags", timeout=2)
        return True
    except Exception:
        return False


def _call_claude(
    system_prompt: str,
    user_message: str,
    model: str,
    temperature: float,
    max_tokens: int,
) -> LLMResponse:
    import anthropic

    client = anthropic.Anthropic()
    start_ms = int(time.time() * 1000)

    response = client.messages.create(
        model=model,
        max_tokens=max_tokens,
        temperature=temperature,
        system=system_prompt,
        messages=[{"role": "user", "content": user_message}],
    )

    elapsed_ms = int(time.time() * 1000) - start_ms
    return LLMResponse(
        text=response.content[0].text,
        model=model,
        tokens_used=response.usage.input_tokens + response.usage.output_tokens,
        latency_ms=elapsed_ms,
    )


def _call_gemini(
    system_prompt: str,
    user_message: str,
    model: str,
    temperature: float,
    max_tokens: int,
) -> LLMResponse:
    from google import genai
    from google.genai.types import GenerateContentConfig

    client = genai.Client(api_key=os.environ["GOOGLE_AI_API_KEY"])

    start_ms = int(time.time() * 1000)
    response = client.models.generate_content(
        model=model,
        contents=user_message,
        config=GenerateContentConfig(
            system_instruction=system_prompt,
            temperature=temperature,
            max_output_tokens=max_tokens,
        ),
    )
    elapsed_ms = int(time.time() * 1000) - start_ms

    usage = getattr(response, "usage_metadata", None)
    if usage:
        tokens_used = getattr(usage, "total_token_count", 0) or (
            getattr(usage, "prompt_token_count", 0)
            + getattr(usage, "candidates_token_count", 0)
        )
    else:
        tokens_used = 0

    return LLMResponse(
        text=response.text,
        model=model,
        tokens_used=tokens_used,
        latency_ms=elapsed_ms,
    )


def _call_ollama(
    system_prompt: str,
    user_message: str,
    model: str,
    temperature: float,
    max_tokens: int,
) -> LLMResponse:
    """Call a local Ollama model via its OpenAI-compatible API."""
    import urllib.request

    base = os.environ.get("OLLAMA_BASE_URL", "http://localhost:11434")
    url = f"{base}/api/chat"

    payload = json.dumps({
        "model": model,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_message},
        ],
        "stream": False,
        "options": {
            "temperature": temperature,
            "num_predict": max_tokens,
        },
    }).encode()

    start_ms = int(time.time() * 1000)
    req = urllib.request.Request(
        url, data=payload, headers={"Content-Type": "application/json"}
    )
    with urllib.request.urlopen(req, timeout=120) as resp:
        result = json.loads(resp.read().decode())

    elapsed_ms = int(time.time() * 1000) - start_ms

    text = result.get("message", {}).get("content", "")
    prompt_tokens = result.get("prompt_eval_count", 0)
    completion_tokens = result.get("eval_count", 0)

    return LLMResponse(
        text=text,
        model=model,
        tokens_used=prompt_tokens + completion_tokens,
        latency_ms=elapsed_ms,
    )


OLLAMA_DEFAULT_MODEL = "gemma3:4b"
GEMINI_FALLBACK_MODEL = "gemini-2.5-flash"


def _pick_backend(prefer: str) -> str:
    """Return 'claude', 'gemini', or 'ollama' based on preference and availability."""
    if prefer == "ollama" and _has_ollama():
        return "ollama"
    if prefer == "gemini" and _has_gemini_key():
        return "gemini"
    if prefer == "claude" and _has_anthropic_key():
        return "claude"
    # Fallback chain: claude → gemini → ollama
    if _has_anthropic_key():
        return "claude"
    if _has_gemini_key():
        return "gemini"
    if _has_ollama():
        return "ollama"
    raise RuntimeError(
        "No LLM backend available. Set ANTHROPIC_API_KEY, GOOGLE_AI_API_KEY, or run Ollama locally."
    )


def llm_call(
    system_prompt: str,
    user_message: str,
    *,
    claude_model: str = "claude-sonnet-4-20250514",
    gemini_model: str | None = None,
    ollama_model: str | None = None,
    temperature: float = 0.3,
    max_tokens: int = 2048,
    prefer: str = "claude",
) -> LLMResponse:
    """Unified LLM call with retry and fallback."""
    backend = _pick_backend(prefer)
    use_gemini_model = gemini_model or GEMINI_FALLBACK_MODEL
    use_ollama_model = ollama_model or os.environ.get("OLLAMA_MODEL", OLLAMA_DEFAULT_MODEL)

    last_error = None
    for attempt in range(MAX_RETRIES + 1):
        try:
            if backend == "claude":
                return _call_claude(system_prompt, user_message, claude_model, temperature, max_tokens)
            elif backend == "gemini":
                return _call_gemini(system_prompt, user_message, use_gemini_model, temperature, max_tokens)
            else:
                return _call_ollama(system_prompt, user_message, use_ollama_model, temperature, max_tokens)
        except Exception as e:
            last_error = e
            logger.warning(f"LLM call attempt {attempt+1} failed ({backend}): {e}")
            if attempt < MAX_RETRIES:
                time.sleep(RETRY_BACKOFF[attempt])

    raise RuntimeError(f"LLM call failed after {MAX_RETRIES+1} attempts: {last_error}") from last_error


def _fix_invalid_json_escapes(text: str) -> str:
    """Fix invalid backslash escapes that LLMs produce inside JSON strings.

    JSON only allows: \\", \\\\, \\/, \\b, \\f, \\n, \\r, \\t, \\uXXXX.
    LLMs generating code inside JSON strings often produce invalid sequences
    like \\s, \\d, \\p, \\w (from regex), \\c, \\a (from class names), etc.
    We double the backslash so json.loads sees a literal backslash.
    """
    # Valid JSON escape chars (after the backslash)
    valid = set('"\\/' + 'bfnrtu')

    result: list[str] = []
    i = 0
    in_string = False

    while i < len(text):
        ch = text[i]

        if ch == '"' and (i == 0 or text[i - 1] != '\\'):
            in_string = not in_string
            result.append(ch)
            i += 1
            continue

        if in_string and ch == '\\' and i + 1 < len(text):
            next_ch = text[i + 1]
            if next_ch in valid:
                # Valid escape — pass through as-is
                result.append(ch)
                result.append(next_ch)
                i += 2
            else:
                # Invalid escape (e.g. \s, \d, \p) — double the backslash
                result.append('\\\\')
                result.append(next_ch)
                i += 2
        else:
            result.append(ch)
            i += 1

    return ''.join(result)


def parse_json_response(raw_text: str) -> dict:
    """Parse JSON from LLM response — handles fences, smart quotes, invalid escapes."""
    text = raw_text.strip()

    # Replace smart quotes and other unicode that breaks JSON
    text = text.replace("\u201c", '"').replace("\u201d", '"')  # smart double quotes
    text = text.replace("\u2018", "'").replace("\u2019", "'")  # smart single quotes
    text = text.replace("\u2013", "-").replace("\u2014", "-")  # en/em dash

    attempts: list[tuple[str, str]] = []

    def _try_parse(candidate: str, label: str) -> dict | None:
        """Try json.loads, then retry with escape-fixing if it fails."""
        try:
            return json.loads(candidate)
        except json.JSONDecodeError as e:
            if "\\escape" in str(e).lower() or "escape" in str(e).lower():
                # Invalid escape — fix and retry
                try:
                    fixed = _fix_invalid_json_escapes(candidate)
                    return json.loads(fixed)
                except json.JSONDecodeError as e2:
                    attempts.append((label, f"original: {e}; after escape fix: {e2}"))
                    return None
            attempts.append((label, str(e)))
            return None

    # 1. Direct parse
    result = _try_parse(text, "direct")
    if result is not None:
        return result

    # 2. Extract from markdown code fence
    match = re.search(r"```(?:json)?\s*([\s\S]*?)```", text)
    if match:
        result = _try_parse(match.group(1).strip(), "fence")
        if result is not None:
            return result

    # 3. Find outermost { ... } — greedy match for the last }
    brace_start = text.find("{")
    if brace_start != -1:
        depth = 0
        end = -1
        in_string = False
        escape = False
        for i in range(brace_start, len(text)):
            ch = text[i]
            if escape:
                escape = False
                continue
            if ch == "\\":
                escape = True
                continue
            if ch == '"' and not escape:
                in_string = not in_string
                continue
            if in_string:
                continue
            if ch == "{":
                depth += 1
            elif ch == "}":
                depth -= 1
                if depth == 0:
                    end = i
                    break

        if end != -1:
            candidate = text[brace_start : end + 1]
            result = _try_parse(candidate, "brace_match")
            if result is not None:
                return result

    detail = "; ".join(f"{m}: {e}" for m, e in attempts)
    raise ValueError(
        f"Could not parse JSON from LLM response. Attempts: {detail}\n"
        f"First 300 chars: {text[:300]}"
    )
