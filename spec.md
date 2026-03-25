# Agentic Design Co-Pilot — Refined System Spec v1

> **Status**: Ready to build  
> **Author**: Sai Prakash  
> **Date**: March 2026  
> **Timeline**: 7 days to live demo  
> **Budget**: $0 (free tiers only)

---

## 1. What This Is

A multi-agent platform that implements the full **Agentic Design Thinking** cycle — turning a text prompt into a validated, accessible React component through 5 autonomous agent stages with human-in-the-loop approval at every gate.

**The differentiator**: This isn't "type prompt → get code." It's a visible, auditable, iterative design process where AI agents do the thinking and humans steer the decisions — with the ability to loop back to any previous stage.

**Primary audience**: Yourself — proving you can ship a complex, stateful AI system with production-grade orchestration.

---

## 2. Decisions Locked (Do Not Revisit)

| Decision | Choice | Rationale |
|---|---|---|
| Architecture | FastAPI backend + React frontend | Clean separation, best LangGraph DX |
| Orchestration | LangGraph only (no Google ADK) | ADK is redundant, adds complexity |
| Agent stages | All 5 Design Thinking stages | Full vision, standardized pattern |
| LLM strategy | Claude (reasoning) + Gemini Flash (generation) | Quality where it matters, speed elsewhere |
| Streaming | SSE from FastAPI | Simpler than WebSocket, sufficient for v1 |
| Loop-back | Auto-suggestions + manual override | Fullest demo of restless reinvention |
| RAG | Minimal — 10-20 markdown files in Chroma | Proves the pattern without KB curation |
| UI layout | Canvas with graph visualization | Most impressive, matches the agentic narrative |
| Live preview | react-live | Lighter than Sandpack, inline editing |
| Stage output | Hybrid JSON + readable cards with inline edit | Structured internally, human-readable externally |

---

## 3. Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    REACT FRONTEND                        │
│  ┌──────────┐  ┌──────────────┐  ┌───────────────────┐  │
│  │  Canvas   │  │  Stage Cards │  │  react-live       │  │
│  │  Graph    │  │  (edit/approve│  │  Preview Panel    │  │
│  │  View     │  │   per stage) │  │  (live component) │  │
│  └────┬─────┘  └──────┬───────┘  └───────────────────┘  │
│       │               │                                  │
│       └───────┬───────┘                                  │
│               │ Zustand store (single source of truth)   │
│               │                                          │
│          EventSource (SSE)  +  POST /approve, /edit      │
└──────────────────────────┬──────────────────────────────┘
                           │ HTTPS
┌──────────────────────────┴──────────────────────────────┐
│                   FASTAPI BACKEND                        │
│                                                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │              LangGraph State Machine                │  │
│  │                                                    │  │
│  │  [Empathize] → [Define] → [Ideate] → [Prototype]  │  │
│  │       ↑          ↑          ↑           ↓          │  │
│  │       └──────────┴──────────┴──── [Test] ──────→   │  │
│  │                                      ↓             │  │
│  │                              [Optimize/Route]      │  │
│  │                                                    │  │
│  │  Each node: LLM call → stream partial → INTERRUPT  │  │
│  │             → wait for human → resume              │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │ Claude API   │  │ Gemini API   │  │ Chroma       │   │
│  │ (Empathize,  │  │ (Ideate,     │  │ (WCAG rules, │   │
│  │  Define)     │  │  Prototype)  │  │  patterns)   │   │
│  └──────────────┘  └──────────────┘  └──────────────┘   │
└─────────────────────────────────────────────────────────┘
```

---

## 4. LangGraph State Schema

This is the **single most important design decision**. Every agent reads from and writes to this shared state. Get this wrong and nothing composes.

```python
from typing import TypedDict, Literal, Optional
from langgraph.graph import StateGraph

class StageOutput(TypedDict):
    """Every stage produces one of these. Standardized contract."""
    stage: Literal["empathize", "define", "ideate", "prototype", "test"]
    status: Literal["running", "awaiting_review", "approved", "rejected", "editing"]
    data: dict            # Stage-specific structured output (see §5)
    llm_used: str         # "claude-sonnet" or "gemini-flash"
    confidence: float     # 0-1, self-assessed by agent
    suggestions: list[str]  # What the optimizer might flag
    timestamp: str

