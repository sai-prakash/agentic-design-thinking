import { useState } from 'react';
import {
  Search, Target, Lightbulb, Code, ShieldCheck,
  CheckCircle, RotateCcw, Loader2,
} from 'lucide-react';
import { usePipelineStore } from '../../store/pipeline-store';
import { EmpathizeView } from '../stages/EmpathizeView';
import { DefineView } from '../stages/DefineView';
import { IdeateView } from '../stages/IdeateView';
import { PrototypeView } from '../stages/PrototypeView';
import { TestView } from '../stages/TestView';
import { OptimizerBanner } from '../panel/OptimizerBanner';
import type { StageName, StageOutput } from '../../types';

const STAGES: { name: StageName; label: string; role: string; icon: typeof Search }[] = [
  { name: "empathize", label: "Empathize", role: "UX Researcher", icon: Search },
  { name: "define", label: "Define", role: "Strategist", icon: Target },
  { name: "ideate", label: "Ideate", role: "Design Lead", icon: Lightbulb },
  { name: "prototype", label: "Prototype", role: "Dev Lead", icon: Code },
  { name: "test", label: "Test", role: "QA Lead", icon: ShieldCheck },
];

const STAGE_ORDER: StageName[] = ["empathize", "define", "ideate", "prototype", "test"];

function statusDot(status: string | undefined): string {
  switch (status) {
    case "running": return "bg-blue-500 shadow-[0_0_6px] shadow-blue-500/60";
    case "awaiting_review": return "bg-amber-500 shadow-[0_0_6px] shadow-amber-500/60";
    case "approved": return "bg-emerald-500";
    case "error": case "rejected": return "bg-red-500";
    default: return "bg-zinc-700";
  }
}

function StagePageContent({ stage, output }: { stage: StageName; output: StageOutput | null }) {
  if (!output) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="mb-3 h-12 w-12 rounded-full bg-zinc-800/50 flex items-center justify-center">
          {STAGES.find(s => s.name === stage)?.icon && (() => {
            const Icon = STAGES.find(s => s.name === stage)!.icon;
            return <Icon className="h-5 w-5 text-zinc-600" />;
          })()}
        </div>
        <p className="font-body text-sm text-zinc-600">
          Waiting for pipeline to reach this stage
        </p>
      </div>
    );
  }

  if (output.status === "running") {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="mb-4 h-8 w-8 animate-spin text-blue-500" />
        <p className="font-body text-sm text-zinc-400">
          {STAGES.find(s => s.name === stage)?.role} is working...
        </p>
        <div className="mt-3 flex gap-1">
          <span className="h-1.5 w-6 animate-pulse rounded-full bg-blue-500/30" />
          <span className="h-1.5 w-10 animate-pulse rounded-full bg-blue-500/20" style={{ animationDelay: "200ms" }} />
          <span className="h-1.5 w-4 animate-pulse rounded-full bg-blue-500/10" style={{ animationDelay: "400ms" }} />
        </div>
      </div>
    );
  }

  switch (stage) {
    case "empathize":
      return <EmpathizeView data={output.data as any} />;
    case "define":
      return <DefineView data={output.data as any} />;
    case "ideate":
      return <IdeateView data={output.data as any} />;
    case "prototype":
      return <PrototypeView data={output.data as any} />;
    case "test":
      return (
        <div className="space-y-6">
          <TestView data={output.data as any} />
          <OptimizerBanner />
        </div>
      );
    default:
      return null;
  }
}

// --- Floating Approval Bar ---

