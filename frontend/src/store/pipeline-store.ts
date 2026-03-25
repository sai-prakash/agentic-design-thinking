import { create } from 'zustand';
import type { AgentState, SSEEvent, StageName, ChatMessage } from '../types';

interface PipelineState {
  // Session
  sessionId: string | null;
  isConnected: boolean;
  userPrompt: string;

  // Pipeline
  state: AgentState | null;
  events: SSEEvent[];
  selectedStage: StageName | null;

  // Chat
  chatMessages: ChatMessage[];

  // Actions
  setSessionId: (id: string | null) => void;
  setIsConnected: (connected: boolean) => void;
  setSelectedStage: (stage: StageName | null) => void;
  setUserPrompt: (prompt: string) => void;
  addChatMessage: (msg: Omit<ChatMessage, "id" | "timestamp">) => void;
  markReviewHandled: (stage: StageName) => void;
  handleSSEEvent: (event: SSEEvent) => void;
  approveStage: (stage: StageName) => Promise<void>;
  editStage: (stage: StageName, edits: Record<string, unknown>) => Promise<void>;
  loopBack: (targetStage: StageName) => Promise<void>;
  retryStage: () => Promise<void>;
  sendChatFeedback: (text: string) => Promise<void>;
  clearState: () => void;
}

const STAGE_ORDER: StageName[] = ["empathize", "define", "ideate", "prototype", "test"];

const STAGE_LABELS: Record<StageName, string> = {
  empathize: "Empathize",
  define: "Define",
  ideate: "Ideate",
  prototype: "Prototype",
  test: "Test",
};

let msgCounter = 0;
function nextId() {
  return `msg-${++msgCounter}-${Date.now()}`;
}

function makeChatMsg(partial: Omit<ChatMessage, "id" | "timestamp">): ChatMessage {
  return { ...partial, id: nextId(), timestamp: new Date().toISOString() };
}

