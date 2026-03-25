import React, { useMemo, useState } from 'react';
import { LiveProvider, LivePreview, LiveError } from 'react-live';
import {
  Terminal, AlertTriangle, Monitor, Tablet, Smartphone,
  Code, X, Lightbulb, ChevronRight, Copy, Check,
} from 'lucide-react';
import { buildRenderableCode } from '@/lib/sanitize-code';

interface PrototypeData {
  component_code: string;
  component_name: string;
  props_interface?: string;
  usage_example?: string;
  dependencies?: string[];
  design_decisions?: string[];
}

type Viewport = 'desktop' | 'tablet' | 'mobile';

const VIEWPORTS: { key: Viewport; label: string; icon: typeof Monitor; width: string }[] = [
  { key: 'desktop', label: 'Desktop', icon: Monitor, width: '100%' },
  { key: 'tablet', label: 'Tablet', icon: Tablet, width: '768px' },
  { key: 'mobile', label: 'Mobile', icon: Smartphone, width: '375px' },
];

export function PrototypeView({ data }: { data: PrototypeData }) {
  const [viewport, setViewport] = useState<Viewport>('desktop');
  const [codeDrawerOpen, setCodeDrawerOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const { code: renderableCode, warnings, usedName } = useMemo(
    () => buildRenderableCode(data.component_code || '', data.component_name || 'PrototypeComponent'),
    [data.component_code, data.component_name]
  );

  const activeViewport = VIEWPORTS.find((v) => v.key === viewport)!;

  if (!data.component_code) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Terminal className="mb-3 h-8 w-8 text-zinc-600" />
        <p className="text-sm text-zinc-500">No prototype code generated yet</p>
      </div>
    );
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(data.component_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col gap-0 animate-slide-up-fade -mx-6 -mt-2">
      {/* Warnings bar */}
      {warnings.length > 0 && (
        <div className="mx-6 mb-3 rounded-lg border border-amber-800/40 bg-amber-950/20 px-4 py-2.5 flex items-start gap-2">
          <AlertTriangle className="h-3.5 w-3.5 text-amber-400 mt-0.5 shrink-0" />
          <div className="flex flex-wrap gap-x-4 gap-y-0.5">
            {warnings.map((w, i) => (
              <span key={i} className="text-[11px] text-amber-400/80">{w}</span>
            ))}
          </div>
        </div>
      )}

      {/* Design decisions breadcrumb bar */}
      {data.design_decisions && data.design_decisions.length > 0 && (
        <div className="mx-6 mb-3 flex items-center gap-2 overflow-x-auto scrollbar-thin">
          <Lightbulb className="h-3 w-3 shrink-0 text-amber-500/60" />
          {data.design_decisions.map((d, i) => (
            <span key={i} className="flex items-center gap-1.5 shrink-0">
              {i > 0 && <ChevronRight className="h-2.5 w-2.5 text-zinc-700" />}
              <span className="whitespace-nowrap rounded-full bg-zinc-800/80 border border-zinc-700/50 px-2.5 py-0.5 text-[10px] text-zinc-400">
                {d}
              </span>
            </span>
          ))}
        </div>
      )}

      {/* Toolbar */}
      <div className="mx-6 mb-4 flex items-center justify-between">
        {/* Viewport toggle */}
        <div className="flex items-center rounded-lg border border-zinc-800 bg-zinc-900/60 p-0.5">
          {VIEWPORTS.map((v) => {
            const Icon = v.icon;
            const isActive = viewport === v.key;
            return (
              <button
                key={v.key}
                type="button"
                onClick={() => setViewport(v.key)}
                className={`
                  flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-all
                  ${isActive
                    ? 'bg-zinc-800 text-zinc-200 shadow-sm'
                    : 'text-zinc-600 hover:text-zinc-400'
                  }
                `}
                title={v.label}
              >
                <Icon className="h-3.5 w-3.5" />
                {v.label}
              </button>
            );
          })}
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] text-zinc-600 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
            &lt;{usedName} /&gt;
          </span>
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1.5 rounded-md border border-zinc-800 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-500 transition-all hover:text-zinc-300 hover:border-zinc-700"
          >
            {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
          <button
            type="button"
            onClick={() => setCodeDrawerOpen(!codeDrawerOpen)}
            className={`
              flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-all
              ${codeDrawerOpen
                ? 'border-indigo-600/50 bg-indigo-950/30 text-indigo-400'
                : 'border-zinc-800 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700'
              }
            `}
          >
            <Code className="h-3 w-3" />
            Code
          </button>
        </div>
      </div>

      {/* Main canvas area */}
      <div className="relative flex-1">
        <LiveProvider
          code={renderableCode}
          noInline={true}
          scope={{ React }}
        >
          {/* Preview frame */}
          <div className="flex justify-center px-6">
            <div
              className="transition-all duration-300 ease-out"
              style={{ width: activeViewport.width, maxWidth: '100%' }}
            >
              <div className={`
                overflow-hidden rounded-xl border bg-white shadow-2xl shadow-black/20
                ${viewport === 'desktop' ? 'border-zinc-700/50' : 'border-zinc-600/50 ring-1 ring-zinc-800/50'}
              `}>
                {/* Chrome bar for non-desktop */}
                {viewport !== 'desktop' && (
                  <div className="flex items-center justify-center gap-1.5 border-b border-zinc-200 bg-zinc-100 py-1.5">
                    <div className="h-1.5 w-1.5 rounded-full bg-zinc-300" />
                    <div className="h-1.5 w-1.5 rounded-full bg-zinc-300" />
                    <div className="h-1.5 w-1.5 rounded-full bg-zinc-300" />
                  </div>
                )}
                <div className="min-h-[400px] p-6 flex items-start justify-center">
                  <div className="w-full">
                    <LivePreview />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Error overlay */}
          <LiveError className="mx-6 mt-3 rounded-lg border border-red-900/50 bg-red-950/80 p-4 text-xs font-mono text-red-300 whitespace-pre-wrap break-words" />
        </LiveProvider>

        {/* Code drawer - slides in from right */}
        {codeDrawerOpen && (
          <div className="absolute inset-y-0 right-0 z-10 w-[480px] max-w-[90%] border-l border-zinc-800 bg-zinc-950/98 backdrop-blur-sm shadow-2xl shadow-black/50 animate-slide-left-fade flex flex-col">
            <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
              <h3 className="font-display text-xs font-bold uppercase tracking-widest text-zinc-400 flex items-center gap-1.5">
                <Terminal className="h-3.5 w-3.5" /> Source Code
              </h3>
              <button
                type="button"
                onClick={() => setCodeDrawerOpen(false)}
                className="rounded-md p-1 text-zinc-600 transition-colors hover:text-zinc-400"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4">
              <pre className="font-mono text-[11px] text-zinc-300 whitespace-pre-wrap break-words leading-relaxed">
                <code>{data.component_code}</code>
              </pre>

              {data.props_interface && (
                <div className="mt-6 border-t border-zinc-800 pt-4">
                  <h4 className="mb-2 font-display text-[10px] font-bold uppercase tracking-widest text-zinc-600">
                    Props Interface
                  </h4>
                  <pre className="font-mono text-[11px] text-zinc-500 whitespace-pre-wrap">
                    <code>{data.props_interface}</code>
                  </pre>
                </div>
              )}

              {data.usage_example && (
                <div className="mt-6 border-t border-zinc-800 pt-4">
                  <h4 className="mb-2 font-display text-[10px] font-bold uppercase tracking-widest text-zinc-600">
                    Usage Example
                  </h4>
                  <pre className="font-mono text-[11px] text-zinc-500 whitespace-pre-wrap">
                    <code>{data.usage_example}</code>
                  </pre>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Dependencies footer */}
      {data.dependencies && data.dependencies.length > 0 && (
        <div className="mx-6 mt-4 flex items-center gap-2">
          <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-700">Deps:</span>
          <div className="flex flex-wrap gap-1">
            {data.dependencies.map((dep, i) => (
              <span key={i} className="rounded bg-zinc-900 px-1.5 py-0.5 font-mono text-[10px] text-zinc-500 border border-zinc-800">
                {dep}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
