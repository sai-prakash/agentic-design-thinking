"""Test Agent — Stage 5 of the Design Thinking pipeline.

Evaluates the prototype against WCAG, UX criteria, and design goals.
Prefers Claude for careful evaluation reasoning; falls back to Gemini.
"""

from __future__ import annotations

import json
from datetime import datetime, timezone

from app.llm import llm_call, parse_json_response
from app.rag import format_rag_context, retrieve
from app.state import AgentState, StageOutput

TEST_SYSTEM_PROMPT = """\
You are the Test Agent in an Agentic Design Thinking pipeline.

Your role: Rigorously evaluate the prototype against accessibility standards, \
UX criteria, and the original design goals. Channel Stanford's "Test to Learn" \
and IBM's Sponsor User validation.

Evaluate the component code against:
1. WCAG 2.1 AA accessibility checklist
2. Code quality and performance
3. Whether it meets the user needs from the Empathize stage
4. Whether it matches the POV statement from the Define stage
5. Whether it hits the Hills from the Define stage

{rag_context}

Respond ONLY with valid JSON matching this schema:
{{
  "wcag_audit": {{
    "passed": ["string — WCAG rules that pass"],
    "failed": ["string — WCAG rules that fail"],
    "warnings": ["string — potential issues"],
    "score": 0.85
  }},
  "performance_notes": ["string — code quality observations"],
  "ux_evaluation": {{
    "meets_needs": "string — boolean assessment + rationale",
    "matches_pov": "string — boolean assessment + rationale",
    "hits_hills": "string — boolean assessment + rationale"
  }},
  "overall_score": 0.82,
  "verdict": "pass | fail | needs_iteration",
  "fix_suggestions": ["string — specific, actionable fixes"],
  "loop_recommendation": {{
    "should_loop": false,
    "target_stage": "ideate",
    "reason": "string — why looping back would help"
  }}
}}

Scoring guide:
- overall_score >= 0.8 and no critical WCAG failures → verdict: "pass"
- overall_score >= 0.6 or minor issues → verdict: "needs_iteration"
- overall_score < 0.6 or critical failures → verdict: "fail"

If verdict is "needs_iteration" or "fail", set should_loop=true and recommend \
which stage to loop back to (usually "prototype" for code fixes, "ideate" for \
design rethink).

Do NOT include any text outside the JSON object. No markdown fences."""


def run_test(state: AgentState) -> dict:
    """Execute the Test stage."""
    prototype_data = state["prototype"]["data"]
    define_data = state["define"]["data"]
    empathize_data = state["empathize"]["data"]

    rag_chunks = retrieve("WCAG 2.1 AA accessibility checklist color contrast keyboard usability heuristics")
    rag_context = format_rag_context(rag_chunks)

    system_prompt = TEST_SYSTEM_PROMPT.replace("{rag_context}", rag_context)
    user_message = (
        "Evaluate this React component:\n\n"
        f"## Component Code\n```\n{prototype_data.get('component_code', 'N/A')}\n```\n\n"
        f"## Component Name: {prototype_data.get('component_name', 'N/A')}\n\n"
        f"## Design Decisions\n{json.dumps(prototype_data.get('design_decisions', []), indent=2)}\n\n"
        f"## Original User Needs\n{json.dumps(empathize_data.get('user_needs', []), indent=2)}\n\n"
        f"## POV Statement\n{define_data.get('pov_statement', 'N/A')}\n\n"
        f"## Hills\n{json.dumps(define_data.get('hills', []), indent=2)}\n\n"
        f"## Success Metrics\n{json.dumps(define_data.get('success_metrics', []), indent=2)}"
    )

    response = llm_call(
        system_prompt=system_prompt,
        user_message=user_message,
        prefer="claude",
        temperature=0.3,
        max_tokens=3072,
    )

    data = parse_json_response(response.text)

    stage_output: StageOutput = {
        "stage": "test",
        "status": "awaiting_review",
        "data": data,
        "llm_used": response.model,
        "confidence": _assess_confidence(data),
        "suggestions": data.get("fix_suggestions", []),
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }

    trace_entry = {
        "type": "llm_call",
        "stage": "test",
        "model": response.model,
        "tokens": response.tokens_used,
        "latency_ms": response.latency_ms,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }

    return {
        "test": stage_output,
        "current_stage": "test",
        "trace": [trace_entry],
        "total_tokens": state.get("total_tokens", 0) + response.tokens_used,
        "total_latency_ms": state.get("total_latency_ms", 0) + response.latency_ms,
    }


def _assess_confidence(data: dict) -> float:
    expected = ["wcag_audit", "ux_evaluation", "overall_score", "verdict", "loop_recommendation"]
    present = sum(1 for k in expected if data.get(k))
    return round(present / len(expected), 2)
