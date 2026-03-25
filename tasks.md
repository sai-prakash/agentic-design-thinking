# Agentic Design Co-Pilot — Task Breakdown

> Generated from `spec.md` v1. Each task is self-contained with files, details, and acceptance criteria.

---

## Phase 1 (Day 1): Backend Skeleton + First Agent

### Task 1.1: FastAPI Project Scaffold

- [ ] **Description**: Set up the backend project structure with FastAPI, entry point, and folder layout.
- **Files to create**:
  - `backend/app/__init__.py`
  - `backend/app/main.py` — FastAPI app instance, CORS middleware, root health endpoint
  - `backend/app/agents/__init__.py`
  - `backend/app/state.py` — (placeholder, filled in Task 1.2)
  - `backend/app/graph.py` — (placeholder, filled in Task 1.3+)
  - `backend/app/rag.py` — (placeholder, filled in Phase 3)
  - `backend/requirements.txt` — fastapi, uvicorn, langchain, langgraph, anthropic, google-generativeai, chromadb, sentence-transformers, sse-starlette, pydantic
- **Details**:
  - FastAPI with `CORSMiddleware` allowing frontend origin (`http://localhost:5173` for dev)
  - Health check: `GET /api/health` → `{"status": "ok"}`
- **Acceptance criteria**: `uvicorn app.main:app --reload` starts without errors, `curl localhost:8000/api/health` returns 200.
- **Dependencies**: None

---

### Task 1.2: State Schema — AgentState + StageOutput

- [ ] **Description**: Implement the central state contract that every agent reads from and writes to.
- **Files to create/modify**:
  - `backend/app/state.py`
- **Details**:
  ```python
  class StageOutput(TypedDict):
      stage: Literal["empathize", "define", "ideate", "prototype", "test"]
      status: Literal["running", "awaiting_review", "approved", "rejected", "editing"]
      data: dict
      llm_used: str
      confidence: float
      suggestions: list[str]
      timestamp: str

  class AgentState(TypedDict):
      user_prompt: str
      empathize: Optional[StageOutput]
      define: Optional[StageOutput]
      ideate: Optional[StageOutput]
      prototype: Optional[StageOutput]
      test: Optional[StageOutput]
      current_stage: str
      iteration_count: int
      max_iterations: int          # default: 3
      loop_target: Optional[str]
      human_feedback: Optional[str]
      human_action: Optional[Literal["approve", "reject", "edit", "loop_back"]]
      trace: list[dict]
      total_tokens: int
      total_latency_ms: int
  ```
  - Flat stage keys (not a list) — enables `state["define"]` access from any node
  - `StageOutput` is uniform — same envelope for all stages, `data` field is stage-specific
  - `trace` is append-only audit log
- **Acceptance criteria**: Import `AgentState` and `StageOutput` from `app.state` without errors. Types are valid TypedDicts.
- **Dependencies**: Task 1.1

---

### Task 1.3: Empathize Agent + Claude Integration

- [ ] **Description**: Build the first agent (Empathize) with Claude Sonnet API integration.
- **Files to create/modify**:
  - `backend/app/agents/empathize.py`
- **Details**:
  - **LLM**: Claude Sonnet (`claude-sonnet-4-20250514`) via Anthropic API
  - **Temperature**: 0.3
  - **Input**: `state["user_prompt"]`
  - **System prompt**: Role as Empathize Agent + Stanford d.school Empathize stage + IBM "Focus on user outcomes" + output schema + RAG context placeholder
  - **Output `data` schema**:
    ```json
    {
      "user_needs": ["3-5 core needs"],
      "pain_points": ["3-5 frustrations"],
      "empathy_map": {
        "thinks": [], "feels": [], "says": [], "does": []
      },
      "persona": {
        "name": "", "role": "", "goals": [], "frustrations": []
      },
      "research_notes": "narrative summary"
    }
    ```
  - Agent follows standardized pattern: read state → (skip RAG for now) → build prompt → call LLM → return StageOutput
  - Parse JSON response, wrap in `StageOutput` with `stage="empathize"`, `status="awaiting_review"`, `llm_used="claude-sonnet"`, `confidence` from self-assessment
  - Handle API errors gracefully (try/except, populate error in trace)
- **Acceptance criteria**: Calling the empathize agent function with a test prompt returns a valid `StageOutput` with populated `data` matching the schema.
- **Dependencies**: Task 1.2

---

### Task 1.4: LangGraph Single-Node Graph + SSE Streaming Endpoint

- [ ] **Description**: Wire the Empathize agent into a LangGraph state machine and expose an SSE streaming endpoint.
- **Files to create/modify**:
  - `backend/app/graph.py` — LangGraph `StateGraph` with empathize node
  - `backend/app/main.py` — Add SSE + pipeline start endpoints
