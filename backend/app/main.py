"""FastAPI application — SSE streaming + pipeline control endpoints.

Supports the full 5-stage Design Thinking pipeline with human-in-the-loop
approval at each stage gate.
"""

from __future__ import annotations

import asyncio
import copy
import json
import logging
import uuid
from typing import Any

from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sse_starlette.sse import EventSourceResponse

from app.graph import STAGE_ORDER, build_graph
from app.llm import _has_anthropic_key, _has_gemini_key, _has_ollama
from app.rag import init_rag

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(name)s] %(message)s")
logger = logging.getLogger("pipeline")

app = FastAPI(title="Agentic Design Co-Pilot", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

pipeline = build_graph()
init_rag()

sessions: dict[str, dict[str, Any]] = {}

STAGE_MESSAGES = {
    "empathize": "Analyzing user needs and building empathy map...",
    "define": "Synthesizing research into problem definition...",
    "ideate": "Generating design variants and wireframes...",
    "prototype": "Building React component prototype...",
    "test": "Evaluating accessibility, UX, and design quality...",
}


class StartRequest(BaseModel):
    prompt: str


class EditRequest(BaseModel):
    edits: dict
    feedback: str = ""


class LoopBackRequest(BaseModel):
    target_stage: str


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _thread_config(session_id: str) -> dict:
    return {"configurable": {"thread_id": session_id}}


def _snapshot_stages(state: dict | None) -> dict[str, str | None]:
    """Take a lightweight snapshot of stage timestamps for comparison."""
    if not state:
        return {s: None for s in STAGE_ORDER}
    return {
        s: state[s].get("timestamp") if state.get(s) else None
        for s in STAGE_ORDER
    }


def _find_new_stage(old_snap: dict[str, str | None], new_state: dict) -> str | None:
    """Compare snapshots to find which stage is newly completed."""
    for stage in STAGE_ORDER:
        new_out = new_state.get(stage)
        if new_out is None:
            continue
        new_ts = new_out.get("timestamp")
        old_ts = old_snap.get(stage)
        if new_ts != old_ts:
            return stage
    return None


STAGE_PROGRESS_MESSAGES = {
    "empathize": ["Researching user personas...", "Building empathy map...", "Identifying pain points..."],
    "define": ["Crafting POV statement...", "Generating HMW questions...", "Defining Hills..."],
    "ideate": ["Brainstorming variants...", "Sketching wireframes...", "Evaluating concepts..."],
    "prototype": ["Scaffolding component...", "Applying Tailwind styles...", "Adding accessibility attributes...", "Polishing interactions..."],
    "test": ["Running WCAG audit...", "Evaluating UX fit...", "Scoring overall quality..."],
}


async def _invoke_and_emit(session_id: str, input_state: dict | None, hint_stage: str | None = None) -> None:
    """Invoke the graph and emit SSE events for whatever stage completes."""
    session = sessions[session_id]
    events = session["events"]

    # Snapshot BEFORE invoke so we can diff
    old_snap = _snapshot_stages(session.get("state"))

    if hint_stage:
        logger.info(f"[{session_id[:8]}] Starting stage: {hint_stage}")
        events.append({
            "type": "stage_start",
            "stage": hint_stage,
            "message": STAGE_MESSAGES.get(hint_stage, "Processing..."),
        })

    # Emit progress heartbeats every 2s while the LLM call runs
    done = asyncio.Event()

    async def _progress_heartbeat():
        msgs = STAGE_PROGRESS_MESSAGES.get(hint_stage or "", ["Processing..."])
        idx = 0
        elapsed = 0
        while not done.is_set():
            await asyncio.sleep(2)
            if done.is_set():
                break
            elapsed += 2
            events.append({
                "type": "stage_progress",
                "stage": hint_stage or "unknown",
                "message": msgs[idx % len(msgs)],
                "elapsed_seconds": elapsed,
            })
            idx += 1

    progress_task = asyncio.create_task(_progress_heartbeat()) if hint_stage else None

    try:
        result = await asyncio.to_thread(
            pipeline.invoke,
            input_state,
            _thread_config(session_id),
        )
        done.set()
        session["state"] = result

        completed = _find_new_stage(old_snap, result)
        logger.info(f"[{session_id[:8]}] Invoke done. New stage: {completed}")

        if completed:
            stage_output = result[completed]
            events.append({"type": "stage_complete", "stage": completed, "data": stage_output})

            if completed == "test":
                test_data = stage_output.get("data", {})
                loop_rec = test_data.get("loop_recommendation", {})
                if loop_rec.get("should_loop"):
                    events.append({
                        "type": "optimizer_suggestion",
                        "target_stage": loop_rec.get("target_stage", "prototype"),
                        "reason": loop_rec.get("reason", ""),
                    })

            events.append({"type": "awaiting_review", "stage": completed})
            session["current_stage"] = completed
        else:
            logger.info(f"[{session_id[:8]}] No new stage — pipeline complete")
            events.append({"type": "pipeline_complete", "final_state": result})

    except Exception as e:
        done.set()
        stage = hint_stage or "unknown"
        logger.error(f"[{session_id[:8]}] Error in {stage}: {e}", exc_info=True)
        events.append({"type": "error", "stage": stage, "message": str(e)})
    finally:
        done.set()  # ensure heartbeat stops even on unexpected paths
        if progress_task:
            progress_task.cancel()


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@app.get("/api/health")
async def health():
    anthropic_ok = _has_anthropic_key()
    gemini_ok = _has_gemini_key()
    ollama_ok = _has_ollama()
    if anthropic_ok:
        llm_backend = "claude (primary)"
    elif gemini_ok:
        llm_backend = "gemini-2.5-flash (fallback)"
    elif ollama_ok:
        llm_backend = "ollama (local)"
    else:
        llm_backend = "none — set ANTHROPIC_API_KEY, GOOGLE_AI_API_KEY, or run Ollama"
    return {"status": "ok", "llm_backend": llm_backend, "ollama_available": ollama_ok}


@app.post("/api/start")
async def start_pipeline(req: StartRequest):
    session_id = str(uuid.uuid4())
    sessions[session_id] = {
        "thread_id": session_id,
        "events": [],
        "state": None,
        "current_stage": None,
    }

    initial_state = {
        "user_prompt": req.prompt,
        "empathize": None,
        "define": None,
        "ideate": None,
        "prototype": None,
        "test": None,
        "current_stage": "empathize",
        "iteration_count": 0,
        "max_iterations": 3,
        "loop_target": None,
        "human_feedback": None,
        "human_action": None,
        "trace": [],
        "total_tokens": 0,
        "total_latency_ms": 0,
    }

    logger.info(f"[{session_id[:8]}] Pipeline started: {req.prompt[:60]}")
    asyncio.create_task(_invoke_and_emit(session_id, initial_state, hint_stage="empathize"))
    return {"session_id": session_id}


@app.get("/api/stream/{session_id}")
async def stream_events(session_id: str):
    if session_id not in sessions:
        raise HTTPException(404, "Session not found")

    async def event_generator():
        cursor = 0
        while True:
            events = sessions[session_id]["events"]
            while cursor < len(events):
                evt = events[cursor]
                cursor += 1
                yield {"data": json.dumps(evt, default=str)}
                if evt["type"] in ("pipeline_complete", "error"):
                    return
            await asyncio.sleep(0.3)

    return EventSourceResponse(event_generator())


@app.post("/api/approve/{session_id}")
async def approve_stage(session_id: str):
    if session_id not in sessions:
        raise HTTPException(404, "Session not found")

    session = sessions[session_id]
    state = session.get("state")
    if not state:
        raise HTTPException(400, "Pipeline has not produced state yet")

    current = session.get("current_stage")
    if not current:
        raise HTTPException(400, "No stage awaiting approval")

    stage_output = state.get(current)
    if stage_output:
        stage_output["status"] = "approved"

    session["events"].append({"type": "stage_approved", "stage": current})
    logger.info(f"[{session_id[:8]}] Approved: {current}")

    # Determine what comes next
    idx = STAGE_ORDER.index(current) if current in STAGE_ORDER else -1
    next_stage = STAGE_ORDER[idx + 1] if idx + 1 < len(STAGE_ORDER) else None

    asyncio.create_task(_invoke_and_emit(session_id, None, hint_stage=next_stage))

    return {"status": "approved", "stage": current}


@app.post("/api/edit/{session_id}")
async def edit_stage(session_id: str, req: EditRequest):
    if session_id not in sessions:
        raise HTTPException(404, "Session not found")

    session = sessions[session_id]
    state = session.get("state")
    if not state:
        raise HTTPException(400, "Pipeline has not produced state yet")

    current = session.get("current_stage")
    if not current:
        raise HTTPException(400, "No stage awaiting review")

    # Apply edits to the current stage's data
    stage_output = state.get(current)
    if stage_output and "data" in stage_output:
        stage_output["data"].update(req.edits)
        stage_output["status"] = "approved"

    # Set human action so graph knows edits were made
    state["human_action"] = "edit"
    state["human_feedback"] = req.feedback

    session["events"].append({
        "type": "stage_edited",
        "stage": current,
        "edits": req.edits,
    })
    logger.info(f"[{session_id[:8]}] Edited: {current}")

    # Resume to next stage
    idx = STAGE_ORDER.index(current) if current in STAGE_ORDER else -1
    next_stage = STAGE_ORDER[idx + 1] if idx + 1 < len(STAGE_ORDER) else None

    asyncio.create_task(_invoke_and_emit(session_id, None, hint_stage=next_stage))

    return {"status": "edited", "stage": current}


@app.post("/api/loop_back/{session_id}")
async def loop_back(session_id: str, req: LoopBackRequest):
    if session_id not in sessions:
        raise HTTPException(404, "Session not found")

    session = sessions[session_id]
    state = session.get("state")
    if not state:
        raise HTTPException(400, "Pipeline has not produced state yet")

    target = req.target_stage
    if target not in STAGE_ORDER:
        raise HTTPException(400, f"Invalid target stage: {target}")

    current = session.get("current_stage")

    # Set loop state
    state["human_action"] = "loop_back"
    state["loop_target"] = target
    state["iteration_count"] = state.get("iteration_count", 0) + 1

    # Clear stages from target onward so they get regenerated
    target_idx = STAGE_ORDER.index(target)
    for s in STAGE_ORDER[target_idx:]:
        state[s] = None

    session["events"].append({
        "type": "loop_back",
        "from_stage": current,
        "target_stage": target,
        "iteration": state["iteration_count"],
    })
    logger.info(f"[{session_id[:8]}] Loop back: {current} → {target} (iter {state['iteration_count']})")

    # Re-invoke from the target stage
    asyncio.create_task(_invoke_and_emit(session_id, state, hint_stage=target))

    return {"status": "loop_back", "target_stage": target, "iteration": state["iteration_count"]}


@app.post("/api/retry/{session_id}")
async def retry_stage(session_id: str):
    if session_id not in sessions:
        raise HTTPException(404, "Session not found")

    session = sessions[session_id]
    state = session.get("state")
    if not state:
        raise HTTPException(400, "Pipeline has no state to retry")

    current = session.get("current_stage")
    if not current:
        raise HTTPException(400, "No active stage to retry")

    logger.info(f"[{session_id[:8]}] Retrying stage: {current}")
    session["events"].append({"type": "stage_start", "stage": current, "message": f"Retrying {current}..."})
    
    # Re-invoke the graph for the current stage
    asyncio.create_task(_invoke_and_emit(session_id, None, hint_stage=current))

    return {"status": "retrying", "stage": current}


@app.get("/api/state/{session_id}")
async def get_state(session_id: str):
    if session_id not in sessions:
        raise HTTPException(404, "Session not found")
    return {"state": sessions[session_id].get("state")}