class AgentState(TypedDict):
    """Root state flowing through the entire graph."""
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
    iteration_count: int          # How many times we've looped
    max_iterations: int           # Safety cap (default: 3)
    loop_target: Optional[str]    # If optimizer says "go back to ideate"
    
    # Human-in-the-loop
    human_feedback: Optional[str]  # Edit text from the human at any gate
    human_action: Optional[Literal["approve", "reject", "edit", "loop_back"]]
    
    # Trace / metrics
    trace: list[dict]              # Append-only log of every action
    total_tokens: int
    total_latency_ms: int
```

### Why this shape

- **Flat stage keys** (not a list): Makes it trivial to read `state["define"]` from any node. LangGraph reducers handle merge cleanly.
- **StageOutput is uniform**: Every stage produces the same envelope. The `data` field is stage-specific but the wrapper is identical. This means the frontend can render ANY stage with the same card component.
- **`loop_target`**: The optimizer writes this. The router reads it. Simple conditional edge.
- **`trace`**: Append-only audit log. Every LLM call, every human action, every routing decision goes here. This is what makes it "enterprise-auditable."

---

## 5. Stage Definitions — The 5 Agents

### Standardized pattern (every agent follows this exactly)

```
1. Read relevant prior state
2. Retrieve from Chroma if needed (RAG)
3. Build prompt with system context + prior outputs
4. Call LLM (Claude or Gemini)
5. Stream partial results via SSE
6. Write StageOutput to state
7. INTERRUPT — wait for human approval
8. On resume: read human_action, proceed or loop
```

### Stage 1: Empathize Agent
- **LLM**: Claude (needs nuanced reasoning about user needs)
- **Input**: `user_prompt`
- **RAG**: Retrieve relevant persona templates, empathy map patterns
- **Output `data` schema**:
```json
{
  "user_needs": ["string — 3-5 core needs"],
  "pain_points": ["string — 3-5 frustrations"],
  "empathy_map": {
    "thinks": ["..."],
    "feels": ["..."],
    "says": ["..."],
    "does": ["..."]
  },
  "persona": {
    "name": "string",
    "role": "string",
    "goals": ["..."],
    "frustrations": ["..."]
  },
  "research_notes": "string — narrative summary"
}
```
- **Design Thinking principle**: Stanford Empathize — immerse in user context. IBM "Focus on user outcomes."

### Stage 2: Define Agent
- **LLM**: Claude (synthesis + framing requires strong reasoning)
- **Input**: `empathize.data`
- **RAG**: Retrieve HMW question patterns, IBM Hills template
- **Output `data` schema**:
```json
{
  "pov_statement": "string — [User] needs [need] because [insight]",
  "hmw_questions": ["string — 3-5 How Might We questions"],
  "hills": [
    {
      "who": "string",
      "what": "string",
      "wow": "string"
    }
  ],
  "constraints": ["string — technical/business constraints"],
  "success_metrics": ["string — measurable outcomes"],
  "guardrails": ["string — what we will NOT do"]
}
```
- **Design Thinking principle**: Stanford Define + IBM Hills alignment. SAP "connect user journeys to backend feasibility."

### Stage 3: Ideate Agent
- **LLM**: Gemini Flash (fast generation, good at variants)
- **Input**: `define.data`
- **RAG**: Retrieve component patterns, design system tokens
- **Output `data` schema**:
```json
{
  "variants": [
    {
      "id": "string",
      "name": "string",
      "description": "string",
      "approach": "string — how it solves the HMW",
      "sketch_svg": "string — simple SVG wireframe",
      "pros": ["..."],
      "cons": ["..."]
    }
  ],
  "selected_variant": "string — id of recommended variant",
  "selection_rationale": "string"
}
```
- **Target**: 3-5 variants with simple SVG sketches
- **Design Thinking principle**: Stanford Ideate — diverge then converge. "Defer judgment, go for volume."

### Stage 4: Prototype Agent
- **LLM**: Gemini Flash (code generation, fast iteration)
- **Input**: `ideate.data` (selected variant) + `define.data` (constraints)
- **RAG**: Retrieve Tailwind patterns, component templates
- **Output `data` schema**:
```json
{
  "component_code": "string — full React+TypeScript+Tailwind component",
  "component_name": "string",
  "props_interface": "string — TypeScript interface",
  "usage_example": "string — how to use the component",
  "dependencies": ["string — npm packages needed"],
  "design_decisions": ["string — why this implementation"]
}
```
- **Critical**: Output must be valid JSX that react-live can render. No imports beyond what react-live provides.
- **Design Thinking principle**: Stanford Prototype — "build to think." IBM "Restless reinvention — treat as prototype."

### Stage 5: Test Agent
- **LLM**: Claude (needs careful evaluation reasoning)
- **Input**: `prototype.data` + `define.data` (success metrics)
- **RAG**: Retrieve WCAG 2.1 AA checklist
- **Output `data` schema**:
```json
{
  "wcag_audit": {
    "passed": ["string — rules that pass"],
    "failed": ["string — rules that fail"],
    "warnings": ["string — potential issues"],
    "score": 0.85
  },
  "performance_notes": ["string — code quality observations"],
  "ux_evaluation": {
    "meets_needs": "boolean + rationale",
    "matches_pov": "boolean + rationale",
    "hits_hills": "boolean + rationale"
  },
  "overall_score": 0.82,
  "verdict": "pass | fail | needs_iteration",
  "fix_suggestions": ["string — specific fixes"],
  "loop_recommendation": {
    "should_loop": true,
    "target_stage": "ideate",
    "reason": "string"
  }
}
```
- **Design Thinking principle**: Stanford Test — "test to learn." IBM Sponsor User validation.

### Stage 6: Optimizer / Router (not a human-facing stage)
- **Not a full agent** — a LangGraph conditional edge function
- **Logic**:
  1. If `test.data.verdict == "pass"` → END
  2. If `test.data.loop_recommendation.should_loop` → set `loop_target` → route to that stage
  3. If `iteration_count >= max_iterations` → END with current best
  4. Human can override any routing decision via manual "loop back" button
- **Design Thinking principle**: IBM "Restless reinvention." Continuous iteration until quality bar is met.

---

## 6. LLM Configuration

### Claude (Empathize, Define, Test)
- **Model**: `claude-sonnet-4-20250514` (via Anthropic API)
- **Free tier**: Check current limits — this is for reasoning stages, lower volume
- **System prompt pattern**: Role + Design Thinking principle + output schema + RAG context
- **Temperature**: 0.3 (want consistency in analysis)

### Gemini Flash (Ideate, Prototype)
- **Model**: `gemini-2.0-flash` (via Google AI Studio API)
- **Free tier**: 15 RPM, 1M TPM — generous for generation
- **System prompt pattern**: Role + constraints from Define stage + output schema
- **Temperature**: 0.7 for Ideate (want diversity), 0.2 for Prototype (want correctness)

### Rate limit handling
- Implement exponential backoff with jitter
- If rate limited, SSE sends `{"type": "rate_limited", "retry_after": N}` to frontend
- Frontend shows "Agent thinking... (rate limit, retrying in Ns)" — honest, not broken

---

## 7. RAG Layer — Minimal Chroma Setup

### Knowledge documents (create these as markdown files)

```
knowledge/
├── wcag-2.1-aa-checklist.md        # Core accessibility rules
├── wcag-color-contrast.md          # Contrast ratio requirements
├── wcag-keyboard-navigation.md     # Focus management rules
├── react-component-patterns.md     # Common UI patterns
├── tailwind-design-tokens.md       # Spacing, color, typography scales
├── empathy-map-template.md         # Empathy map structure + examples
├── hmw-question-patterns.md        # How-Might-We question frameworks
├── ibm-hills-template.md           # Hills format + examples
├── stanford-design-thinking.md     # 5-stage process summary
├── ui-heuristics.md                # Nielsen's heuristics for eval
```

### Embedding + retrieval
- **Embedding model**: `all-MiniLM-L6-v2` via sentence-transformers (free, local)
- **Chroma**: In-memory, loaded at startup. ~10 documents, no persistence needed.
- **Retrieval**: Top-3 chunks per agent query, injected into system prompt as context.

### Why this is sufficient for v1
Full RAG with curated KB is a separate project. These 10 files give agents grounded context for each stage without the curation overhead. You can always expand the KB later.

---

## 8. SSE Streaming Contract

### Event types (frontend listens for these)

```typescript
type SSEEvent =
  | { type: "stage_start"; stage: string; message: string }
  | { type: "stage_partial"; stage: string; partial: string }  // Streaming text
  | { type: "stage_complete"; stage: string; data: StageOutput }
  | { type: "awaiting_review"; stage: string }  // INTERRUPT — show approval UI
  | { type: "stage_approved"; stage: string }
  | { type: "loop_back"; from: string; to: string; reason: string }
  | { type: "optimizer_suggestion"; target_stage: string; reason: string }
  | { type: "pipeline_complete"; final_state: AgentState }
  | { type: "error"; stage: string; message: string }
  | { type: "rate_limited"; retry_after: number }
  | { type: "trace"; entry: TraceEntry }  // Real-time audit log
