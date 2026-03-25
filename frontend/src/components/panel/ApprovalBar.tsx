import { useState } from 'react';
import { usePipelineStore } from '../../store/pipeline-store';
import { Check, Edit2, RotateCcw, Loader2, RefreshCw } from 'lucide-react';
import type { StageName } from '../../types';

const STAGE_ORDER: StageName[] = ["empathize", "define", "ideate", "prototype", "test"];

interface ApprovalBarProps {
  onEditToggle: () => void;
  isEditing: boolean;
}

export function ApprovalBar({ onEditToggle, isEditing }: ApprovalBarProps) {
  const { 
    sessionId, 
    selectedStage, 
    state, 
    approveStage: storeApprove,
    loopBack: storeLoopBack,
    retryStage: storeRetry 
  } = usePipelineStore();
  const [isApproving, setIsApproving] = useState(false);
  const [isLooping, setIsLooping] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [showLoopMenu, setShowLoopMenu] = useState(false);

  if (!selectedStage || !sessionId) return null;

  const stageOutput = state?.[selectedStage];
  const isAwaiting = stageOutput?.status === "awaiting_review";
  const isRejected = stageOutput?.status === "rejected" || stageOutput?.status === "error";

  if (!isAwaiting && !isRejected) return null;

  // Find previous stages for loop back
  const currentIndex = STAGE_ORDER.indexOf(selectedStage);
  const previousStages = STAGE_ORDER.slice(0, currentIndex);

  const handleApprove = async () => {
    try {
      setIsApproving(true);
      await storeApprove(selectedStage);
      setIsApproving(false);
    } catch (error) {
      console.error("Failed to approve stage:", error);
      setIsApproving(false);
    }
  };

  const handleRetry = async () => {
    try {
      setIsRetrying(true);
      await storeRetry();
      setIsRetrying(false);
    } catch (error) {
      console.error("Failed to retry stage:", error);
      setIsRetrying(false);
    }
  };

  const handleLoopBack = async (target: StageName) => {
    try {
      setIsLooping(true);
      setShowLoopMenu(false);
      await storeLoopBack(target);
      setIsLooping(false);
    } catch (error) {
      console.error("Failed to loop back:", error);
      setIsLooping(false);
    }
  };

  return (
    <div className="flex flex-col gap-3 border-t border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 animate-in slide-in-from-bottom-4 duration-300">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`h-2 w-2 rounded-full animate-pulse ${isRejected ? 'bg-red-500' : 'bg-[var(--status-review)]'}`} />
          <span className={`font-display text-xs font-bold uppercase tracking-wider ${isRejected ? 'text-red-500' : 'text-[var(--status-review)]'}`}>
            {isRejected ? 'Execution Failed' : 'Awaiting Review'}
          </span>
        </div>
        <span className="font-body text-xs text-[var(--text-tertiary)]">
          {isRejected ? 'Error occurred during generation' : 'Human-in-the-loop gate'}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {isAwaiting ? (
          <>
            {/* Approve Button */}
            <button
              onClick={handleApprove}
              disabled={isApproving || isEditing}
              className="flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-500 disabled:opacity-50 focus-ring"
            >
              {isApproving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              Approve
            </button>

            {/* Edit Button */}
            <button
              onClick={onEditToggle}
              disabled={isApproving}
              className={`flex items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold transition-colors focus-ring
                ${isEditing 
                  ? 'border-amber-500 bg-amber-500/10 text-amber-500' 
                  : 'border-[var(--border-subtle)] bg-transparent text-[var(--text-secondary)] hover:border-amber-500 hover:text-amber-500'}`}
            >
              <Edit2 className="h-4 w-4" />
              {isEditing ? "Cancel Edit" : "Edit"}
            </button>
          </>
        ) : (
          <button
            onClick={handleRetry}
            disabled={isRetrying}
            className="col-span-2 flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-500 disabled:opacity-50 focus-ring"
          >
            {isRetrying ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Retry Stage
          </button>
        )}

        {/* Loop Back Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowLoopMenu(!showLoopMenu)}
            disabled={isApproving || isEditing || previousStages.length === 0}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-[var(--status-loop)] text-[var(--status-loop)] px-4 py-2 text-sm font-semibold transition-colors hover:bg-violet-500/10 disabled:opacity-50 focus-ring"
          >
            {isLooping ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
            Loop Back
          </button>

          {showLoopMenu && previousStages.length > 0 && (
            <div className="absolute bottom-full mb-2 left-0 z-50 w-full overflow-hidden rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] shadow-xl animate-slide-up-fade">
              <div className="bg-zinc-950 px-3 py-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-tertiary)]">Select Target</span>
              </div>
              <ul className="flex flex-col">
                {previousStages.map((stage) => (
                  <li key={stage}>
                    <button
                      onClick={() => handleLoopBack(stage)}
                      className="w-full px-3 py-2 text-left text-sm text-[var(--text-primary)] transition-colors hover:bg-zinc-700 hover:text-white capitalize"
                    >
                      {stage}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
