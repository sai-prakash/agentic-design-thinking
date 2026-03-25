"""Central state schema for the Agentic Design Co-Pilot pipeline.

Every agent reads from and writes to AgentState. StageOutput is the
uniform envelope — the `data` field is stage-specific but the wrapper
is identical, so the frontend can render any stage with the same card.
"""

from __future__ import annotations

import operator
from typing import Annotated, Literal, Optional, TypedDict


StageName = Literal["empathize", "define", "ideate", "prototype", "test"]
StageStatus = Literal["running", "awaiting_review", "approved", "rejected", "editing"]
HumanAction = Literal["approve", "reject", "edit", "loop_back"]


class StageOutput(TypedDict):
    """Every stage produces one of these. Standardized contract."""

    stage: StageName
    status: StageStatus
    data: dict
    llm_used: str
    confidence: float
    suggestions: list[str]
    timestamp: str
    tokens_used: int
    latency_ms: int


class AgentState(TypedDict):
    """Root state flowing through the entire LangGraph."""

    # Input
    user_prompt: str

    # Per-stage outputs (populated as graph progresses)
    empathize: Optional[StageOutput]
    define: Optional[StageOutput]
    ideate: Optional[StageOutput]
    prototype: Optional[StageOutput]
    test: Optional[StageOutput]

    # Orchestration
    current_stage: str
    iteration_count: int
    max_iterations: int
    loop_target: Optional[str]

    # Human-in-the-loop
    human_feedback: Optional[str]
    human_action: Optional[HumanAction]

    # Trace / metrics  (append-only via reducer)
    trace: Annotated[list[dict], operator.add]
    total_tokens: int
    total_latency_ms: int
