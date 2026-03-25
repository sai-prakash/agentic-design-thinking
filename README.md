# Agentic Design Co-Pilot

A multi-agent platform that implements the full **Design Thinking** cycle — turning a text prompt into a validated, accessible React component through 5 autonomous agent stages with human-in-the-loop approval at every gate.

**Not** "prompt → code." It's a visible, auditable, iterative design process where AI agents do the thinking and humans steer.

![Python](https://img.shields.io/badge/Python-3.11-blue)
![React](https://img.shields.io/badge/React-19-61DAFB)
![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688)
![LangGraph](https://img.shields.io/badge/LangGraph-0.2+-orange)

## How It Works

```
Prompt → Empathize → Define → Ideate → Prototype → Test → Validated Component
            ↑          ↑        ↑          ↑          ↑
         [Human]    [Human]  [Human]    [Human]    [Human]
         approve    approve  approve    approve    approve
```

Each stage: **RAG retrieve → LLM call → SSE stream → human review → approve/edit → next stage**

### The 5 Agent Stages

| # | Stage | LLM | What It Does |
|---|-------|-----|--------------|
| 1 | **Empathize** | Claude Sonnet | User needs, pain points, empathy map, persona |
| 2 | **Define** | Claude Sonnet | POV statement, HMW questions, Hills, constraints |
| 3 | **Ideate** | Gemini Flash | 3-5 design variants with SVG wireframes |
| 4 | **Prototype** | Gemini Flash | Self-contained React + TypeScript + Tailwind component |
| 5 | **Test** | Claude Sonnet | WCAG audit, UX evaluation, loop recommendations |

## Tech Stack

- **Backend**: FastAPI + LangGraph state machine + SSE streaming
- **Frontend**: React 19 + Vite + Zustand + Tailwind CSS + shadcn/ui
- **LLMs**: Claude Sonnet (reasoning stages) + Gemini Flash (generation stages)
- **RAG**: Chroma in-memory with `all-MiniLM-L6-v2` embeddings
- **Live Preview**: react-live for in-browser component rendering

## Project Structure

```
backend/
  app/
    main.py            # FastAPI app, SSE endpoints
    state.py           # AgentState + StageOutput TypedDicts
    graph.py           # LangGraph wiring, interrupt_before, conditional edges
    rag.py             # Chroma setup, embedding, retrieval
    llm.py             # LLM client configuration
    agents/
      empathize.py     # Claude — user research + empathy maps
      define.py        # Claude — POV, HMW questions, Hills
      ideate.py        # Gemini Flash — variant generation + SVG sketches
      prototype.py     # Gemini Flash — React+TS+Tailwind component
      test.py          # Claude — WCAG audit, UX evaluation
  knowledge/           # Markdown files for RAG

frontend/
  src/
    store/             # Zustand store mirroring backend AgentState
    components/
      canvas/          # Pipeline graph visualization
      stages/          # Per-stage output views
      panel/           # Side panel, approval bar, trace
      layout/          # Header, main layout, prompt input
    hooks/             # SSE connection, health check, inline edit
    lib/               # API client, utilities
```

## Getting Started

### Prerequisites

- Python 3.11+
- Node.js 18+
- [Anthropic API key](https://console.anthropic.com/)
- [Google AI API key](https://aistudio.google.com/apikey)

### Environment Variables

Create a `.env` file in the `backend/` directory:

```env
ANTHROPIC_API_KEY=your-anthropic-key
GOOGLE_AI_API_KEY=your-google-ai-key
```

### Run Locally

```bash
# Backend
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload

# Frontend (in another terminal)
cd frontend
npm install
npm run dev
```

The frontend runs on `http://localhost:5173` and the backend on `http://localhost:8000`.

## API Endpoints

```
POST /api/start                   # Start pipeline, returns session_id
GET  /api/stream/{session_id}     # SSE stream of agent events
POST /api/approve/{session_id}    # Resume after human approval
POST /api/edit/{session_id}       # Submit edits and resume
POST /api/loop_back/{session_id}  # Loop back to a specific stage
GET  /api/state/{session_id}      # Current full state (polling fallback)
```

## Deployment

- **Backend**: Render (Python + Docker)
- **Frontend**: Vercel (static Vite build)

Set `VITE_API_URL` in the frontend build environment to point to the deployed backend URL.

## License

MIT
