import { usePipelineStore } from '../../store/pipeline-store';
import { RotateCcw, Sparkles } from 'lucide-react';
import { loopBack } from '../../lib/api';
import { useState } from 'react';

export function OptimizerBanner() {
  const { sessionId, state, selectedStage } = usePipelineStore();
  const [isLooping, setIsLooping] = useState(false);

  if (selectedStage !== "test" || !state?.test || !sessionId) return null;

  const recommendation = state?.test?.data?.loop_recommendation;
  if (!recommendation?.should_loop) return null;

  const handleLoop = async () => {
    try {
      setIsLooping(true);
      await loopBack(sessionId, recommendation.target_stage);
    } catch (error) {
      console.error("Failed to loop back:", error);
    } finally {
      setIsLooping(false);
    }
  };

  return (
    <div className="mx-5 mb-5 overflow-hidden rounded-xl border border-violet-500/30 bg-violet-500/5 p-4 animate-in fade-in slide-in-from-top-2 duration-500">
      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-500/20 text-violet-400">
          <Sparkles className="h-5 w-5" />
        </div>
        <div className="flex-1 space-y-1">
          <div className="flex items-center justify-between">
            <h4 className="font-display text-sm font-bold text-violet-100 italic">
              Optimizer Suggestion
            </h4>
            <span className="rounded bg-violet-500/20 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-violet-400">
              AI Recommendation
            </span>
          </div>
          <p className="font-body text-xs leading-relaxed text-[var(--text-secondary)]">
            {recommendation.reason}
          </p>
          <button
            onClick={handleLoop}
            disabled={isLooping}
            className="mt-3 flex items-center gap-2 rounded-lg bg-violet-600 px-3 py-1.5 text-[11px] font-bold text-white transition-all hover:bg-violet-500 hover:shadow-[0_0_15px_rgba(139,92,246,0.4)] disabled:opacity-50"
          >
            <RotateCcw className={`h-3 w-3 ${isLooping ? 'animate-spin' : ''}`} />
            Loop back to {recommendation.target_stage}
          </button>
        </div>
      </div>
    </div>
  );
}
