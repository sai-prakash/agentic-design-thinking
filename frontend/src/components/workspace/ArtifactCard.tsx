import { useState, useEffect, useCallback, type ReactNode } from 'react';
import { X, Maximize2 } from 'lucide-react';

interface ArtifactCardProps {
  title: string;
  children: ReactNode;
  expandable?: boolean;
  className?: string;
}

export function ArtifactCard({ title, children, expandable = true, className = "" }: ArtifactCardProps) {
  const [expanded, setExpanded] = useState(false);

  const close = useCallback(() => setExpanded(false), []);

  useEffect(() => {
    if (!expanded) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [expanded, close]);

  return (
    <>
      <div
        className={`
          group relative rounded-xl border border-zinc-800 bg-zinc-900/80 p-5 transition-all
          hover:border-zinc-700 hover:bg-zinc-900
          ${className}
        `}
      >
        <div className="mb-3 flex items-center justify-between">
          <h4 className="font-display text-xs font-bold uppercase tracking-widest text-zinc-500">
            {title}
          </h4>
          {expandable && (
            <button
              type="button"
              onClick={() => setExpanded(true)}
              aria-label={`Expand ${title}`}
              className="rounded-md p-1 text-zinc-600 opacity-0 transition-all hover:bg-zinc-800 hover:text-zinc-400 group-hover:opacity-100 focus-visible:opacity-100 focus-visible:focus-ring"
            >
              <Maximize2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        {children}
      </div>

      {/* Expanded overlay */}
      {expanded && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) close(); }}
          role="dialog"
          aria-modal="true"
          aria-label={title}
        >
          <div
            className="relative mx-4 max-h-[85vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-zinc-700 bg-zinc-900 p-8 shadow-2xl animate-slide-up-fade"
            style={{ animationDuration: "200ms" }}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-sm font-bold uppercase tracking-widest text-zinc-400">
                {title}
              </h3>
              <button
                type="button"
                onClick={close}
                aria-label="Close"
                className="rounded-lg p-1.5 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-300 focus-visible:focus-ring"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {children}
          </div>
        </div>
      )}
    </>
  );
}
