import { useState } from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';
import { usePipelineStore } from '../../store/pipeline-store';
import { startPipeline } from '../../lib/api';

const EXAMPLE_PROMPTS = [
  "Design a task management dashboard for remote teams",
  "Create an accessible pricing table for a SaaS product",
  "Build a meditation timer app for stressed professionals"
];

export function PromptInput() {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { setSessionId, clearState } = usePipelineStore();

  const handleStart = async () => {
    if (!prompt.trim()) return;
    
    try {
      setIsLoading(true);
      clearState(); // Reset for new run
      const { session_id } = await startPipeline(prompt);
      setSessionId(session_id);
    } catch (error) {
      console.error("Failed to start pipeline:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleStart();
    }
  };

  return (
    <div className="w-full max-w-4xl animate-slide-up-fade mx-auto lg:mx-0">
      <div className="mb-4 flex flex-wrap gap-2">
        {EXAMPLE_PROMPTS.map((example, idx) => (
          <button
            key={idx}
            onClick={() => setPrompt(example)}
            className="rounded-full border border-zinc-700 bg-zinc-800/50 px-3 py-1.5 text-xs text-zinc-300 transition-colors hover:border-zinc-500 hover:bg-zinc-700 hover:text-white focus-ring"
          >
            {example}
          </button>
        ))}
      </div>

      <div className="relative overflow-hidden rounded-xl border border-zinc-700 bg-zinc-900 shadow-xl focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 transition-all">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Describe what you want to design..."
          rows={3}
          className="w-full resize-none bg-transparent p-4 text-[var(--text-primary)] placeholder-zinc-500 outline-none font-body text-base"
          disabled={isLoading}
        />
        
        <div className="flex items-center justify-between border-t border-zinc-800 bg-zinc-950/50 px-4 py-3">
          <div className="flex items-center gap-2 text-xs text-zinc-500 font-mono">
            <Sparkles className="h-4 w-4" />
            <span>Agentic Design Pipeline</span>
          </div>
          
          <button
            onClick={handleStart}
            disabled={!prompt.trim() || isLoading}
            className="flex items-center gap-2 rounded-lg bg-indigo-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed focus-ring"
          >
            {isLoading ? "Starting..." : "Start Design Process"}
            {!isLoading && <ArrowRight className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
