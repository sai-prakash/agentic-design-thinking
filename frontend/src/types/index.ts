export type StageName = "empathize" | "define" | "ideate" | "prototype" | "test";

export interface StageOutput {
  stage: StageName;
  status: "running" | "awaiting_review" | "approved" | "rejected" | "editing" | "error";
  data: Record<string, any>;
  llm_used: string;
  confidence: number;
  suggestions: string[];
  timestamp: string;
  tokens_used: number;
  latency_ms: number;
}

export interface AgentState {
  user_prompt: string;
  current_stage: StageName;
  iteration_count: number;
  max_iterations: number;
  loop_target: string | null;
  human_feedback: string | null;
  human_action: string | null;
  trace: TraceEntry[];
  total_tokens: number;
  total_latency_ms: number;
  empathize: StageOutput | null;
  define: StageOutput | null;
  ideate: StageOutput | null;
  prototype: StageOutput | null;
  test: StageOutput | null;
}

export interface TraceEntry {
  type: string;
  timestamp: string;
  stage: StageName;
  model: string;
  tokens: number;
  latency_ms: number;
}

export type SSEEvent = 
  | { type: "stage_start"; stage: StageName; message: string }
  | { type: "stage_complete"; stage: StageName; data: StageOutput }
  | { type: "awaiting_review"; stage: StageName }
  | { type: "stage_approved"; stage: StageName }
  | { type: "stage_edited"; stage: StageName; edits: Record<string, any> }
  | { type: "loop_back"; from_stage: StageName; target_stage: StageName; iteration: number }
  | { type: "optimizer_suggestion"; target_stage: StageName; reason: string }
  | { type: "pipeline_complete"; final_state: AgentState }
  | { type: "error"; stage: StageName; message: string };

export interface HealthStatus {
  status: string;
  llm_backend: string;
  ollama_available?: boolean;
}

// Stage-specific data interfaces
export interface EmpathizeData {
  user_needs: string[];
  pain_points: string[];
  empathy_map: { thinks: string[]; feels: string[]; says: string[]; does: string[] };
  persona: { name: string; role: string; goals: string[]; frustrations: string[] };
  research_notes: string;
}

export interface DefineData {
  pov_statement: string;
  hmw_questions: string[];
  hills: { who: string; what: string; wow: string }[];
  constraints: string[];
  success_metrics: string[];
  guardrails: string[];
}

export interface IdeateData {
  variants: {
    id: string;
    name: string;
    description: string;
    approach: string;
    sketch_svg: string;
    pros: string[];
    cons: string[];
  }[];
  selected_variant: string;
  selection_rationale: string;
}

export interface PrototypeData {
  component_code: string;
  component_name: string;
  props_interface?: string;
  usage_example?: string;
  dependencies?: string[];
  design_decisions?: string[];
}

export interface TestData {
  wcag_audit: { passed: string[]; failed: string[]; warnings: string[]; score: number };
  performance_notes: string[];
  ux_evaluation: { meets_needs: string; matches_pov: string; hits_hills: string };
  overall_score: number;
  verdict: "pass" | "fail" | "needs_iteration";
  fix_suggestions: string[];
  loop_recommendation: { should_loop: boolean; target_stage: string; reason: string };
}

// Chat message types for the left panel
export type ChatMessageRole = "user" | "agent" | "system";

export interface ChatMessage {
  id: string;
  role: ChatMessageRole;
  content: string;
  timestamp: string;
  stage?: StageName;
  /** For agent messages: whether this stage needs approval */
  awaitingReview?: boolean;
}
