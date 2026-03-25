import { useState } from 'react';
import { Sparkles, ArrowRight, Zap } from 'lucide-react';
import { usePipelineStore } from '../store/pipeline-store';
import { useHealthCheck } from '../hooks/use-health-check';

const EXAMPLE_PROMPTS = [
  "Design a task management dashboard for remote teams",
  "Create an accessible pricing table for a SaaS product",
  "Build a meditation timer app for stressed professionals",
];

export function Landing() {
  const [prompt, setPrompt] = useState("");
  const [isStarting, setIsStarting] = useState(false);
  const { setSessionId, setUserPrompt, addChatMessage } = usePipelineStore();
  const { health } = useHealthCheck();

  const handleStart = async () => {
    const trimmed = prompt.trim();
    if (!trimmed || isStarting) return;

    setIsStarting(true);
    setUserPrompt(trimmed);
    addChatMessage({ role: "user", content: trimmed });

    try {
      const res = await fetch("/api/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: trimmed }),
      });
      if (!res.ok) throw new Error("Failed to start pipeline");
      const data = await res.json();
      setSessionId(data.session_id);
      addChatMessage({ role: "system", content: "Pipeline started — agents are warming up..." });
    } catch (err) {
      console.error("Start failed:", err);
      addChatMessage({ role: "system", content: "Failed to start pipeline. Is the backend running?" });
      setIsStarting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleStart();
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6">
      {/* Atmospheric background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-1/3 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-500/[0.04] blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 h-[400px] w-[400px] rounded-full bg-violet-500/[0.03] blur-[100px]" />
      </div>

      <div className="relative z-10 w-full max-w-2xl animate-slide-up-fade">
        {/* Logo area */}
        <div className="mb-10 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/80 px-3 py-1.5">
            <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
            <span className="font-display text-[11px] font-medium uppercase tracking-widest text-zinc-400">
              Agentic Design Co-Pilot
            </span>
          </div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-zinc-50 sm:text-4xl">
            What would you like to design?
          </h1>
          <p className="mt-3 font-body text-base text-zinc-500">
            5 AI agents. One auditable pipeline. Every decision — traceable, reviewable, reversible.
          </p>
        </div>

        {/* Example chips */}
        <div className="mb-4 flex flex-wrap justify-center gap-2">
          {EXAMPLE_PROMPTS.map((ex) => (
            <button
              key={ex}
              type="button"
              onClick={() => setPrompt(ex)}
              className="rounded-full border border-zinc-800 bg-zinc-900/60 px-3 py-1.5 font-body text-xs text-zinc-400 transition-all hover:border-zinc-600 hover:bg-zinc-800 hover:text-zinc-300 focus-visible:focus-ring"
            >
              {ex}
            </button>
          ))}
        </div>

        {/* Input area */}
        <div className="relative rounded-2xl border border-zinc-800 bg-zinc-900/80 p-1 shadow-2xl shadow-black/30 transition-all focus-within:border-indigo-500/50 focus-within:shadow-indigo-500/5">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe the component, page, or experience you want to build..."
            rows={3}
            disabled={isStarting}
            className="w-full resize-none rounded-xl bg-transparent px-4 py-3 font-body text-sm text-zinc-100 placeholder-zinc-600 outline-none disabled:opacity-50"
          />
          <div className="flex items-center justify-between px-3 pb-2">
            <div className="flex items-center gap-2">
              {health && (
                <span className="flex items-center gap-1.5 rounded-full bg-zinc-800/80 px-2 py-0.5">
                  <span className={`h-1.5 w-1.5 rounded-full ${health.status === "ok" ? "bg-emerald-400" : "bg-red-400"}`} />
                  <span className="font-display text-[10px] text-zinc-500">{health.llm_backend}</span>
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={handleStart}
              disabled={!prompt.trim() || isStarting}
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2 font-display text-xs font-bold uppercase tracking-wider text-white transition-all hover:bg-indigo-500 hover:shadow-lg hover:shadow-indigo-500/20 disabled:opacity-40 disabled:hover:bg-indigo-600 disabled:hover:shadow-none focus-visible:focus-ring"
            >
              {isStarting ? (
                <>
                  <Zap className="h-3.5 w-3.5 animate-pulse" />
                  Starting...
                </>
              ) : (
                <>
                  Start Design Process
                  <ArrowRight className="h-3.5 w-3.5" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Subtle footer */}
        <p className="mt-6 text-center font-body text-xs text-zinc-600">
          Empathize → Define → Ideate → Prototype → Test — with human approval at every gate
        </p>
      </div>
    </div>
  );
}