export const usePipelineStore = create<PipelineState>((set, get) => ({
  sessionId: null,
  isConnected: false,
  userPrompt: "",
  state: null,
  events: [],
  selectedStage: null,
  chatMessages: [],

  setSessionId: (id) => set({ sessionId: id }),
  setIsConnected: (connected) => set({ isConnected: connected }),
  setSelectedStage: (stage) => set({ selectedStage: stage }),
  setUserPrompt: (prompt) => set({ userPrompt: prompt }),

  addChatMessage: (partial) =>
    set((prev) => ({ chatMessages: [...prev.chatMessages, makeChatMsg(partial)] })),

  markReviewHandled: (stage) =>
    set((prev) => ({
      chatMessages: prev.chatMessages.map((m) =>
        m.stage === stage && m.awaitingReview ? { ...m, awaitingReview: false } : m
      ),
    })),

  approveStage: async (stage) => {
    const { sessionId, state, markReviewHandled, addChatMessage } = get();
    if (!sessionId || !state) return;

    // Optimistic update
    set((prev) => {
      const newState = { ...prev.state! };
      if (newState[stage]) newState[stage]!.status = "approved";
      const nextIdx = STAGE_ORDER.indexOf(stage) + 1;
      if (nextIdx < STAGE_ORDER.length) {
        newState.current_stage = STAGE_ORDER[nextIdx];
      }
      return { state: newState };
    });

    markReviewHandled(stage);
    addChatMessage({ role: "user", content: `Approved **${STAGE_LABELS[stage]}** stage` });

    try {
      const res = await fetch(`/api/approve/${sessionId}`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to approve stage");
    } catch (err) {
      console.error("Approval failed:", err);
    }
  },

  editStage: async (stage, edits) => {
    const { sessionId, state, markReviewHandled, addChatMessage } = get();
    if (!sessionId || !state) return;

    set((prev) => {
      const newState = { ...prev.state! };
      if (newState[stage]) {
        newState[stage]!.data = { ...newState[stage]!.data, ...edits };
        newState[stage]!.status = "approved";
      }
      return { state: newState };
    });

    markReviewHandled(stage);
    addChatMessage({ role: "user", content: `Edited **${STAGE_LABELS[stage]}** stage and approved` });

    try {
      const res = await fetch(`/api/edit/${sessionId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ edits }),
      });
      if (!res.ok) throw new Error("Failed to edit stage");
    } catch (err) {
      console.error("Edit failed:", err);
    }
  },

  loopBack: async (targetStage) => {
    const { sessionId, state, addChatMessage } = get();
    if (!sessionId || !state) return;

    set((prev) => {
      const newState = { ...prev.state! };
      const targetIdx = STAGE_ORDER.indexOf(targetStage);
      for (let i = targetIdx; i < STAGE_ORDER.length; i++) {
        newState[STAGE_ORDER[i]] = null;
      }
      newState.current_stage = targetStage;
      newState.iteration_count += 1;
      return { state: newState, selectedStage: targetStage };
    });

    addChatMessage({
      role: "system",
      content: `Looping back to **${STAGE_LABELS[targetStage]}** (iteration ${get().state!.iteration_count + 1})`,
    });

    try {
      const res = await fetch(`/api/loop_back/${sessionId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target_stage: targetStage }),
      });
      if (!res.ok) throw new Error("Failed to loop back");
    } catch (err) {
      console.error("Loop back failed:", err);
    }
  },

  retryStage: async () => {
    const { sessionId, state, addChatMessage } = get();
    if (!sessionId || !state) return;

    const currentStage = state.current_stage as StageName;
    set((prev) => {
      const newState = { ...prev.state! };
      if (newState[currentStage]) {
        newState[currentStage]!.status = "running";
      }
      return { state: newState };
    });

    addChatMessage({ role: "system", content: `Retrying **${STAGE_LABELS[currentStage]}**...` });

    try {
      const res = await fetch(`/api/retry/${sessionId}`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to retry stage");
    } catch (err) {
      console.error("Retry failed:", err);
    }
  },

  sendChatFeedback: async (text) => {
    const { sessionId, state, addChatMessage } = get();
    if (!sessionId || !state) return;

    addChatMessage({ role: "user", content: text });

    // If a stage is awaiting review, send as edit feedback
    const currentStage = state.current_stage as StageName;
    const stageOutput = state[currentStage];
    if (stageOutput?.status === "awaiting_review") {
      try {
        const res = await fetch(`/api/edit/${sessionId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ edits: {}, feedback: text }),
        });
        if (!res.ok) throw new Error("Failed to send feedback");
      } catch (err) {
        console.error("Feedback failed:", err);
      }
    }
  },

  clearState: () =>
    set({
      sessionId: null,
      isConnected: false,
      userPrompt: "",
      state: null,
      events: [],
      selectedStage: null,
      chatMessages: [],
    }),

  handleSSEEvent: (event) =>
    set((prev) => {
      const newEvents = [...prev.events, event];
      let newState = prev.state ? { ...prev.state } : null;
      const newMessages = [...prev.chatMessages];

      if (!newState && event.type !== "pipeline_complete") {
        newState = {
          user_prompt: prev.userPrompt,
          current_stage: "empathize",
          iteration_count: 0,
          max_iterations: 3,
          loop_target: null,
          human_feedback: null,
          human_action: null,
          trace: [],
          total_tokens: 0,
          total_latency_ms: 0,
          empathize: null,
          define: null,
          ideate: null,
          prototype: null,
          test: null,
        };
      }

      if (!newState) return { events: newEvents };

      const addTrace = (
        type: string,
        stage: StageName,
        model = "system",
        tokens = 0,
        latency_ms = 0
      ) => {
        newState!.trace = [
          ...newState!.trace,
          { type, stage, timestamp: new Date().toISOString(), model, tokens, latency_ms },
        ];
      };

      switch (event.type) {
        case "stage_start":
          newState.current_stage = event.stage;
          newMessages.push(
            makeChatMsg({
              role: "agent",
              content: event.message || `Working on **${STAGE_LABELS[event.stage]}**...`,
              stage: event.stage,
            })
          );
          break;

        case "stage_complete":
          newState[event.stage] = event.data;
          newState.current_stage = event.stage;
          newState.total_tokens += event.data.tokens_used || 0;
          newState.total_latency_ms += event.data.latency_ms || 0;
          addTrace(
            "stage_complete",
            event.stage,
            event.data.llm_used,
            event.data.tokens_used || 0,
            event.data.latency_ms || 0
          );
          return {
            events: newEvents,
            state: newState,
            selectedStage: event.stage,
            chatMessages: newMessages,
          };

        case "awaiting_review":
          if (newState[event.stage]) {
            newState[event.stage]!.status = "awaiting_review";
          }
          newMessages.push(
            makeChatMsg({
              role: "agent",
              content: `**${STAGE_LABELS[event.stage]}** is ready for your review`,
              stage: event.stage,
              awaitingReview: true,
            })
          );
          break;

        case "stage_approved":
          if (newState[event.stage]) {
            newState[event.stage]!.status = "approved";
          }
          addTrace("human_approved", event.stage);
          break;

        case "stage_edited":
          if (newState[event.stage]) {
            newState[event.stage]!.data = { ...newState[event.stage]!.data, ...event.edits };
          }
          addTrace("human_edited", event.stage);
          break;

        case "loop_back": {
          const targetIdx = STAGE_ORDER.indexOf(event.target_stage);
          if (targetIdx !== -1) {
            for (let i = targetIdx; i < STAGE_ORDER.length; i++) {
              newState[STAGE_ORDER[i]] = null;
            }
          }
          newState.current_stage = event.target_stage;
          newState.iteration_count = event.iteration;
          addTrace("loop_back", event.from_stage);
          newMessages.push(
            makeChatMsg({
              role: "system",
              content: `Pipeline looping back to **${STAGE_LABELS[event.target_stage]}** (iteration ${event.iteration})`,
            })
          );
          break;
        }

        case "optimizer_suggestion":
          newMessages.push(
            makeChatMsg({
              role: "agent",
              content: `**Optimizer suggestion**: Loop back to **${STAGE_LABELS[event.target_stage]}** — ${event.reason}`,
              stage: event.target_stage,
            })
          );
          break;

        case "pipeline_complete":
          newState = event.final_state;
          newMessages.push(
            makeChatMsg({ role: "system", content: "Pipeline complete! All stages finished." })
          );
          break;

        case "error":
          if (newState[event.stage]) {
            newState[event.stage]!.status = "rejected";
          }
          addTrace("error", event.stage);
          newMessages.push(
            makeChatMsg({
              role: "agent",
              content: `Error in **${STAGE_LABELS[event.stage]}**: ${event.message}`,
              stage: event.stage,
            })
          );
          break;
      }

      return { events: newEvents, state: newState, chatMessages: newMessages };
    }),
}));
