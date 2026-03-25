import { useHealthCheck } from "../../hooks/use-health-check";

export function Header() {
  const { health, loading } = useHealthCheck();

  return (
    <header className="flex h-16 items-center justify-between border-b px-6 bg-[var(--bg-surface)] shrink-0">
      <div className="flex items-center gap-4">
        <h1 className="font-display text-lg font-bold uppercase tracking-tight text-[var(--text-primary)]">
          Agentic Design Co-Pilot
        </h1>
        <span className="font-body text-sm text-[var(--text-secondary)]">
          Traceable, reviewable, reversible design decisions.
        </span>
      </div>

      <div className="flex items-center gap-3">
        {loading ? (
          <div className="flex items-center gap-2 rounded-full border border-zinc-700 bg-zinc-800/50 px-3 py-1.5 text-xs text-zinc-400">
            <div className="h-2 w-2 animate-pulse rounded-full bg-zinc-500" />
            Connecting...
          </div>
        ) : health?.status === "ok" ? (
          <div className="flex items-center gap-2 rounded-full border border-emerald-900/50 bg-emerald-950/30 px-3 py-1.5 text-xs text-emerald-400">
            <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
            Backend Online
            {health.llm_backend && (
              <span className="ml-1 border-l border-emerald-800/50 pl-2 text-emerald-500/80">
                {health.llm_backend}
              </span>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 rounded-full border border-red-900/50 bg-red-950/30 px-3 py-1.5 text-xs text-red-400">
            <div className="h-2 w-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
            Backend Offline
          </div>
        )}
      </div>
    </header>
  );
}
