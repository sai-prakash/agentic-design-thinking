import { useState, useRef, useEffect } from 'react';
import { Send, CheckCircle, Pencil, Search, Target, Lightbulb, Code, ShieldCheck } from 'lucide-react';
import { usePipelineStore } from '../../store/pipeline-store';
import { TracePanel } from '../panel/TracePanel';
import type { ChatMessage, StageName } from '../../types';

const STAGE_ICONS: Record<StageName, typeof Search> = {
  empathize: Search,
  define: Target,
  ideate: Lightbulb,
  prototype: Code,
  test: ShieldCheck,
};

const STAGE_LABELS: Record<StageName, string> = {
  empathize: "Empathize",
  define: "Define",
  ideate: "Ideate",
  prototype: "Prototype",
  test: "Test",
};

function InlineApproval({ stage }: { stage: StageName }) {
  const { approveStage, setSelectedStage } = usePipelineStore();
  const [loading, setLoading] = useState(false);

  const handleApprove = async () => {
    setLoading(true);
    await approveStage(stage);
    setLoading(false);
  };

  return (
    <div className="mt-2 flex items-center gap-2">
      <button
        type="button"
        onClick={handleApprove}
        disabled={loading}
        className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 font-display text-[10px] font-bold uppercase tracking-wider text-white transition-all hover:bg-emerald-500 disabled:opacity-50 focus-visible:focus-ring"
      >
        <CheckCircle className="h-3 w-3" />
        {loading ? "Approving..." : "Approve"}
      </button>
      <button
        type="button"
        onClick={() => setSelectedStage(stage)}
        className="flex items-center gap-1.5 rounded-lg border border-zinc-700 px-3 py-1.5 font-display text-[10px] font-bold uppercase tracking-wider text-zinc-400 transition-all hover:border-zinc-500 hover:text-zinc-300 focus-visible:focus-ring"
      >
        <Pencil className="h-3 w-3" />
        View & Edit
      </button>
    </div>
  );
}

function MessageBubble({ msg }: { msg: ChatMessage }) {
  if (msg.role === "system") {
    return (
      <div className="flex justify-center py-1">
        <span className="rounded-full bg-zinc-800/60 px-3 py-1 font-body text-[11px] text-zinc-500">
          <span dangerouslySetInnerHTML={{ __html: renderMarkdownBold(msg.content) }} />
        </span>
      </div>
    );
  }

  if (msg.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-br-md bg-indigo-600/20 border border-indigo-500/20 px-4 py-2.5">
          <p className="font-body text-sm text-indigo-100">
            <span dangerouslySetInnerHTML={{ __html: renderMarkdownBold(msg.content) }} />
          </p>
          <span className="mt-1 block font-mono text-[9px] text-indigo-400/50">
            {formatTime(msg.timestamp)}
          </span>
        </div>
      </div>
    );
  }

  // Agent message
  const StageIcon = msg.stage ? STAGE_ICONS[msg.stage] : null;
  return (
    <div className="flex justify-start">
      <div className="max-w-[85%]">
        {msg.stage && (
          <div className="mb-1 flex items-center gap-1.5">
            {StageIcon && <StageIcon className="h-3 w-3 text-zinc-500" />}
            <span className="font-display text-[10px] font-bold uppercase tracking-widest text-zinc-600">
              {STAGE_LABELS[msg.stage]}
            </span>
          </div>
        )}
        <div className="rounded-2xl rounded-bl-md border border-zinc-800 bg-zinc-900/80 px-4 py-2.5">
          <p className="font-body text-sm text-zinc-300">
            <span dangerouslySetInnerHTML={{ __html: renderMarkdownBold(msg.content) }} />
          </p>
          <span className="mt-1 block font-mono text-[9px] text-zinc-600">
            {formatTime(msg.timestamp)}
          </span>
        </div>
        {msg.awaitingReview && msg.stage && <InlineApproval stage={msg.stage} />}
      </div>
    </div>
  );
}

function renderMarkdownBold(text: string): string {
  return text.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-zinc-100">$1</strong>');
}

function formatTime(ts: string): string {
  try {
    return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

export function ChatPanel() {
  const { chatMessages, state, sendChatFeedback } = usePipelineStore();
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatMessages.length]);

  const currentStage = state?.current_stage as StageName | undefined;
  const isAwaiting = currentStage ? state?.[currentStage]?.status === "awaiting_review" : false;

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    setInput("");
    sendChatFeedback(trimmed);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const placeholder = isAwaiting
    ? `Feedback for ${STAGE_LABELS[currentStage!]}... (Enter to send as edit)`
    : "Send a message...";

  return (
    <aside className="flex h-full w-[380px] shrink-0 flex-col border-r border-zinc-800/80 bg-zinc-950">
      {/* Chat header */}
      <div className="flex h-11 shrink-0 items-center border-b border-zinc-800/60 px-4">
        <h2 className="font-display text-[11px] font-bold uppercase tracking-widest text-zinc-500">
          Design Thread
        </h2>
        {state && (
          <span className="ml-auto font-mono text-[10px] text-zinc-700">
            {chatMessages.length} messages
          </span>
        )}
      </div>

      {/* Message thread */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-3 py-4"
      >
        <div className="flex flex-col gap-3">
          {chatMessages.map((msg) => (
            <MessageBubble key={msg.id} msg={msg} />
          ))}

          {/* Running indicator */}
          {currentStage && state?.[currentStage]?.status === "running" && (
            <div className="flex justify-start">
              <div className="rounded-2xl rounded-bl-md border border-zinc-800 bg-zinc-900/80 px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse" />
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse" style={{ animationDelay: "150ms" }} />
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse" style={{ animationDelay: "300ms" }} />
                  </div>
                  <span className="font-body text-xs text-zinc-500">
                    {STAGE_LABELS[currentStage]} agent working...
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Trace / Audit Log (collapsible) */}
      <TracePanel />

      {/* Input bar */}
      <div className="shrink-0 border-t border-zinc-800/60 p-3">
        <div className="flex items-end gap-2 rounded-xl border border-zinc-800 bg-zinc-900/60 p-1.5 transition-all focus-within:border-zinc-600">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            rows={1}
            className="flex-1 resize-none bg-transparent px-2 py-1.5 font-body text-sm text-zinc-200 placeholder-zinc-600 outline-none"
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={!input.trim()}
            className="rounded-lg bg-indigo-600 p-2 text-white transition-all hover:bg-indigo-500 disabled:opacity-30 disabled:hover:bg-indigo-600 focus-visible:focus-ring"
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