```

### Backend SSE endpoint

```
GET /api/stream/{session_id}     → SSE stream
POST /api/start                  → Start pipeline, returns session_id
POST /api/approve/{session_id}   → Resume after human approval
POST /api/edit/{session_id}      → Submit edits, resume
POST /api/loop_back/{session_id} → Manual loop to specific stage
GET  /api/state/{session_id}     → Current full state (polling fallback)
```

---

## 9. Frontend Architecture

### Zustand Store Shape

```typescript
interface DesignCopilotStore {
  // Pipeline state (mirrors backend AgentState)
  sessionId: string | null;
  userPrompt: string;
  stages: Record<StageName, StageOutput | null>;
  currentStage: StageName | null;
  iterationCount: number;
  
  // UI state
  selectedStage: StageName | null;   // Which card is expanded
  isStreaming: boolean;
  graphLayout: GraphNode[];          // Canvas node positions
  traceLog: TraceEntry[];
  
  // Actions
  startPipeline: (prompt: string) => void;
  approveStage: (stage: StageName) => void;
  editStage: (stage: StageName, edits: Partial<StageData>) => void;
  loopBack: (targetStage: StageName) => void;
  connectSSE: (sessionId: string) => void;
}
```

### Component Tree

```
<App>
  <Header />                          — Title + prompt input + start button
  <main className="grid grid-cols-[1fr_400px]">
    <CanvasView>                       — Left: graph visualization
      <GraphNode stage="empathize" />  — Clickable nodes
      <GraphNode stage="define" />
      <GraphNode stage="ideate" />
      <GraphNode stage="prototype" />
      <GraphNode stage="test" />
      <GraphEdge from="..." to="..." /> — Animated connections
      <LoopBackEdge />                 — Dashed line for iterations
    </CanvasView>
    <SidePanel>                        — Right: detail panel
      <StageCard stage={selectedStage}>
        <StageHeader />                — Stage name + status badge
        <StageOutput />                — Rendered data (JSON → cards)
        <InlineEditFields />           — Editable fields
        <ApprovalControls />           — Approve / Reject / Edit / Loop Back
        <OptimizerSuggestion />        — Auto-suggestion banner
      </StageCard>
      <LivePreview>                    — react-live panel (after Prototype)
        <LiveProvider code={...}>
          <LivePreview />
          <LiveEditor />
          <LiveError />
        </LiveProvider>
      </LivePreview>
      <TracePanel />                   — Collapsible audit log
    </SidePanel>
  </main>
