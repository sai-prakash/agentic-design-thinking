# Agentic Design Co-Pilot

## Project Overview

Multi-agent platform implementing the full **Agentic Design Thinking** cycle — turns a text prompt into a validated, accessible React component through 5 autonomous agent stages with human-in-the-loop approval at every gate.

**Not** "prompt → code." It's a visible, auditable, iterative design process where AI agents do the thinking and humans steer.

## Architecture

- **Backend**: FastAPI (Python 3.11) + LangGraph state machine + SSE streaming
- **Frontend**: React 18 + Vite + Zustand + Tailwind CSS + shadcn/ui
- **Orchestration**: LangGraph only (no Google ADK)
- **LLMs**: Claude Sonnet (`claude-sonnet-4-20250514`) for reasoning stages + Gemini Flash (`gemini-2.0-flash`) for generation stages
- **RAG**: Chroma in-memory with `all-MiniLM-L6-v2` embeddings, ~10 markdown knowledge docs
- **Live Preview**: react-live (not Sandpack)
- **Streaming**: SSE from FastAPI (not WebSocket)

## Project Structure

```
backend/
  app/
    main.py              # FastAPI app, SSE endpoints
    state.py             # AgentState + StageOutput TypedDicts
    agents/              # One module per stage agent
      empathize.py       # Claude - user research + empathy maps
      define.py          # Claude - POV, HMW questions, Hills
      ideate.py          # Gemini Flash - variant generation + SVG sketches
      prototype.py       # Gemini Flash - React+TS+Tailwind component
      test.py            # Claude - WCAG audit, UX evaluation
    graph.py             # LangGraph wiring, interrupt_before, conditional edges
    rag.py               # Chroma setup, embedding, retrieval
  knowledge/             # 10 markdown files for RAG
  requirements.txt

frontend/
  src/
    store/               # Zustand store mirroring backend AgentState
    components/
      CanvasView/        # SVG graph visualization (5 nodes + edges)
      StageCard/         # Stage output display + inline edit + approval controls
      LivePreview/       # react-live panel for Prototype stage
      TracePanel/        # Collapsible audit log
    hooks/
      useEventSource.ts  # SSE connection hook
```

## The 5 Agent Stages

| Stage | Agent | LLM | Temperature | Purpose |
|-------|-------|-----|-------------|---------|
| 1. Empathize | empathize | Claude Sonnet | 0.3 | User needs, pain points, empathy map, persona |
| 2. Define | define | Claude Sonnet | 0.3 | POV statement, HMW questions, Hills, constraints |
| 3. Ideate | ideate | Gemini Flash | 0.7 | 3-5 design variants with SVG wireframes |
| 4. Prototype | prototype | Gemini Flash | 0.2 | Self-contained React+TS+Tailwind component |
| 5. Test | test | Claude Sonnet | 0.3 | WCAG audit, UX evaluation, loop recommendations |

Every stage follows: read state → RAG retrieve → build prompt → call LLM → stream via SSE → write StageOutput → INTERRUPT → wait for human → resume.

## State Schema (Central Contract)

`StageOutput` is the uniform envelope every agent produces. The `data` field is stage-specific but the wrapper is identical. The frontend renders ANY stage with the same card component.

`AgentState` has flat stage keys (`state["define"]` not a list), `loop_target` for optimizer routing, and an append-only `trace` for audit.

## API Endpoints

```
GET  /api/stream/{session_id}     # SSE stream
POST /api/start                   # Start pipeline, returns session_id
POST /api/approve/{session_id}    # Resume after human approval
POST /api/edit/{session_id}       # Submit edits, resume
POST /api/loop_back/{session_id}  # Manual loop to specific stage
GET  /api/state/{session_id}      # Current full state (polling fallback)
```

## Key Constraints

- Prototype output MUST be valid JSX that react-live can render — no imports beyond what react-live provides
- All components must be accessible (ARIA labels, keyboard nav, semantic HTML)
- Rate limit handling: exponential backoff with jitter, SSE reports `rate_limited` events
- Chroma runs in-memory at startup (no separate service, no persistence)
- Max 3 iterations per pipeline run (safety cap)

## LLM Assignment (Do Not Change)

- **Claude** = reasoning stages (Empathize, Define, Test) — needs nuanced analysis
- **Gemini Flash** = generation stages (Ideate, Prototype) — fast, generous free tier

## Environment Variables

- `ANTHROPIC_API_KEY` — Claude API access
- `GOOGLE_AI_API_KEY` — Gemini API access
- `VITE_API_URL` — Frontend → backend URL (for production)

## Local Development

```bash
# Backend
cd backend && pip install -r requirements.txt && uvicorn app.main:app --reload

# Frontend
cd frontend && npm install && npm run dev
```

## Deployment

- **Backend**: Render free tier (Python + Docker)
- **Frontend**: Vercel free tier (static Vite build)

## Cut Lines (ordered by what to drop first)

1. Canvas graph → horizontal stepper (save 1 day)
2. RAG → bake principles into system prompts (save half day)
3. Auto optimizer suggestions → manual loop-back only (save half day)
4. Inline edit → simple text area (save 2-3 hours)
5. Trace panel → console.log only (save 2-3 hours)
6. 5 stages → 3 stages (last resort)

**Never cut**: Human-in-the-loop approval, SSE streaming, LangGraph orchestration, react-live preview. These four pillars make it a real agentic system.

## Do NOT Build (v2 scope)

- Google ADK as alternative orchestrator
- Full RAG with curated enterprise KB
- RAGAS evaluation framework
- LangSmith/LangFuse tracing
- Multi-user sessions + PostgreSQL
- Multimodal input (sketch upload)
- Figma/Storybook export
- Team collaboration