- **Details**:
  - **LangGraph setup**:
    - `StateGraph(AgentState)` with single node `empathize`
    - `interrupt_before=["empathize"]` (or `interrupt_after` — pause after agent runs for human review)
    - Compile graph with checkpointer (in-memory for now)
  - **API endpoints**:
    - `POST /api/start` — accepts `{"prompt": "..."}`, creates session, starts graph execution, returns `{"session_id": "..."}`
    - `GET /api/stream/{session_id}` — SSE endpoint streaming events
  - **SSE event types** (implement these first, expand later):
    ```typescript
    { type: "stage_start", stage: "empathize", message: "..." }
    { type: "stage_partial", stage: "empathize", partial: "..." }  // streaming text
    { type: "stage_complete", stage: "empathize", data: StageOutput }
    { type: "awaiting_review", stage: "empathize" }
    { type: "error", stage: "empathize", message: "..." }
    ```
  - Use `sse-starlette` or `StreamingResponse` with `text/event-stream` content type
  - Session management: in-memory dict mapping `session_id` → graph state/thread
- **Acceptance criteria**: `curl -N localhost:8000/api/stream/{id}` after starting a pipeline shows streaming SSE events including `stage_start`, `stage_complete`, and `awaiting_review` for the empathize stage.
- **Dependencies**: Task 1.3

---

### Task 1.5: Manual Verification — End-to-End Day 1

- [ ] **Description**: Verify the entire Day 1 stack works end-to-end.
- **Verification steps**:
  1. Start backend: `cd backend && uvicorn app.main:app --reload`
  2. Start pipeline: `curl -X POST localhost:8000/api/start -H "Content-Type: application/json" -d '{"prompt": "Design a dashboard for a busy project manager"}'`
  3. Stream results: `curl -N localhost:8000/api/stream/{session_id}`
  4. Verify SSE events arrive: `stage_start` → `stage_partial` (streaming) → `stage_complete` → `awaiting_review`
  5. Verify the `stage_complete` data contains valid empathize output (user_needs, pain_points, empathy_map, persona)
- **Ship check**: Can you hit an endpoint and get streaming JSON back? ✅
- **Dependencies**: Task 1.4

---

## Phase 2 (Day 2): Remaining Agents + Full Graph

### Task 2.1: Define Agent (Claude)

- [ ] **Description**: Build the Define agent — synthesis and framing of user research into actionable design direction.
- **Files to create**:
  - `backend/app/agents/define.py`
- **Details**:
  - **LLM**: Claude Sonnet, Temperature: 0.3
  - **Input**: `state["empathize"]["data"]`
  - **System prompt**: Role as Define Agent + Stanford Define + IBM Hills alignment + SAP "connect user journeys to backend feasibility"
  - **Output `data` schema**:
    ```json
    {
      "pov_statement": "[User] needs [need] because [insight]",
      "hmw_questions": ["3-5 How Might We questions"],
      "hills": [
        { "who": "", "what": "", "wow": "" }
      ],
      "constraints": ["technical/business constraints"],
      "success_metrics": ["measurable outcomes"],
      "guardrails": ["what we will NOT do"]
    }
    ```
  - Follow standardized agent pattern (same as empathize)
- **Acceptance criteria**: Given empathize output, returns valid `StageOutput` with `stage="define"` and populated data.
- **Dependencies**: Task 1.3 (agent pattern established)

---

### Task 2.2: Ideate Agent (Gemini Flash)

- [ ] **Description**: Build the Ideate agent — divergent design exploration generating multiple variants.
- **Files to create**:
  - `backend/app/agents/ideate.py`
- **Details**:
  - **LLM**: Gemini Flash (`gemini-2.0-flash`) via Google AI Studio API
  - **Temperature**: 0.7 (want diversity)
  - **Input**: `state["define"]["data"]`
  - **System prompt**: Role as Ideate Agent + Stanford Ideate "defer judgment, go for volume"
  - **Output `data` schema**:
    ```json
    {
      "variants": [
        {
          "id": "string",
          "name": "string",
          "description": "string",
          "approach": "how it solves the HMW",
          "sketch_svg": "simple SVG wireframe",
          "pros": [],
          "cons": []
        }
      ],
      "selected_variant": "id of recommended variant",
      "selection_rationale": "string"
    }
    ```
  - Target: 3-5 variants with simple SVG sketches
  - First Gemini integration — set up Google AI client, handle auth via `GOOGLE_AI_API_KEY`
- **Acceptance criteria**: Given define output, returns valid `StageOutput` with 3-5 variants, each with SVG sketches.
- **Dependencies**: Task 2.1

---

### Task 2.3: Prototype Agent (Gemini Flash)

- [ ] **Description**: Build the Prototype agent — generates a production-quality React component.
- **Files to create**:
  - `backend/app/agents/prototype.py`
- **Details**:
  - **LLM**: Gemini Flash, Temperature: 0.2 (want correctness)
  - **Input**: `state["ideate"]["data"]` (selected variant) + `state["define"]["data"]` (constraints)
  - **System prompt**: Role as Prototype Agent + Stanford "Build to Think" + IBM "Restless Reinvention"
  - **Critical constraints in prompt**:
    - Output must be a single self-contained React component
    - Use only inline Tailwind classes (no external CSS)
    - No imports — component runs in react-live
    - Must be accessible (ARIA labels, keyboard nav, semantic HTML)
    - Must handle empty/loading/error states
  - **Output `data` schema**:
    ```json
    {
      "component_code": "full React+TypeScript+Tailwind component",
      "component_name": "string",
      "props_interface": "TypeScript interface",
      "usage_example": "how to use the component",
      "dependencies": ["npm packages if any"],
      "design_decisions": ["why this implementation"]
    }
    ```