```

### Canvas Graph Implementation
- Use **SVG** for the graph (not a heavy library like react-flow for v1)
- 5 nodes positioned in a left-to-right pipeline layout
- Each node: circle/rounded-rect with stage icon + name + status color
- Edges: SVG `<path>` with animated dash pattern for active flow
- Loop-back edges: dashed curves arcing back to earlier nodes
- Active node: glow/pulse animation
- Completed node: checkmark + green border
- Awaiting review: amber pulse

**CUT LINE**: If canvas graph takes more than 1 day, fall back to horizontal stepper. The graph is impressive but not load-bearing — the human-in-the-loop approval flow works with any layout.

---

## 10. Deployment

### Backend (Render free tier)
- Python 3.11 + FastAPI + uvicorn
- Single `Dockerfile` or `render.yaml`
- Environment vars: `ANTHROPIC_API_KEY`, `GOOGLE_AI_API_KEY`
- Chroma runs in-memory (no separate service)
- **Cold start warning**: Free tier sleeps after 15 min. First request takes ~30s.

### Frontend (Vercel free tier)
- Vite + React build → static deploy
- `vercel.json` with API proxy to Render backend
- Or: environment variable for `VITE_API_URL` pointing to Render

### One-command local dev
```bash
# Backend
cd backend && pip install -r requirements.txt && uvicorn app.main:app --reload

