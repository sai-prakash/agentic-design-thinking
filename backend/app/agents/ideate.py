"""Ideate Agent — Stage 3 of the Design Thinking pipeline.

Generates 3-5 design variants with SVG wireframes.
Prefers Gemini for fast, diverse generation.
"""

from __future__ import annotations

import json
from datetime import datetime, timezone

from app.llm import llm_call, parse_json_response
from app.rag import format_rag_context, retrieve
from app.state import AgentState, StageOutput

IDEATE_SYSTEM_PROMPT = """\
You are the Ideate Agent in an Agentic Design Thinking pipeline.

Your role: Generate diverse design solutions. Channel Stanford d.school's Ideate \
stage — "defer judgment, go for volume." Explore multiple approaches before \
converging on a recommendation.

Given the problem definition, produce 3-5 distinct design variants. Each variant \
must include a simple SVG wireframe sketch (keep SVGs under 200 lines, use basic \
shapes — rects, circles, text, lines).

{rag_context}

Respond ONLY with valid JSON matching this schema:
{{
  "variants": [
    {{
      "id": "variant_1",
      "name": "string — descriptive name",
      "description": "string — what this variant does",
      "approach": "string — how it solves the HMW questions",
      "sketch_svg": "string — simple SVG wireframe (valid SVG markup, viewBox='0 0 400 300')",
      "pros": ["string"],
      "cons": ["string"]
    }}
  ],
  "selected_variant": "string — id of recommended variant",
  "selection_rationale": "string — why this variant is recommended"
}}

SVG guidelines:
- Use viewBox="0 0 400 300"
- Use basic shapes: rect, circle, text, line, path
- Use fill="#e2e8f0" for backgrounds, fill="#3b82f6" for primary, fill="#64748b" for text
- Keep it simple — this is a wireframe, not a final design
- Represent UI elements (buttons, cards, inputs) with labeled rectangles

Do NOT include any text outside the JSON object. No markdown fences."""


def run_ideate(state: AgentState) -> dict:
    """Execute the Ideate stage."""
    define_data = state["define"]["data"]
    rag_chunks = retrieve("React component patterns design tokens UI wireframe layout")
    rag_context = format_rag_context(rag_chunks)

    system_prompt = IDEATE_SYSTEM_PROMPT.replace("{rag_context}", rag_context)
    user_message = (
        "Generate design variants for this problem definition:\n\n"
        + json.dumps(define_data, indent=2)
    )

    response = llm_call(
        system_prompt=system_prompt,
        user_message=user_message,
        prefer="gemini",
        temperature=0.7,
        max_tokens=4096,
    )

    data = parse_json_response(response.text)

    stage_output: StageOutput = {
        "stage": "ideate",
        "status": "awaiting_review",
        "data": data,
        "llm_used": response.model,
        "confidence": _assess_confidence(data),
        "suggestions": [],
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "tokens_used": response.tokens_used,
        "latency_ms": response.latency_ms,
    }

    trace_entry = {
        "type": "llm_call",
        "stage": "ideate",
        "model": response.model,
        "tokens": response.tokens_used,
        "latency_ms": response.latency_ms,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }

    return {
        "ideate": stage_output,
        "current_stage": "ideate",
        "trace": [trace_entry],
        "total_tokens": state.get("total_tokens", 0) + response.tokens_used,
        "total_latency_ms": state.get("total_latency_ms", 0) + response.latency_ms,
    }


def _assess_confidence(data: dict) -> float:
    variants = data.get("variants", [])
    has_selection = bool(data.get("selected_variant"))
    variant_count = len(variants)
    has_svgs = all(v.get("sketch_svg") for v in variants)
    score = 0.0
    if variant_count >= 3:
        score += 0.4
    elif variant_count >= 1:
        score += 0.2
    if has_selection:
        score += 0.3
    if has_svgs:
        score += 0.3
    return round(min(1.0, score), 2)