- **Acceptance criteria**: Given ideate output with selected variant, returns valid component code that could render in react-live (no imports, self-contained JSX).
- **Dependencies**: Task 2.2 (Gemini client already set up)

---

### Task 2.4: Test Agent (Claude)

- [ ] **Description**: Build the Test agent — evaluates the prototype against accessibility, UX, and design criteria.
- **Files to create**:
  - `backend/app/agents/test.py`
- **Details**:
  - **LLM**: Claude Sonnet, Temperature: 0.3
  - **Input**: `state["prototype"]["data"]` + `state["define"]["data"]` (success metrics)
  - **System prompt**: Role as Test Agent + Stanford Test "test to learn" + IBM Sponsor User validation
  - **Output `data` schema**:
    ```json
    {
      "wcag_audit": {
        "passed": ["rules that pass"],
        "failed": ["rules that fail"],
        "warnings": ["potential issues"],
        "score": 0.85
      },
      "performance_notes": ["code quality observations"],
      "ux_evaluation": {
        "meets_needs": "boolean + rationale",
        "matches_pov": "boolean + rationale",
        "hits_hills": "boolean + rationale"
      },
      "overall_score": 0.82,
      "verdict": "pass | fail | needs_iteration",
      "fix_suggestions": ["specific fixes"],
      "loop_recommendation": {
        "should_loop": true,
        "target_stage": "ideate",
        "reason": "string"
      }
    }
    ```
- **Acceptance criteria**: Given prototype output + define constraints, returns valid test results with WCAG audit, UX evaluation, verdict, and loop recommendation.
- **Dependencies**: Task 2.1

---

### Task 2.5: Wire All 5 Agents into LangGraph with Interrupts

- [ ] **Description**: Connect all 5 agents into a single LangGraph state machine with `interrupt_after` at each node.
- **Files to modify**:
  - `backend/app/graph.py`
- **Details**:
  - Graph flow: `empathize → define → ideate → prototype → test`
  - Each node is a function that calls its agent and writes `StageOutput` to state
  - `interrupt_after` on each node — pauses for human review after each stage completes
  - On resume: read `state["human_action"]` to decide next step
  - Update SSE streaming to emit events for all 5 stages
  - Each node should:
    1. Set `current_stage` in state
    2. Emit `stage_start` SSE event
    3. Run agent (with streaming partials via SSE)
    4. Write StageOutput to state
    5. Emit `stage_complete` + `awaiting_review`
- **Acceptance criteria**: Starting a pipeline runs through all 5 stages sequentially, pausing after each for human action. SSE stream shows all stages.
- **Dependencies**: Tasks 2.1–2.4

---

### Task 2.6: Optimizer Routing Logic (Conditional Edges)

- [ ] **Description**: Implement the optimizer/router — a conditional edge function after the Test stage that decides whether to loop back or end.
- **Files to modify**:
  - `backend/app/graph.py`
- **Details**:
  - **Not a full agent** — a LangGraph conditional edge function
  - Logic:
    1. If `test.data.verdict == "pass"` → END
    2. If `test.data.loop_recommendation.should_loop` → set `loop_target` → route to that stage
    3. If `iteration_count >= max_iterations` (default 3) → END with current best
    4. Human can override via manual "loop back" (handled in Phase 3)
  - Increment `iteration_count` on each loop
  - Add trace entry for routing decision
  - SSE event: `{ type: "loop_back", from: "test", to: "{target}", reason: "..." }` or `{ type: "pipeline_complete", final_state: {...} }`
- **Acceptance criteria**: After test stage, pipeline correctly routes — ends on pass, loops to target stage on fail (up to max_iterations), and sends appropriate SSE events.
- **Dependencies**: Task 2.5

---

### Task 2.7: Manual Verification — Full Pipeline End-to-End

- [ ] **Description**: Run the complete 5-stage pipeline via API and verify all stages execute.
- **Verification steps**:
  1. Start pipeline with a design prompt
  2. Stream SSE events — verify all 5 stages appear in sequence
  3. Verify each stage's output data matches expected schema
  4. Verify optimizer routes correctly (loop or end)
  5. Check trace log has entries for all actions
- **Ship check**: Full pipeline runs end-to-end via curl? ✅
- **Dependencies**: Task 2.6

---

## Phase 3 (Day 3): Human-in-the-Loop + RAG

### Task 3.1: HITL API Endpoints

- [ ] **Description**: Implement the approve, edit, and loop-back endpoints for human-in-the-loop control.
- **Files to modify**:
  - `backend/app/main.py`
- **Details**:
  - `POST /api/approve/{session_id}` — sets `human_action="approve"` in state, resumes graph
  - `POST /api/edit/{session_id}` — accepts `{"edits": {...}, "feedback": "..."}`, sets `human_action="edit"`, updates stage data, resumes graph
  - `POST /api/loop_back/{session_id}` — accepts `{"target_stage": "ideate"}`, sets `human_action="loop_back"` + `loop_target`, resumes graph
  - `GET /api/state/{session_id}` — returns current full `AgentState` (polling fallback)
  - All endpoints emit relevant SSE events (`stage_approved`, `loop_back`, etc.)