# Frontend
cd frontend && npm install && npm run dev
```

---

## 11. Build Order — Day by Day

This is the critical section. Follow this order. Do not skip ahead.

### Day 1: Backend skeleton + first agent
- [ ] FastAPI project scaffold (`app/main.py`, `app/agents/`, `app/state.py`)
- [ ] `AgentState` TypedDict + `StageOutput` schema
- [ ] LangGraph with single node: Empathize agent
- [ ] Claude API integration (Empathize prompt)
- [ ] SSE streaming endpoint (even if only one stage streams)
- [ ] Manual test: `curl` the SSE endpoint, see streaming empathize output
- **Ship check**: Can you hit an endpoint and get streaming JSON back? ✅

### Day 2: Remaining agents + full graph
- [ ] Define agent (Claude)
- [ ] Ideate agent (Gemini Flash)
- [ ] Prototype agent (Gemini Flash)
- [ ] Test agent (Claude)
- [ ] Wire all 5 into LangGraph with `interrupt_before` at each node
- [ ] Optimizer routing logic (conditional edges)
- [ ] Manual test: Run full pipeline via API, see all 5 stages complete
- **Ship check**: Full pipeline runs end-to-end via curl? ✅

### Day 3: Human-in-the-loop + RAG
- [ ] `/approve`, `/edit`, `/loop_back` endpoints
- [ ] LangGraph resume-from-interrupt wiring
- [ ] Create 10 knowledge markdown files
- [ ] Chroma in-memory setup + embedding at startup
- [ ] RAG retrieval injected into agent prompts
- **Ship check**: Can you approve/edit via API and see pipeline resume? ✅

### Day 4: Frontend — layout + SSE connection
- [ ] Vite + React + Zustand + Tailwind + shadcn scaffold
- [ ] Zustand store matching backend state
- [ ] SSE connection hook (`useEventSource`)
- [ ] Prompt input → start pipeline → see stages stream in
- [ ] Basic stage list (even if not canvas yet — vertical cards first)
- **Ship check**: Type prompt, see stages appear in UI? ✅

### Day 5: Frontend — canvas graph + stage cards
- [ ] SVG canvas with 5 nodes + edges
- [ ] Node click → side panel shows stage output
- [ ] Stage card with rendered JSON → readable format
- [ ] Inline edit fields on each card
- [ ] Approve / Reject / Loop Back buttons wired to API
- **Ship check**: Visual graph, click to inspect, approve to advance? ✅

### Day 6: Live preview + optimizer UX
- [ ] react-live integration in side panel (Prototype stage)
- [ ] Optimizer suggestion banners (auto "loop back to X" recommendations)
- [ ] Manual loop-back button on any stage
- [ ] Loop-back edge animation on canvas
- [ ] Trace panel (collapsible, shows audit log)
- **Ship check**: Full interactive loop — prompt → stages → approve → preview → iterate? ✅

### Day 7: Deploy + polish
- [ ] Render deploy (backend)
- [ ] Vercel deploy (frontend)
- [ ] Loading states, error handling, empty states
- [ ] Mobile-responsive check (side panel collapses)
- [ ] README.md (concise, with screenshot + live demo link)
- [ ] Record a 2-minute demo video/GIF
- **Ship check**: Live URL that someone else can use? ✅

---

## 12. Cut Lines (if behind schedule)

Ranked by what to drop first (least impact on demo):

1. **Canvas graph → horizontal stepper** (save 1 day, still works)
2. **RAG → bake principles into system prompts** (save half day, slightly worse output)
3. **Auto optimizer suggestions → manual loop-back only** (save half day, less impressive but functional)
4. **Inline edit → simple text area edit** (save 2-3 hours)
5. **Trace panel → console.log only** (save 2-3 hours)
6. **5 stages → 3 stages** (save 1 day, last resort — this is the vision)

**Never cut**: Human-in-the-loop approval, SSE streaming, LangGraph orchestration, react-live preview. These are the four pillars that make this a real agentic system, not a wrapper.

---

## 13. What This Proves When Shipped

- **Stateful multi-agent orchestration** with LangGraph (not chains, not simple pipelines)
- **Human-in-the-loop** at enterprise scale (interrupt/resume, edit gates, audit trail)
- **Dual-LLM strategy** (Claude for reasoning, Gemini for generation — cost-optimized)
- **A2UI streaming** (agents → real-time UI updates via SSE)
- **Domain expertise** (Design Thinking isn't bolted on — it's the architecture)
- **Actually ships** (live URL, not a README with "coming soon")

---

## 14. What v2 Looks Like (do NOT build this now)

- Google ADK as alternative orchestrator (A/B comparison)
- Full RAG with curated enterprise design system KB
- RAGAS evaluation framework per stage
- LangSmith / LangFuse tracing integration
- Multi-user sessions + persistent state (PostgreSQL)
- Multimodal input (upload sketch → vision model → pipeline)
- Export to Figma / Storybook
- Team collaboration (multiple humans reviewing same pipeline)

---

## Appendix A: Key Prompts (draft — refine during build)

### Empathize Agent System Prompt (Claude)
```
You are the Empathize Agent in an Agentic Design Thinking pipeline.

