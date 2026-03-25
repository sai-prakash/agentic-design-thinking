"""Empathize Agent — Stage 1 of the Design Thinking pipeline.

Uses Claude Sonnet for nuanced reasoning about user needs.
Falls back to Gemini 2.5 Flash if ANTHROPIC_API_KEY is not set.
"""

from __future__ import annotations

from datetime import datetime, timezone

from app.llm import llm_call, parse_json_response
from app.rag import format_rag_context, retrieve
from app.state import AgentState, StageOutput

EMPATHIZE_SYSTEM_PROMPT = """\
You are the Empathize Agent in an Agentic Design Thinking pipeline.

Your role: Deeply understand the user behind the design prompt. Channel Stanford \
d.school's Empathize stage — immerse yourself in the user's world. Apply IBM's \
principle of "Focus on user outcomes."

Given a design prompt, produce:
1. Core user needs (3-5)
2. Pain points and frustrations (3-5)
3. A complete empathy map (thinks/feels/says/does)
4. A primary persona with name, role, goals, frustrations
5. Research notes summarizing your understanding

{rag_context}

Respond ONLY with valid JSON matching this schema:
{{
  "user_needs": ["string — 3-5 core needs"],
  "pain_points": ["string — 3-5 frustrations"],
  "empathy_map": {{
    "thinks": ["..."],
    "feels": ["..."],
    "says": ["..."],
    "does": ["..."]
  }},
  "persona": {{
    "name": "string",
    "role": "string",
    "goals": ["..."],
    "frustrations": ["..."]
  }},
  "research_notes": "string — narrative summary"
}}

Do NOT include any text outside the JSON object. No markdown fences."""


def run_empathize(state: AgentState) -> dict:
    """Execute the Empathize stage. Returns a partial state update."""
    user_prompt = state["user_prompt"]
    rag_chunks = retrieve(f"empathy map persona user research {user_prompt[:100]}")
    rag_context = format_rag_context(rag_chunks)

    system_prompt = EMPATHIZE_SYSTEM_PROMPT.replace("{rag_context}", rag_context)

    response = llm_call(
        system_prompt=system_prompt,
        user_message=user_prompt,
        prefer="claude",
        temperature=0.3,
        max_tokens=4096,
    )

    data = parse_json_response(response.text)
    confidence = _assess_confidence(data)

    stage_output: StageOutput = {
        "stage": "empathize",
        "status": "awaiting_review",
        "data": data,
        "llm_used": response.model,
        "confidence": confidence,
        "suggestions": [],
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "tokens_used": response.tokens_used,
        "latency_ms": response.latency_ms,
    }

    trace_entry = {
        "type": "llm_call",
        "stage": "empathize",
        "model": response.model,
        "tokens": response.tokens_used,
        "latency_ms": response.latency_ms,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }

    return {
        "empathize": stage_output,
        "current_stage": "empathize",
        "trace": [trace_entry],
        "total_tokens": state.get("total_tokens", 0) + response.tokens_used,
        "total_latency_ms": state.get("total_latency_ms", 0) + response.latency_ms,
    }


def _assess_confidence(data: dict) -> float:
    """Simple heuristic: check how many expected fields are populated."""
    expected_keys = ["user_needs", "pain_points", "empathy_map", "persona", "research_notes"]
    present = sum(1 for k in expected_keys if data.get(k))
    base = present / len(expected_keys)

    needs_count = len(data.get("user_needs", []))
    pains_count = len(data.get("pain_points", []))
    list_bonus = min(0.1, (needs_count + pains_count) / 100)

    return round(min(1.0, base + list_bonus), 2)