- **Acceptance criteria**: After pipeline pauses at `awaiting_review`, calling approve resumes to next stage. Edit modifies stage data and resumes. Loop-back routes to specified stage.
- **Dependencies**: Task 2.6

---

### Task 3.2: LangGraph Resume-from-Interrupt Wiring

- [ ] **Description**: Ensure LangGraph correctly resumes execution after human actions at interrupt points.
- **Files to modify**:
  - `backend/app/graph.py`
- **Details**:
  - After interrupt, graph must read `human_action` from state:
    - `"approve"` → proceed to next node
    - `"reject"` → re-run current node (with feedback injected)
    - `"edit"` → update current stage's data, proceed to next node
    - `"loop_back"` → route to `loop_target` node
  - Clear `human_action` and `human_feedback` after processing
  - Add conditional edges from each interrupt point based on `human_action`
- **Acceptance criteria**: All four human actions (approve, reject, edit, loop_back) correctly resume the graph and route to the expected next node.
- **Dependencies**: Task 3.1

---

### Task 3.3: Knowledge Base Documents

- [ ] **Description**: Create the 10 markdown knowledge files for RAG context.
- **Files to create**:
  - `backend/knowledge/wcag-2.1-aa-checklist.md` — Core WCAG 2.1 AA accessibility rules
  - `backend/knowledge/wcag-color-contrast.md` — Contrast ratio requirements
  - `backend/knowledge/wcag-keyboard-navigation.md` — Focus management rules
  - `backend/knowledge/react-component-patterns.md` — Common UI patterns (cards, modals, forms, tables, nav)
  - `backend/knowledge/tailwind-design-tokens.md` — Spacing, color, typography scales
  - `backend/knowledge/empathy-map-template.md` — Empathy map structure + examples
  - `backend/knowledge/hmw-question-patterns.md` — How-Might-We question frameworks
  - `backend/knowledge/ibm-hills-template.md` — Hills format (Who/What/Wow) + examples
  - `backend/knowledge/stanford-design-thinking.md` — 5-stage process summary
  - `backend/knowledge/ui-heuristics.md` — Nielsen's 10 usability heuristics
- **Details**: Each file should be 200-500 words, focused and chunking-friendly. Include concrete examples where possible.
- **Acceptance criteria**: All 10 files exist with substantive content relevant to their topic.
- **Dependencies**: None (can be done in parallel with Tasks 3.1–3.2)

---

### Task 3.4: Chroma In-Memory Setup + Embedding

- [ ] **Description**: Set up Chroma vector store with sentence-transformers embeddings, loaded at startup.
- **Files to create/modify**:
  - `backend/app/rag.py`
- **Details**:
  - **Embedding model**: `all-MiniLM-L6-v2` via `sentence-transformers` (free, local)
  - **Chroma**: In-memory collection, created at startup
  - On startup:
    1. Read all files from `knowledge/` directory
    2. Split into chunks (by section/paragraph, ~200-300 tokens each)
    3. Embed with `all-MiniLM-L6-v2`
    4. Insert into Chroma in-memory collection with metadata (source file, section)
  - Expose a `retrieve(query: str, n_results: int = 3) -> list[str]` function
  - ~10 documents, no persistence needed
- **Acceptance criteria**: At startup, Chroma loads all knowledge docs. `retrieve("WCAG color contrast")` returns relevant chunks from the accessibility files.
- **Dependencies**: Task 3.3

---

### Task 3.5: RAG Injection into Agent Prompts

- [ ] **Description**: Integrate RAG retrieval into each agent's prompt building.
- **Files to modify**:
  - `backend/app/agents/empathize.py` — retrieve persona templates, empathy map patterns
  - `backend/app/agents/define.py` — retrieve HMW question patterns, IBM Hills template
  - `backend/app/agents/ideate.py` — retrieve component patterns, design system tokens
  - `backend/app/agents/prototype.py` — retrieve Tailwind patterns, component templates
  - `backend/app/agents/test.py` — retrieve WCAG 2.1 AA checklist
- **Details**:
  - Each agent builds a query relevant to its stage
  - Retrieves top-3 chunks from Chroma
  - Injects chunks into system prompt under `{rag_context}` placeholder
- **Acceptance criteria**: Each agent's LLM call includes relevant RAG context in the system prompt. Verify by logging the full prompt and checking for injected knowledge content.
- **Dependencies**: Task 3.4

---

### Task 3.6: Manual Verification — HITL + RAG

- [ ] **Description**: Verify human-in-the-loop and RAG work end-to-end.
- **Verification steps**:
  1. Start pipeline, wait for empathize to complete (awaiting_review)
  2. Call approve → verify define stage starts
  3. After define completes, call edit with modified HMW questions → verify edits are applied and ideate starts with edited data
  4. After test completes, call loop_back to ideate → verify pipeline re-runs from ideate
  5. Check agent prompts include RAG context (log inspection)
- **Ship check**: Can you approve/edit via API and see pipeline resume? ✅
- **Dependencies**: Tasks 3.1–3.5