Your role: Deeply understand the user behind the design prompt. Channel Stanford 
d.school's Empathize stage — immerse yourself in the user's world. Apply IBM's 
principle of "Focus on user outcomes."

Given a design prompt, produce:
1. Core user needs (3-5)
2. Pain points and frustrations (3-5)
3. A complete empathy map (thinks/feels/says/does)
4. A primary persona with name, role, goals, frustrations
5. Research notes summarizing your understanding

Context from knowledge base:
{rag_context}

User prompt: {user_prompt}

Respond ONLY with valid JSON matching this schema: {schema}
```

### Prototype Agent System Prompt (Gemini Flash)
```
You are the Prototype Agent in an Agentic Design Thinking pipeline.

Your role: Generate a production-quality React component using TypeScript and 
Tailwind CSS. Channel Stanford's "Build to Think" and IBM's "Restless Reinvention."

CRITICAL CONSTRAINTS:
- Output must be a single self-contained React component
- Use only inline Tailwind classes (no external CSS)
- No imports — the component will run in react-live
- Must be accessible (ARIA labels, keyboard navigation, semantic HTML)
- Must handle empty/loading/error states

Design brief from Define stage:
{define_data}

Selected variant from Ideate stage:
{selected_variant}

Constraints:
{constraints}

Respond ONLY with valid JSON matching this schema: {schema}
```

---

## Appendix B: Tech Stack Manifest

| Layer | Technology | Version | Why |
|---|---|---|---|
| Frontend framework | React | 18.x | Stable, react-live compatible |
| Build tool | Vite | 5.x | Fast HMR, simple config |
| State management | Zustand | 4.x | Minimal boilerplate, SSE-friendly |
| Styling | Tailwind CSS | 3.x | Utility-first, matches generated output |
| UI components | shadcn/ui | latest | Accessible primitives, not a full library |
| Icons | Lucide React | latest | Consistent, tree-shakeable |
| Live preview | react-live | 4.x | Lighter than Sandpack |
| Backend framework | FastAPI | 0.110+ | Async-native, SSE support, fast |
| Orchestration | LangGraph | 0.2+ | Stateful graphs, interrupt/resume |
| LLM (reasoning) | Claude Sonnet | claude-sonnet-4-20250514 | Best reasoning quality |
| LLM (generation) | Gemini Flash | gemini-2.0-flash | Fast, generous free tier |
| Vector DB | Chroma | 0.5+ | In-memory, zero-config |
| Embeddings | all-MiniLM-L6-v2 | — | Local, free, fast |
| Deploy (backend) | Render | free tier | Python hosting, easy setup |
| Deploy (frontend) | Vercel | free tier | Static + edge, instant deploys |