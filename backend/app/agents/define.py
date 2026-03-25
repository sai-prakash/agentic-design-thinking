"""Define Agent — Stage 2 of the Design Thinking pipeline.

Synthesizes empathize output into POV statement, HMW questions, Hills.
Prefers Claude for strong reasoning; falls back to Gemini.
"""

from __future__ import annotations

import json
from datetime import datetime, timezone

from app.llm import llm_call, parse_json_response
from app.rag import format_rag_context, retrieve
from app.state import AgentState, StageOutput

DEFINE_SYSTEM_PROMPT = """\
You are the Define Agent in an Agentic Design Thinking pipeline.

Your role: Synthesize user research into a clear problem frame. Channel Stanford \
d.school's Define stage — reframe insights into actionable design challenges. \
Apply IBM's Hills alignment and SAP's principle of "connect user journeys to \
backend feasibility."

Given empathize research data, produce:
1. A Point-of-View statement: [User] needs [need] because [insight]
2. 3-5 How Might We questions
3. Hills (Who/What/Wow format)
4. Technical and business constraints
5. Measurable success metrics
6. Guardrails — what we will NOT do

{rag_context}

Respond ONLY with valid JSON matching this schema:
{{
  "pov_statement": "[User] needs [need] because [insight]",
  "hmw_questions": ["string — 3-5 How Might We questions"],
  "hills": [
    {{
      "who": "string",
      "what": "string",
      "wow": "string"
    }}
  ],
  "constraints": ["string — technical/business constraints"],
  "success_metrics": ["string — measurable outcomes"],
  "guardrails": ["string — what we will NOT do"]
}}

Do NOT include any text outside the JSON object. No markdown fences."""


def run_define(state: AgentState) -> dict:
    """Execute the Define stage."""
    empathize_data = state["empathize"]["data"]
    rag_chunks = retrieve("HMW questions How Might We IBM Hills POV statement problem definition")
    rag_context = format_rag_context(rag_chunks)

    system_prompt = DEFINE_SYSTEM_PROMPT.replace("{rag_context}", rag_context)
    user_message = (
        "Based on the following user research, define the problem:\n\n"
        + json.dumps(empathize_data, indent=2)
    )

    response = llm_call(
        system_prompt=system_prompt,
        user_message=user_message,
        prefer="claude",
        temperature=0.3,
        max_tokens=2048,
    )

    data = parse_json_response(response.text)

    stage_output: StageOutput = {
        "stage": "define",
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
        "stage": "define",
        "model": response.model,
        "tokens": response.tokens_used,
        "latency_ms": response.latency_ms,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }

    return {
        "define": stage_output,
        "current_stage": "define",
        "trace": [trace_entry],
        "total_tokens": state.get("total_tokens", 0) + response.tokens_used,
        "total_latency_ms": state.get("total_latency_ms", 0) + response.latency_ms,
    }


def _assess_confidence(data: dict) -> float:
    expected = ["pov_statement", "hmw_questions", "hills", "constraints", "success_metrics", "guardrails"]
    present = sum(1 for k in expected if data.get(k))
    return round(present / len(expected), 2)
