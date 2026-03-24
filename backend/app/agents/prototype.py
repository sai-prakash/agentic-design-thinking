"""Prototype Agent — Stage 4 of the Design Thinking pipeline.

Generates a self-contained React+Tailwind component for react-live.
Prefers Gemini for fast code generation.
"""

from __future__ import annotations

import json
from datetime import datetime, timezone

from app.llm import llm_call, parse_json_response
from app.rag import format_rag_context, retrieve
from app.state import AgentState, StageOutput

PROTOTYPE_SYSTEM_PROMPT = """\
You are the Prototype Agent in an Agentic Design Thinking pipeline.

Your role: Generate a production-quality React component using TypeScript and \
Tailwind CSS. Channel Stanford's "Build to Think" and IBM's "Restless Reinvention."

CRITICAL CONSTRAINTS:
- Output must be a single self-contained React component
- Use only inline Tailwind classes (no external CSS)
- No imports — the component will run in react-live
- The component must be a single function that returns JSX
- Use React.useState, React.useEffect etc. (React is available globally)
- Must be accessible (ARIA labels, keyboard navigation, semantic HTML)
- Must handle empty/loading/error states
- Use modern, clean design with good spacing and typography

{rag_context}

Respond ONLY with valid JSON matching this schema:
{{
  "component_code": "string — full React component as a single function (no imports, no export)",
  "component_name": "string",
  "props_interface": "string — TypeScript interface for props",
  "usage_example": "string — how to render the component: <ComponentName />",
  "dependencies": [],
  "design_decisions": ["string — why key implementation choices were made"]
}}

The component_code MUST:
- Start with: function ComponentName() {{ or const ComponentName = () => {{
- End with the component rendering JSX
- Use only Tailwind utility classes for styling
- NOT use import/export statements
- NOT reference external modules

Do NOT include any text outside the JSON object. No markdown fences."""


def run_prototype(state: AgentState) -> dict:
    """Execute the Prototype stage."""
    ideate_data = state["ideate"]["data"]
    define_data = state["define"]["data"]

    # Find the selected variant
    selected_id = ideate_data.get("selected_variant", "")
    selected_variant = None
    for v in ideate_data.get("variants", []):
        if v.get("id") == selected_id:
            selected_variant = v
            break
    if not selected_variant and ideate_data.get("variants"):
        selected_variant = ideate_data["variants"][0]

    rag_chunks = retrieve("Tailwind CSS React component accessibility ARIA keyboard navigation")
    rag_context = format_rag_context(rag_chunks)

    system_prompt = PROTOTYPE_SYSTEM_PROMPT.replace("{rag_context}", rag_context)
    user_message = (
        "Build a React component based on this design:\n\n"
        f"## Selected Variant\n{json.dumps(selected_variant, indent=2)}\n\n"
        f"## Problem Definition\n{json.dumps(define_data, indent=2)}\n\n"
        f"## Constraints\n{json.dumps(define_data.get('constraints', []), indent=2)}"
    )

    response = llm_call(
        system_prompt=system_prompt,
        user_message=user_message,
        prefer="gemini",
        temperature=0.2,
        max_tokens=4096,
    )

    data = parse_json_response(response.text)

    stage_output: StageOutput = {
        "stage": "prototype",
        "status": "awaiting_review",
        "data": data,
        "llm_used": response.model,
        "confidence": _assess_confidence(data),
        "suggestions": [],
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }

    trace_entry = {
        "type": "llm_call",
        "stage": "prototype",
        "model": response.model,
        "tokens": response.tokens_used,
        "latency_ms": response.latency_ms,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }

    return {
        "prototype": stage_output,
        "current_stage": "prototype",
        "trace": [trace_entry],
        "total_tokens": state.get("total_tokens", 0) + response.tokens_used,
        "total_latency_ms": state.get("total_latency_ms", 0) + response.latency_ms,
    }


def _assess_confidence(data: dict) -> float:
    code = data.get("component_code", "")
    score = 0.0
    if code and len(code) > 100:
        score += 0.4
    if "className" in code:
        score += 0.2
    if "aria-" in code or "role=" in code:
        score += 0.2
    if data.get("component_name"):
        score += 0.1
    if data.get("design_decisions"):
        score += 0.1
    return round(min(1.0, score), 2)