---

## Phase 4 (Day 4): Frontend — Layout + SSE Connection

### Task 4.1: Vite + React + Zustand + Tailwind + shadcn Scaffold

- [ ] **Description**: Set up the frontend project with all core dependencies.
- **Files to create**:
  - `frontend/` — full Vite React TypeScript project
  - `frontend/package.json` — react, zustand, tailwindcss, @shadcn/ui, lucide-react, react-live
  - `frontend/tailwind.config.js`
  - `frontend/tsconfig.json`
  - `frontend/vite.config.ts` — with API proxy to `localhost:8000`
  - `frontend/src/main.tsx`
  - `frontend/src/App.tsx`
  - `frontend/src/index.css` — Tailwind directives
- **Details**:
  - Vite 5.x + React 18.x + TypeScript
  - Tailwind CSS 3.x
  - shadcn/ui initialized with base components (Button, Card, Badge, Input, Textarea)
  - Lucide React for icons
  - react-live 4.x (installed, used in Phase 6)
  - Vite dev proxy: `/api` → `http://localhost:8000/api`
- **Acceptance criteria**: `npm run dev` starts without errors, shows a blank app page at `localhost:5173`.
- **Dependencies**: None

---

### Task 4.2: Zustand Store

- [ ] **Description**: Implement the Zustand store mirroring the backend AgentState.
- **Files to create**:
  - `frontend/src/store/designCopilotStore.ts`
  - `frontend/src/types/index.ts` — TypeScript types for StageOutput, AgentState, SSE events
- **Details**:
  ```typescript
  interface DesignCopilotStore {
    sessionId: string | null;
    userPrompt: string;
    stages: Record<StageName, StageOutput | null>;
    currentStage: StageName | null;
    iterationCount: number;

    // UI state
    selectedStage: StageName | null;
    isStreaming: boolean;
    graphLayout: GraphNode[];
    traceLog: TraceEntry[];

    // Actions
    startPipeline: (prompt: string) => void;
    approveStage: (stage: StageName) => void;
    editStage: (stage: StageName, edits: Partial<StageData>) => void;
    loopBack: (targetStage: StageName) => void;
    connectSSE: (sessionId: string) => void;
  }
  ```
  - `StageName = "empathize" | "define" | "ideate" | "prototype" | "test"`
  - Actions call backend API endpoints (`/api/start`, `/api/approve/{id}`, etc.)
  - `connectSSE` opens `EventSource` and updates store on each event
- **Acceptance criteria**: Store can be imported and used. Actions make correct API calls (verify with network tab).
- **Dependencies**: Task 4.1

---

### Task 4.3: SSE Connection Hook

- [ ] **Description**: Build a custom hook for connecting to the backend SSE stream and dispatching events to the Zustand store.
- **Files to create**:
  - `frontend/src/hooks/useEventSource.ts`
- **Details**:
  - Opens `EventSource` to `GET /api/stream/{sessionId}`
  - Parses incoming SSE events (JSON data field)
  - Maps event types to store updates:
    - `stage_start` → set `currentStage`, `isStreaming: true`
    - `stage_partial` → append to partial content for display
    - `stage_complete` → update `stages[stage]` with full StageOutput
    - `awaiting_review` → set stage status, `isStreaming: false`
    - `loop_back` → update `currentStage`, `iterationCount`
    - `pipeline_complete` → set all final state, `isStreaming: false`
    - `error` → display error state
    - `rate_limited` → show "retrying in Ns" message
    - `trace` → append to `traceLog`
  - Handle reconnection on disconnect
  - Clean up EventSource on unmount
- **Acceptance criteria**: Starting a pipeline from the frontend opens SSE connection and store updates in real-time as events arrive.
- **Dependencies**: Task 4.2

---

### Task 4.4: Prompt Input + Pipeline Trigger

- [ ] **Description**: Build the header with prompt input and start button that kicks off the pipeline.
- **Files to create**:
  - `frontend/src/components/Header.tsx`
- **Details**:
  - Text input (or textarea) for design prompt
  - "Start Design Process" button
  - On submit: calls `startPipeline(prompt)` store action → `POST /api/start` → receives `session_id` → `connectSSE(session_id)`
  - Disable input while pipeline is running
  - Show pipeline status (running/complete)
- **Acceptance criteria**: Type a prompt, click start, and the pipeline begins. SSE events start flowing into the store.
- **Dependencies**: Task 4.3

---

### Task 4.5: Basic Stage Cards (Vertical List)

- [ ] **Description**: Render stage outputs as a vertical list of cards (simple layout before canvas).
- **Files to create**:
  - `frontend/src/components/StageCard.tsx`
  - `frontend/src/components/StageList.tsx`
- **Details**:
  - One card per stage (5 cards stacked vertically)
  - Each card shows:
    - Stage name + status badge (running / awaiting review / approved / etc.)
    - Stage output data rendered as readable content (not raw JSON)
    - Streaming partial text while stage is running
  - Click a card to select/expand it
  - Color coding: green = approved, amber = awaiting review, blue = running, gray = pending
- **Acceptance criteria**: Type prompt, start pipeline, see stage cards appear and update in real-time as SSE events arrive.
- **Dependencies**: Task 4.4

