import { Sparkles, Plus } from 'lucide-react';
import { usePipelineStore } from '../../store/pipeline-store';
import { useHealthCheck } from '../../hooks/use-health-check';
import type { StageName } from '../../types';

const STAGES: { name: StageName; label: string }[] = [
  { name: "empathize", label: "E" },
  { name: "define", label: "D" },
  { name: "ideate", label: "I" },
  { name: "prototype", label: "P" },
  { name: "test", label: "T" },
];

function statusColor(status: string | undefined): string {
  switch (status) {
    case "running": return "bg-blue-500 shadow-blue-500/50 shadow-[0_0_6px]";
    case "awaiting_review": return "bg-amber-500 shadow-amber-500/50 shadow-[0_0_6px]";
    case "approved": return "bg-emerald-500";
    case "error": case "rejected": return "bg-red-500";
    default: return "bg-zinc-700";
  }
}

export function WorkspaceTopBar() {
  const { state, selectedStage, setSelectedStage, clearState } = usePipelineStore();
  const { health } = useHealthCheck();

  return (
    <header className="flex h-12 shrink-0 items-center justify-between border-b border-zinc-800/80 bg-zinc-950/90 px-4 backdrop-blur-sm">
      {/* Left: logo */}
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-indigo-400" />
        <span className="font-display text-xs font-semibold tracking-wide text-zinc-300">
          Design Co-Pilot
        </span>
      </div>

      {/* Center: mini pipeline dots */}
      <nav className="flex items-center gap-1" role="tablist" aria-label="Pipeline stages">
        {STAGES.map((s, i) => {
          const stageOutput = state?.[s.name];
          const status = stageOutput?.status;
          const isCurrent = state?.current_stage === s.name;
          const isSelected = selectedStage === s.name;

          return (
            <div key={s.name} className="flex items-center">
              <button
                type="button"
                role="tab"
                aria-selected={isSelected}
                aria-label={`${s.name} stage — ${status || "idle"}`}
                onClick={() => setSelectedStage(s.name)}
                className={`
                  group relative flex h-7 items-center gap-1.5 rounded-md px-2 transition-all
                  ${isSelected ? "bg-zinc-800" : "hover:bg-zinc-800/60"}
                  focus-visible:focus-ring
                `}
              >
                <span className={`h-2 w-2 rounded-full transition-all ${statusColor(status)} ${isCurrent && status === "running" ? "animate-pulse" : ""}`} />
                <span className={`font-display text-[10px] font-bold uppercase tracking-widest ${isSelected ? "text-zinc-200" : "text-zinc-500 group-hover:text-zinc-400"}`}>
                  {s.label}
                </span>
              </button>
              {i < STAGES.length - 1 && (
                <div className={`mx-0.5 h-px w-3 ${stageOutput?.status === "approved" ? "bg-emerald-600" : "bg-zinc-800"}`} />
              )}
            </div>
          );
        })}
      </nav>

      {/* Right: health + new */}
      <div className="flex items-center gap-3">
        {health && (
          <span className="flex items-center gap-1.5">
            <span className={`h-1.5 w-1.5 rounded-full ${health.status === "ok" ? "bg-emerald-400" : "bg-red-400"}`} />
            <span className="font-display text-[10px] text-zinc-600">{health.llm_backend}</span>
          </span>
        )}
        <button
          type="button"
          onClick={clearState}
          className="flex items-center gap-1 rounded-md border border-zinc-800 px-2 py-1 font-display text-[10px] font-medium uppercase tracking-wider text-zinc-500 transition-all hover:border-zinc-600 hover:text-zinc-300 focus-visible:focus-ring"
        >
          <Plus className="h-3 w-3" />
          New
        </button>
      </div>
    </header>
  );
}
