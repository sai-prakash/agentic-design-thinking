import { useState } from 'react';
import { usePipelineStore } from '../../store/pipeline-store';
import { ChevronDown, ChevronUp, TerminalSquare, Clock, Zap } from 'lucide-react';
import type { TraceEntry } from '../../types';

export function TracePanel() {
  const { state } = usePipelineStore();
  const [isOpen, setIsOpen] = useState(false);

  // If no trace or state, don't render (or maybe render empty state)
  if (!state || !state.trace) return null;

  const traces = [...state.trace].reverse(); // Newest first

  return (
    <div className="border-t border-[var(--border-subtle)] bg-zinc-950">
      {/* Header / Toggle */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between p-4 transition-colors hover:bg-zinc-900 focus-ring outline-none"
      >
        <div className="flex items-center gap-3">
          <TerminalSquare className="h-4 w-4 text-[var(--text-tertiary)]" />
          <h3 className="font-display text-sm font-bold uppercase tracking-wider text-[var(--text-primary)]">
            Audit Log
          </h3>
          <span className="flex h-5 items-center justify-center rounded-full bg-zinc-800 px-2 font-mono text-[10px] text-zinc-400">
            {state.trace.length} entries
          </span>
        </div>
        <div className="flex items-center gap-4 text-xs text-[var(--text-tertiary)]">
          {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
        </div>
      </button>

      {/* Aggregate Metrics Header (only when open) */}
      {isOpen && (
        <div className="grid grid-cols-3 divide-x divide-zinc-800 border-b border-t border-zinc-900 bg-zinc-950 text-center">
          <div className="py-2">
            <span className="block font-display text-xs text-zinc-500">Tokens</span>
            <span className="font-mono text-sm font-semibold text-zinc-300">{state.total_tokens.toLocaleString()}</span>
          </div>
          <div className="py-2">
            <span className="block font-display text-xs text-zinc-500">Latency</span>
            <span className="font-mono text-sm font-semibold text-zinc-300">{(state.total_latency_ms / 1000).toFixed(1)}s</span>
          </div>
          <div className="py-2">
            <span className="block font-display text-xs text-zinc-500">Iter</span>
            <span className="font-mono text-sm font-semibold text-indigo-400">v{state.iteration_count + 1}</span>
          </div>
        </div>
      )}

      {/* Trace List */}
      {isOpen && (
        <div className="max-h-64 overflow-y-auto p-2 scroll-smooth animate-slide-up-fade" style={{ animationDuration: '0.2s' }}>
          {traces.length === 0 ? (
            <div className="py-4 text-center text-xs text-zinc-600 italic">No events recorded yet.</div>
          ) : (
            <div className="flex flex-col gap-1">
              {traces.map((trace: TraceEntry, i: number) => {
                const date = new Date(trace.timestamp);
                
                return (
                  <div key={i} className="flex flex-col gap-1 rounded bg-zinc-900/50 p-2 border border-zinc-800/50 hover:bg-zinc-800 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-display text-[10px] font-bold uppercase text-indigo-400">{trace.type}</span>
                        <span className="rounded bg-zinc-800 px-1 font-mono text-[9px] uppercase tracking-wider text-zinc-300 border border-zinc-700">{trace.stage}</span>
                      </div>
                      <span className="flex items-center gap-1 font-mono text-[9px] text-zinc-500">
                        <Clock className="h-2.5 w-2.5" />
                        {date.toLocaleTimeString()}
                      </span>
                    </div>
                    
                    {trace.model && trace.model !== "system" && (
                      <div className="mt-1 flex items-center justify-between text-[10px] text-zinc-500">
                        <span className="font-mono bg-black/30 rounded px-1 max-w-[150px] truncate" title={trace.model}>{trace.model}</span>
                        <div className="flex gap-2">
                          <span className="flex items-center gap-0.5"><Zap className="h-2.5 w-2.5 text-yellow-500/70" /> {trace.tokens}</span>
                          <span className="font-mono">{(trace.latency_ms / 1000).toFixed(1)}s</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