---

### Task 4.6: Manual Verification — Frontend + SSE

- [ ] **Description**: Verify the frontend connects to backend and displays pipeline progress.
- **Verification steps**:
  1. Start backend: `cd backend && uvicorn app.main:app --reload`
  2. Start frontend: `cd frontend && npm run dev`
  3. Type a design prompt and click Start
  4. Watch stage cards appear as pipeline progresses
  5. Verify streaming text appears during each stage
  6. Verify status badges update correctly
- **Ship check**: Type prompt, see stages appear in UI? ✅
- **Dependencies**: Task 4.5

---

## Phase 5 (Day 5): Canvas Graph + Stage Cards

### Task 5.1: SVG Canvas with 5 Nodes + Edges

- [x] **Description**: Build the graph visualization — 5 nodes in a left-to-right pipeline layout with animated edges.
- **Files to create**:
  - `frontend/src/components/CanvasView/CanvasView.tsx`
  - `frontend/src/components/CanvasView/GraphNode.tsx`
  - `frontend/src/components/CanvasView/GraphEdge.tsx`
  - `frontend/src/components/CanvasView/LoopBackEdge.tsx`
- **Details**:
  - Pure SVG (no heavy library like react-flow for v1)
  - 5 nodes positioned left-to-right: Empathize → Define → Ideate → Prototype → Test
  - Each node: rounded rect with stage icon (Lucide) + name + status color
  - Edges: SVG `<path>` with animated dash pattern for active flow
  - Node states:
    - **Active**: glow/pulse animation
    - **Completed**: checkmark + green border
    - **Awaiting review**: amber pulse
    - **Pending**: gray/muted
  - Responsive sizing within the canvas area
- **Acceptance criteria**: Graph renders all 5 nodes with edges. Node colors update based on store state. Active node pulses.
- **Cut line**: If this takes more than 1 day, fall back to horizontal stepper component.
- **Dependencies**: Task 4.5

---

### Task 5.2: Node Click → Side Panel Interaction

- [ ] **Description**: Clicking a graph node opens the corresponding stage detail in the side panel.
- **Files to create/modify**:
  - `frontend/src/components/CanvasView/GraphNode.tsx` — add click handler
  - `frontend/src/components/SidePanel.tsx` — container for stage detail
  - `frontend/src/App.tsx` — grid layout: `grid-cols-[1fr_400px]`
- **Details**:
  - Left panel: CanvasView (graph)
  - Right panel: SidePanel (stage detail, 400px)
  - Clicking a node sets `selectedStage` in store → SidePanel shows that stage's card
  - Clicking active/awaiting node also supported (shows current progress)
- **Acceptance criteria**: Click a node, side panel shows that stage's output. Panel updates when different node is clicked.
- **Dependencies**: Task 5.1

---

### Task 5.3: Stage Card — Rendered JSON → Readable Format

- [ ] **Description**: Enhance stage cards to render structured JSON data as human-readable content.
- **Files to modify**:
  - `frontend/src/components/StageCard.tsx`
- **Details**:
  - Each stage's `data` is rendered with stage-specific formatting:
    - **Empathize**: User needs as bullet list, empathy map as 4-quadrant grid, persona card
    - **Define**: POV statement highlighted, HMW questions as numbered list, Hills as cards
    - **Ideate**: Variant cards with SVG previews, selected variant highlighted
    - **Prototype**: Code block with syntax highlighting, component name, props interface
    - **Test**: WCAG audit as pass/fail checklist, score gauge, verdict banner
  - Stage header: name + status badge + confidence score
  - Optimizer suggestions shown as a banner at the bottom
- **Acceptance criteria**: Each stage's data renders as readable, well-formatted content (not raw JSON).
- **Dependencies**: Task 5.2

---

### Task 5.4: Inline Edit Fields

- [ ] **Description**: Add editable fields on stage cards so humans can modify outputs before approving.
- **Files to create/modify**:
  - `frontend/src/components/InlineEditFields.tsx`
  - `frontend/src/components/StageCard.tsx`
- **Details**:
  - When stage is `awaiting_review`, show edit icons on key fields
  - Click edit → field becomes an input/textarea
  - Save edits → calls `editStage(stage, edits)` store action → `POST /api/edit/{session_id}`
  - Editable fields per stage:
    - Empathize: user_needs, pain_points, persona fields
    - Define: pov_statement, hmw_questions, constraints
    - Ideate: selected_variant (dropdown/radio), variant descriptions
    - Prototype: component_code (code editor)
    - Test: fix_suggestions, loop_recommendation.target_stage
- **Acceptance criteria**: Can edit fields on a card, save, and see the pipeline resume with edited data.
- **Dependencies**: Task 5.3

---

### Task 5.5: Approval Controls Wired to API

- [ ] **Description**: Add Approve / Reject / Loop Back buttons on each stage card, wired to backend.
- **Files to create/modify**:
  - `frontend/src/components/ApprovalControls.tsx`
  - `frontend/src/components/StageCard.tsx`
