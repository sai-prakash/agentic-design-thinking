"""Prototype Agent — Stage 4 of the Design Thinking pipeline.

Generates a self-contained React+Tailwind component for react-live.
Prefers Gemini for fast code generation.
"""

from __future__ import annotations

import re
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
- Output must be a single self-contained React component.
- Use ONLY inline Tailwind classes (no external CSS).
- NO import or export statements — the component will run in a react-live environment where React is available globally.
- The component MUST be a single function declaration or arrow function.
- Name the component 'PrototypeComponent'.
- Use React.useState, React.useEffect, etc., prefixed with 'React.' (e.g., React.useState).
- Avoid any external libraries or custom hooks not provided.
- Must be fully accessible (ARIA labels, keyboard navigation, semantic HTML).
- Must handle empty/loading/error states gracefully.
- Use modern, premium aesthetics (good spacing, subtle shadows, clear typography).

{rag_context}

Respond ONLY with valid JSON matching this schema:
{{
  "component_code": "string — the full code for 'PrototypeComponent'. DO NOT include imports or exports. Just the function definition.",
  "component_name": "PrototypeComponent",
  "props_interface": "string — TypeScript interface for props",
  "usage_example": "string — <PrototypeComponent />",
  "dependencies": [],
  "design_decisions": ["string — explain key implementation choices"]
}}

Important: The component_code will be rendered as:
```tsx
{component_code}
render(<PrototypeComponent />);
```
So ensure the component name consistently matches 'PrototypeComponent'."""


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
        max_tokens=8192,
    )

    data = parse_json_response(response.text)

    # Robustly clean component_code for react-live
    code = data.get("component_code", "")
    if code:
        # Strip markdown fences
        code = re.sub(r"^```[a-z]*\s*", "", code, flags=re.MULTILINE | re.IGNORECASE)
        code = re.sub(r"```$", "", code, flags=re.MULTILINE | re.IGNORECASE)
        # Strip import statements (LLMs ignore the "no imports" instruction)
        code = re.sub(
            r"^\s*import\s+(?:[\s\S]*?\s+from\s+)?['\"][^'\"]*['\"];?\s*$",
            "", code, flags=re.MULTILINE,
        )
        # Strip export keywords (keep the declaration)
        code = re.sub(r"^\s*export\s+default\s+", "", code, flags=re.MULTILINE)
        code = re.sub(
            r"^\s*export\s+(?=(?:function|const|let|var|class)\s)",
            "", code, flags=re.MULTILINE,
        )
        # Strip standalone export lines
        code = re.sub(
            r"^\s*export\s+(?:default\s+\w+|\{[^}]*\})\s*;?\s*$",
            "", code, flags=re.MULTILINE,
        )
        # Enforce component name: rename whatever the LLM used to PrototypeComponent
        # This guarantees the react-live render(<PrototypeComponent />) call always works.
        # Match: function SomeName( or const SomeName = (  or const SomeName: ... = (
        fn_match = re.search(
            r"(?:^|\n)\s*function\s+([A-Z][A-Za-z0-9]*)\s*\(",
            code,
        )
        arrow_match = re.search(
            r"(?:^|\n)\s*(?:const|let|var)\s+([A-Z][A-Za-z0-9]*)\s*(?::[^=]*)?\s*=",
            code,
        )
        detected_name = (fn_match.group(1) if fn_match else None) or (
            arrow_match.group(1) if arrow_match else None
        )
        if detected_name and detected_name != "PrototypeComponent":
            # Replace all occurrences of the detected name with PrototypeComponent
            code = re.sub(
                rf"\b{re.escape(detected_name)}\b",
                "PrototypeComponent",
                code,
            )
            data["component_name"] = "PrototypeComponent"

        # Collapse excessive blank lines
        code = re.sub(r"\n{3,}", "\n\n", code)
        data["component_code"] = code.strip()

    stage_output: StageOutput = {
        "stage": "prototype",
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
    return float(f"{min(1.0, score):.2f}")