function FloatingApprovalBar({ stage }: { stage: StageName }) {
  const { approveStage, loopBack } = usePipelineStore();
  const [loading, setLoading] = useState<string | null>(null);

  const stageIdx = STAGE_ORDER.indexOf(stage);
  const priorStages = STAGES.slice(0, stageIdx);

  const handleApprove = async () => {
    setLoading("approve");
    await approveStage(stage);
    setLoading(null);
  };

  const handleLoop = async (target: StageName) => {
    setLoading("loop");
    await loopBack(target);
    setLoading(null);
  };

  return (
    <div className="border-t border-zinc-800 bg-zinc-950/95 backdrop-blur-sm px-6 py-3">
      <div className="flex items-center justify-between">
        <p className="font-body text-xs text-amber-400">
          Awaiting your review — edit fields inline above, then approve
        </p>
        <div className="flex items-center gap-2">
          {/* Loop back dropdown */}
          {priorStages.length > 0 && (
            <div className="relative group">
              <button
                type="button"
                disabled={loading !== null}
                className="flex items-center gap-1.5 rounded-lg border border-violet-700/50 px-3 py-1.5 font-display text-[10px] font-bold uppercase tracking-wider text-violet-400 transition-all hover:bg-violet-500/10 disabled:opacity-50 focus-visible:focus-ring"
              >
                <RotateCcw className={`h-3 w-3 ${loading === "loop" ? "animate-spin" : ""}`} />
                Loop Back
              </button>
              <div className="absolute bottom-full right-0 mb-1 hidden min-w-[140px] rounded-lg border border-zinc-700 bg-zinc-900 p-1 shadow-xl group-hover:block">
                {priorStages.map((s) => (
                  <button
                    key={s.name}
                    type="button"
                    onClick={() => handleLoop(s.name)}
                    className="flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-xs text-zinc-300 transition-colors hover:bg-zinc-800 focus-visible:focus-ring"
                  >
                    <s.icon className="h-3 w-3 text-zinc-500" />
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={handleApprove}
            disabled={loading !== null}
            className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-1.5 font-display text-[10px] font-bold uppercase tracking-wider text-white transition-all hover:bg-emerald-500 hover:shadow-lg hover:shadow-emerald-500/20 disabled:opacity-50 focus-visible:focus-ring"
          >
            <CheckCircle className={`h-3 w-3 ${loading === "approve" ? "animate-spin" : ""}`} />
            {loading === "approve" ? "Approving..." : "Approve"}
          </button>
        </div>
      </div>
    </div>
  );
}

// --- Main CanvasPages ---

export function CanvasPages() {
  const { state, selectedStage, setSelectedStage } = usePipelineStore();

  // Default to current stage or empathize
  const activeTab = selectedStage || state?.current_stage || "empathize";
  const activeOutput = state?.[activeTab] || null;
  const isAwaiting = activeOutput?.status === "awaiting_review";

  return (
    <div className="flex h-full flex-1 flex-col overflow-hidden bg-[var(--bg-base)]">
      {/* Tab bar */}
      <div className="flex shrink-0 items-center gap-0.5 border-b border-zinc-800/80 bg-zinc-950/60 px-2">
        {STAGES.map((s) => {
          const output = state?.[s.name];
          const isActive = activeTab === s.name;
          const isCurrent = state?.current_stage === s.name;
          const Icon = s.icon;

          return (
            <button
              key={s.name}
              type="button"
              onClick={() => setSelectedStage(s.name)}
              className={`
                relative flex items-center gap-2 px-4 py-2.5 transition-all
                ${isActive
                  ? "text-zinc-100 after:absolute after:bottom-0 after:left-2 after:right-2 after:h-[2px] after:rounded-full after:bg-indigo-500"
                  : "text-zinc-600 hover:text-zinc-400"
                }
                focus-visible:focus-ring rounded-t-md
              `}
            >
              <Icon className="h-3.5 w-3.5" />
              <span className="font-display text-[11px] font-medium uppercase tracking-wider">
                {s.label}
              </span>
              <span className={`h-1.5 w-1.5 rounded-full ${statusDot(output?.status)} ${isCurrent && output?.status === "running" ? "animate-pulse" : ""}`} />
            </button>
          );
        })}
      </div>

      {/* Page content */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-4xl px-6 py-8">
          {/* Stage header */}
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="font-display text-xl font-bold tracking-tight text-zinc-100">
                {STAGES.find(s => s.name === activeTab)?.label}
              </h2>
              <p className="mt-0.5 font-body text-xs text-zinc-500">
                {STAGES.find(s => s.name === activeTab)?.role}
                {activeOutput?.confidence != null && (
                  <span className="ml-2 font-mono text-[10px] text-zinc-600">
                    {Math.round(activeOutput.confidence * 100)}% confidence
                  </span>
                )}
              </p>
            </div>
            {activeOutput?.status && (
              <span className={`
                rounded-full px-3 py-1 font-display text-[10px] font-bold uppercase tracking-widest
                ${activeOutput.status === "approved" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : ""}
                ${activeOutput.status === "awaiting_review" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" : ""}
                ${activeOutput.status === "running" ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" : ""}
                ${activeOutput.status === "error" || activeOutput.status === "rejected" ? "bg-red-500/10 text-red-400 border border-red-500/20" : ""}
              `}>
                {activeOutput.status.replace("_", " ")}
              </span>
            )}
          </div>

          <StagePageContent stage={activeTab} output={activeOutput} />
        </div>
      </div>

      {/* Floating approval bar */}
      {isAwaiting && <FloatingApprovalBar stage={activeTab} />}
    </div>
  );
}