- **Details**:
  - Buttons shown only when stage status is `awaiting_review`
  - **Approve** → `POST /api/approve/{session_id}` → pipeline advances
  - **Reject** → re-runs current stage (with optional feedback textarea)
  - **Loop Back** → dropdown to select target stage → `POST /api/loop_back/{session_id}`
  - After action, buttons disappear, status badge updates
  - Loading state while waiting for backend to resume
- **Acceptance criteria**: Click Approve, pipeline advances to next stage. Click Loop Back to ideate, pipeline re-runs from ideate. All actions reflected in graph nodes and SSE events.
- **Dependencies**: Task 5.4

---

### Task 5.6: Manual Verification — Interactive Pipeline

- [ ] **Description**: Full interactive walkthrough of the pipeline.
- **Verification steps**:
  1. Enter prompt, start pipeline
  2. Watch graph animate through stages
  3. Click each node to inspect output in side panel
  4. Edit a field on the Define stage card, save
  5. Approve each stage, watch pipeline advance
  6. On Test stage, trigger a loop-back to Ideate
  7. Verify loop-back edge appears on graph
  8. Verify second iteration runs correctly
- **Ship check**: Visual graph, click to inspect, approve to advance? ✅
- **Dependencies**: Task 5.5

---

## Phase 6 (Day 6): Live Preview + Optimizer UX

### Task 6.1: react-live Integration

- [ ] **Description**: Add a live component preview panel that renders the Prototype stage's React component in real-time.
- **Files to create**:
  - `frontend/src/components/LivePreview/LivePreview.tsx`
- **Details**:
  - Uses `react-live` library:
    ```tsx
    <LiveProvider code={prototype.data.component_code}>
      <LivePreview />   // Rendered component
      <LiveEditor />    // Editable code
      <LiveError />     // Error display
    </LiveProvider>
    ```
  - Shows in side panel when Prototype stage is selected or completed
  - Code edits in LiveEditor update the preview in real-time
  - "Save Code Changes" button to push edits back to state via `editStage`
  - Handle invalid JSX gracefully (LiveError shows compilation errors)
- **Acceptance criteria**: After Prototype stage completes, live preview renders the generated component. Editing code in the editor updates the preview. Errors display clearly.
- **Dependencies**: Task 5.5

---

### Task 6.2: Optimizer Suggestion Banners

- [ ] **Description**: Display automatic loop-back recommendations from the Test agent as actionable banners.
- **Files to create**:
  - `frontend/src/components/OptimizerSuggestion.tsx`
- **Details**:
  - When SSE emits `optimizer_suggestion` event: show a banner on the relevant stage card
  - Banner content: "Optimizer recommends looping back to {target_stage}: {reason}"
  - Two buttons: "Accept Suggestion" (triggers loop-back) and "Dismiss"
  - Also shows on Test stage card when `loop_recommendation.should_loop` is true
  - Banner styled as an info/warning callout (amber background)
- **Acceptance criteria**: After Test stage, if optimizer recommends a loop, banner appears with the recommendation and accept/dismiss buttons work correctly.
- **Dependencies**: Task 5.5

---

### Task 6.3: Manual Loop-Back Button on Any Stage

- [ ] **Description**: Allow users to manually loop back from any completed stage, not just when suggested.
- **Files to modify**:
  - `frontend/src/components/ApprovalControls.tsx`
  - `frontend/src/components/StageCard.tsx`
- **Details**:
  - On any approved/completed stage card, show a "Re-run from here" button
  - Opens a dropdown to choose which stage to loop back to (only earlier stages)
  - Calls `POST /api/loop_back/{session_id}` with target stage
  - Re-entering a stage clears subsequent stage outputs in the store
- **Acceptance criteria**: On a completed stage, clicking "Re-run from here" triggers the pipeline to re-execute from that stage.
- **Dependencies**: Task 6.2

---

### Task 6.4: Loop-Back Edge Animation on Canvas

- [x] **Description**: Show dashed curved edges on the graph when a loop-back occurs.
- **Files to modify**:
  - `frontend/src/components/CanvasView/LoopBackEdge.tsx`
  - `frontend/src/components/CanvasView/CanvasView.tsx`
- **Details**:
  - When a loop-back occurs (store has `loop_target` set and `iterationCount > 0`):
    - Draw a dashed SVG `<path>` curving from the current stage back to the target stage
    - Arc above or below the main flow line
    - Animate with CSS dash-offset animation
    - Label with iteration number
  - Remove loop-back edge when iteration completes
- **Acceptance criteria**: When pipeline loops back, a visible dashed curve appears on the graph from current to target stage, animated.
- **Dependencies**: Task 6.3

---

### Task 6.5: Trace Panel

- [ ] **Description**: Add a collapsible audit log panel showing all agent actions, LLM calls, and human decisions.
- **Files to create**:
  - `frontend/src/components/TracePanel.tsx`
- **Details**:
  - Collapsible panel (below side panel or as a drawer)
  - Shows entries from `traceLog` in the store (populated by `trace` SSE events)
  - Each entry: timestamp + type (LLM call / human action / routing decision) + stage + summary
  - Color-coded by type
  - Auto-scrolls to latest entry
  - Toggle button: "Show Audit Log" / "Hide Audit Log"
  - Token count and latency totals at the top
