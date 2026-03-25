import { AlertTriangle, CheckCircle2, ShieldAlert, BadgeInfo } from 'lucide-react';
import { useInlineEdit } from '../../hooks/use-inline-edit';
import { InlineField } from '../shared/InlineField';
import { InlineList } from '../shared/InlineList';
import { SaveBar } from '../shared/SaveBar';

interface TestData {
  wcag_audit: {
    passed: string[];
    failed: string[];
    warnings: string[];
    score: number;
  };
  performance_notes: string[];
  ux_evaluation: {
    meets_needs: string;
    matches_pov: string;
    hits_hills: string;
  };
  overall_score: number;
  verdict: "pass" | "fail" | "needs_iteration";
  fix_suggestions: string[];
  loop_recommendation?: {
    should_loop: boolean;
    target_stage: string;
    reason: string;
  };
}

export function TestView({ data }: { data: TestData }) {
  const { getValue, setValue, isDirty, isEditable, save, discard, saving } = useInlineEdit('test');

  if (!data?.verdict) return <div className="text-sm text-zinc-500">No test data available.</div>;

  const fixSuggestions = (getValue('fix_suggestions') as string[]) ?? data.fix_suggestions ?? [];
  const uxEval = (getValue('ux_evaluation') as TestData['ux_evaluation']) ?? data.ux_evaluation;

  const scorePct = Math.round(data.overall_score * 100);
  const radius = 46;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (data.overall_score * circumference);

  let colorClass = "text-emerald-500";
  let strokeClass = "stroke-emerald-500";
  let bgClass = "bg-emerald-500/10 border-emerald-500/20";

  if (data.verdict === "fail") {
    colorClass = "text-rose-500";
    strokeClass = "stroke-rose-500";
    bgClass = "bg-rose-500/10 border-rose-500/20";
  } else if (data.verdict === "needs_iteration") {
    colorClass = "text-amber-500";
    strokeClass = "stroke-amber-500";
    bgClass = "bg-amber-500/10 border-amber-500/20";
  }

  return (
    <div className="flex flex-col gap-6 animate-slide-up-fade">
      {/* Score Banner */}
      <div className={`flex items-center gap-6 rounded-xl border p-6 ${bgClass}`}>
        <div className="relative h-28 w-28 shrink-0">
          <svg className="h-full w-full -rotate-90 transform" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="46" fill="transparent" stroke="currentColor" strokeWidth="8" className="text-zinc-800" />
            <circle cx="50" cy="50" r="46" fill="transparent" strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" strokeWidth="8" className={`${strokeClass} transition-all duration-1000 ease-out`} />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-display text-2xl font-bold">{scorePct}</span>
            <span className="text-[10px] uppercase text-zinc-500">Score</span>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <h2 className={`font-display text-xl font-bold uppercase tracking-wider ${colorClass}`}>
            {data.verdict.replace('_', ' ')}
          </h2>
          <p className="font-body text-sm text-zinc-400">
            Component evaluation based on accessibility, UX heuristics, and semantic structure.
          </p>
          {data.loop_recommendation?.should_loop && (
            <div className="mt-1 inline-flex items-center gap-2 rounded-lg bg-indigo-500/20 px-3 py-1.5 text-xs text-indigo-300 border border-indigo-500/30">
              <span className="font-bold">Optimizer:</span>
              Loop to <strong className="uppercase">{data.loop_recommendation.target_stage}</strong>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* WCAG Audit */}
        <section className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
          <h3 className="mb-4 font-display text-[10px] font-bold uppercase tracking-widest text-zinc-500">
            WCAG 2.1 Audit
            <span className="ml-2 font-mono text-[10px] bg-zinc-800 px-1.5 rounded">{(data.wcag_audit?.score || 0) * 100}%</span>
          </h3>

          <div className="space-y-4">
            {data.wcag_audit?.failed?.length > 0 && (
              <div>
                <h4 className="flex items-center gap-1.5 text-xs font-bold text-rose-500 mb-2">
                  <ShieldAlert className="h-3.5 w-3.5" /> Blockers
                </h4>
                <ul className="space-y-1.5">
                  {data.wcag_audit.failed.map((f, i) => (
                    <li key={i} className="text-xs text-zinc-400 before:content-['•'] before:mr-1.5 before:text-rose-500/50">{f}</li>
                  ))}
                </ul>
              </div>
            )}

            {data.wcag_audit?.warnings?.length > 0 && (
              <div>
                <h4 className="flex items-center gap-1.5 text-xs font-bold text-amber-500 mb-2">
                  <AlertTriangle className="h-3.5 w-3.5" /> Warnings
                </h4>
                <ul className="space-y-1.5">
                  {data.wcag_audit.warnings.map((w, i) => (
                    <li key={i} className="text-xs text-zinc-400 before:content-['•'] before:mr-1.5 before:text-amber-500/50">{w}</li>
                  ))}
                </ul>
              </div>
            )}

            {data.wcag_audit?.passed?.length > 0 && (
              <div>
                <h4 className="flex items-center gap-1.5 text-xs font-bold text-emerald-500 mb-2">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Passed
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {data.wcag_audit.passed.map((p, i) => (
                    <span key={i} className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] px-2 py-0.5 rounded-full">{p}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Goal Alignment + Fix Suggestions */}
        <div className="flex flex-col gap-6">
          <section className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
            <h3 className="mb-3 font-display text-[10px] font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-1.5">
              <BadgeInfo className="h-3.5 w-3.5" /> Goal Alignment
            </h3>
            <div className="space-y-3">
              <div className="flex items-start gap-2 border-b border-zinc-800 pb-2">
                <strong className="w-24 shrink-0 text-xs text-zinc-300">Needs:</strong>
                <InlineField
                  value={uxEval?.meets_needs || ''}
                  onChange={(val) => setValue('ux_evaluation', { ...uxEval, meets_needs: val })}
                  editable={isEditable}
                  variant="body"
                />
              </div>
              <div className="flex items-start gap-2 border-b border-zinc-800 pb-2">
                <strong className="w-24 shrink-0 text-xs text-zinc-300">POV Match:</strong>
                <InlineField
                  value={uxEval?.matches_pov || ''}
                  onChange={(val) => setValue('ux_evaluation', { ...uxEval, matches_pov: val })}
                  editable={isEditable}
                  variant="body"
                />
              </div>
              <div className="flex items-start gap-2">
                <strong className="w-24 shrink-0 text-xs text-zinc-300">Hills:</strong>
                <InlineField
                  value={uxEval?.hits_hills || ''}
                  onChange={(val) => setValue('ux_evaluation', { ...uxEval, hits_hills: val })}
                  editable={isEditable}
                  variant="body"
                />
              </div>
            </div>
          </section>

          {(fixSuggestions.length > 0 || isEditable) && (
            <section className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
              <h3 className="mb-3 font-display text-[10px] font-bold uppercase tracking-widest text-zinc-500">Fix Suggestions</h3>
              <InlineList
                items={fixSuggestions}
                onChange={(items) => setValue('fix_suggestions', items)}
                editable={isEditable}
                placeholder="Add fix suggestion..."
              />
            </section>
          )}
        </div>
      </div>

      <SaveBar isDirty={isDirty} saving={saving} onSave={save} onDiscard={discard} />
    </div>
  );
}
