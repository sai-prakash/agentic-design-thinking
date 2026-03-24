"""LangGraph state machine — full 5-stage Design Thinking pipeline.

Flow: empathize → define → ideate → prototype → test → optimizer (conditional)
Each node pauses via interrupt_after for human-in-the-loop review.
The optimizer routes to END or loops back to an earlier stage.
"""

from __future__ import annotations

from datetime import datetime, timezone

from langgraph.checkpoint.memory import MemorySaver
from langgraph.graph import END, StateGraph

from app.agents.define import run_define
from app.agents.empathize import run_empathize
from app.agents.ideate import run_ideate
from app.agents.prototype import run_prototype
from app.agents.test import run_test
from app.state import AgentState

STAGE_ORDER = ["empathize", "define", "ideate", "prototype", "test"]


def optimizer_route(state: AgentState) -> str:
    """Conditional edge after test — decide END or loop back."""
    test_output = state.get("test")
    if not test_output:
        return "__end__"

    test_data = test_output.get("data", {})
    verdict = test_data.get("verdict", "pass")
    loop_rec = test_data.get("loop_recommendation", {})
    iteration = state.get("iteration_count", 0)
    max_iter = state.get("max_iterations", 3)

    # Pass → done
    if verdict == "pass":
        return "__end__"

    # Max iterations reached → done with current best
    if iteration >= max_iter:
        return "__end__"

    # Loop back recommended
    if loop_rec.get("should_loop"):
        target = loop_rec.get("target_stage", "prototype")
        if target in STAGE_ORDER:
            return target

    # Default: if verdict is fail/needs_iteration but no loop target, go to prototype
    if verdict in ("fail", "needs_iteration"):
        return "prototype"

    return "__end__"


def build_graph():
    """Build and compile the full pipeline graph."""
    graph = StateGraph(AgentState)

    # Add all 5 stage nodes
    graph.add_node("empathize", run_empathize)
    graph.add_node("define", run_define)
    graph.add_node("ideate", run_ideate)
    graph.add_node("prototype", run_prototype)
    graph.add_node("test", run_test)

    # Linear flow: empathize → define → ideate → prototype → test
    graph.set_entry_point("empathize")
    graph.add_edge("empathize", "define")
    graph.add_edge("define", "ideate")
    graph.add_edge("ideate", "prototype")
    graph.add_edge("prototype", "test")

    # After test: conditional routing (optimizer)
    graph.add_conditional_edges(
        "test",
        optimizer_route,
        {
            "__end__": END,
            "empathize": "empathize",
            "define": "define",
            "ideate": "ideate",
            "prototype": "prototype",
        },
    )

    memory = MemorySaver()
    return graph.compile(
        checkpointer=memory,
        interrupt_after=STAGE_ORDER,
    )