- **Acceptance criteria**: Running a full pipeline populates the trace panel with all actions. Panel is collapsible. Shows token/latency totals.
- **Dependencies**: Task 4.3 (SSE trace events)

---

### Task 6.6: Manual Verification — Full Interactive Loop

- [ ] **Description**: Complete end-to-end interactive test with live preview and iteration.
- **Verification steps**:
  1. Enter a design prompt (e.g., "Design a task management card component")
  2. Approve through Empathize and Define stages
  3. Inspect Ideate variants, edit the selected variant
  4. Approve Ideate, wait for Prototype
  5. View live preview of generated component
  6. Edit code in live editor, verify preview updates
  7. Approve Prototype, wait for Test
  8. See optimizer suggestion banner if loop recommended
  9. Accept suggestion → verify loop-back animation on graph
  10. Verify second iteration improves the component
  11. Check trace panel has complete audit log
- **Ship check**: Full interactive loop — prompt → stages → approve → preview → iterate? ✅
- **Dependencies**: Tasks 6.1–6.5

---

## Phase 7 (Day 7): Deploy + Polish

### Task 7.1: Backend Deploy to Render

- [ ] **Description**: Deploy the FastAPI backend to Render free tier.
- **Files to create**:
  - `backend/Dockerfile` or `backend/render.yaml`
- **Details**:
  - Python 3.11 runtime
  - Environment variables: `ANTHROPIC_API_KEY`, `GOOGLE_AI_API_KEY`
  - Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
  - Chroma runs in-memory (no separate service)
  - Note: Free tier sleeps after 15 min inactivity. First request takes ~30s cold start.
  - CORS updated to allow Vercel frontend domain
- **Acceptance criteria**: Backend is live on Render URL. `curl {render-url}/api/health` returns 200.
- **Dependencies**: All backend tasks complete

---

### Task 7.2: Frontend Deploy to Vercel

- [ ] **Description**: Deploy the Vite React frontend to Vercel free tier.
- **Files to create/modify**:
  - `frontend/vercel.json` — with API proxy to Render backend OR
  - `frontend/.env.production` — `VITE_API_URL=https://{render-backend-url}`
- **Details**:
  - Vite build → static deploy
  - Configure `VITE_API_URL` environment variable in Vercel dashboard pointing to Render backend
  - Verify CORS is configured for the Vercel domain on the backend
- **Acceptance criteria**: Frontend is live on Vercel URL. Can load the app and see the UI.
- **Dependencies**: Task 7.1

---

### Task 7.3: Loading, Error, and Empty States

- [ ] **Description**: Polish all UI states for production quality.
- **Files to modify**:
  - Various frontend components
- **Details**:
  - **Loading states**: Skeleton loaders on stage cards while LLM is processing, spinner on buttons after click
  - **Error states**: Error banner if SSE disconnects, error card if an agent fails, retry button
  - **Empty states**: Friendly message before pipeline starts ("Enter a design prompt to begin"), empty side panel state
  - **Rate limit state**: "Agent thinking... (rate limit, retrying in Ns)" — honest, not broken
  - **Cold start state**: Warning banner if backend takes >5s to respond (Render cold start)
- **Acceptance criteria**: Every UI state has appropriate feedback. No blank screens, no unhandled errors.
- **Dependencies**: Task 7.2

---

### Task 7.4: Mobile Responsive

- [ ] **Description**: Ensure the UI works on smaller screens.
- **Files to modify**:
  - `frontend/src/App.tsx` — responsive grid
  - Various components — responsive adjustments
- **Details**:
  - On mobile (< 768px): side panel collapses to full-width below the graph
  - Graph view: horizontal scroll or simplified vertical layout
  - Stage cards: full-width, stacked
  - Live preview: full-width
  - Test on 375px (iPhone) and 768px (tablet)
- **Acceptance criteria**: App is usable on mobile — no overflow, no broken layout, all features accessible.
- **Dependencies**: Task 7.3

---

### Task 7.5: README + Demo Recording

- [ ] **Description**: Create project README and record a demo.
- **Files to create**:
  - `README.md`
- **Details**:
  - Concise README with:
    - Project title + one-line description
    - Screenshot or GIF of the running app
    - Live demo link (Vercel URL)
    - Architecture diagram (from spec)
    - Tech stack list
    - Local development setup instructions
    - What it proves (from spec §13)
  - Record a 2-minute demo video/GIF showing:
    - Entering a prompt
    - Watching agents work through stages
    - Editing a stage output
    - Viewing the live component preview
    - A loop-back iteration
- **Acceptance criteria**: README exists with live demo link. Demo video/GIF is recorded and linked.
- **Dependencies**: Tasks 7.1–7.4

---

### Task 7.6: Final Verification — Live Demo

- [ ] **Description**: End-to-end test on the deployed live app.
- **Verification steps**:
  1. Open Vercel URL in browser
  2. Enter a design prompt
  3. Watch full pipeline execute with graph animation
  4. Approve stages, edit outputs, trigger loop-back
  5. View live component preview
  6. Check trace panel
  7. Test on mobile
  8. Share URL with someone else — verify it works for them
- **Ship check**: Live URL that someone else can use? ✅
- **Dependencies**: Task 7.5
