"""Test full 5-stage pipeline using local Ollama (gemma3:4b).

Forces all agents to use Ollama by unsetting cloud API keys.
Run: PYTHONPATH=. .venv/bin/python test_ollama_pipeline.py
"""

import json
import os
import sys
import time

# Force Ollama-only by removing cloud keys
os.environ.pop("ANTHROPIC_API_KEY", None)
os.environ.pop("GOOGLE_AI_API_KEY", None)
os.environ["OLLAMA_BASE_URL"] = "http://localhost:11434"
os.environ["OLLAMA_MODEL"] = "gemma3:4b"

from dotenv import load_dotenv
# Don't load .env (it has GOOGLE_AI_API_KEY)

from app.llm import _has_ollama, _pick_backend, llm_call, parse_json_response

def test_ollama_connectivity():
    print("=" * 60)
    print("1. Testing Ollama connectivity")
    print("=" * 60)
    assert _has_ollama(), "Ollama not reachable at localhost:11434"
    backend = _pick_backend("ollama")
    assert backend == "ollama", f"Expected ollama, got {backend}"
    print("   OK — Ollama reachable, backend selected")

def test_simple_call():
    print("\n" + "=" * 60)
    print("2. Testing simple Ollama call")
    print("=" * 60)
    resp = llm_call(
        system_prompt="You are a helpful assistant. Respond with valid JSON only.",
        user_message='Return this JSON: {"status": "ok", "message": "hello"}',
        prefer="ollama",
        temperature=0.1,
        max_tokens=256,
    )
    print(f"   Model: {resp.model}")
    print(f"   Tokens: {resp.tokens_used}")
    print(f"   Latency: {resp.latency_ms}ms")
    print(f"   Response (first 200): {resp.text[:200]}")
    data = parse_json_response(resp.text)
    print(f"   Parsed JSON: {data}")
    print("   OK")

def test_stage(stage_name: str, run_fn, state: dict) -> dict:
    print(f"\n{'=' * 60}")
    print(f"Stage: {stage_name.upper()}")
    print(f"{'=' * 60}")
    start = time.time()
    try:
        result = run_fn(state)
        elapsed = time.time() - start
        stage_out = result[stage_name]
        print(f"   Status: {stage_out['status']}")
        print(f"   LLM: {stage_out['llm_used']}")
        print(f"   Confidence: {stage_out['confidence']}")
        print(f"   Time: {elapsed:.1f}s")
        data_keys = list(stage_out.get("data", {}).keys())
        print(f"   Data keys: {data_keys}")
        # Merge result into state
        state.update(result)
        print(f"   OK")
        return state
    except Exception as e:
        elapsed = time.time() - start
        print(f"   FAILED after {elapsed:.1f}s: {e}")
        raise

def run_full_pipeline():
    from app.agents.empathize import run_empathize
    from app.agents.define import run_define
    from app.agents.ideate import run_ideate
    from app.agents.prototype import run_prototype
    from app.agents.test import run_test

    prompt = "Design a simple task list component with add, complete, and delete functionality"

    state = {
        "user_prompt": prompt,
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

    stages = [
        ("empathize", run_empathize),
        ("define", run_define),
        ("ideate", run_ideate),
        ("prototype", run_prototype),
        ("test", run_test),
    ]

    total_start = time.time()
    for name, fn in stages:
        state = test_stage(name, fn, state)

    total_elapsed = time.time() - total_start
    print(f"\n{'=' * 60}")
    print(f"PIPELINE COMPLETE")
    print(f"{'=' * 60}")
    print(f"   Total time: {total_elapsed:.1f}s")
    print(f"   Total tokens: {state.get('total_tokens', 0)}")
    print(f"   Total latency: {state.get('total_latency_ms', 0)}ms")

    # Print verdict from test stage
    test_data = state["test"]["data"]
    print(f"   Verdict: {test_data.get('verdict', 'unknown')}")
    print(f"   Overall score: {test_data.get('overall_score', 'N/A')}")

    loop_rec = test_data.get("loop_recommendation", {})
    if loop_rec.get("should_loop"):
        print(f"   Loop suggestion: → {loop_rec.get('target_stage')} ({loop_rec.get('reason', '')})")
    else:
        print(f"   No loop needed — design passed!")

if __name__ == "__main__":
    print("Ollama Pipeline Test — gemma3:4b")
    print(f"Ollama URL: {os.environ['OLLAMA_BASE_URL']}")
    print(f"Model: {os.environ['OLLAMA_MODEL']}")
    print()

    test_ollama_connectivity()
    test_simple_call()

    print("\n" + "#" * 60)
    print("# FULL 5-STAGE PIPELINE")
    print("#" * 60)
    run_full_pipeline()
