import { useState } from 'react';
import {
  Check, ChevronRight, Sparkles, Plus, StickyNote,
  X, Loader2, ThumbsUp, ThumbsDown, Eye,
} from 'lucide-react';
import { useInlineEdit } from '../../hooks/use-inline-edit';
import { InlineField } from '../shared/InlineField';
import { InlineTagList } from '../shared/InlineTagList';
import { SaveBar } from '../shared/SaveBar';
import { usePipelineStore } from '../../store/pipeline-store';

interface Variant {
  id: string;
  name: string;
  description: string;
  approach: string;
  sketch_svg?: string;
  pros: string[];
  cons: string[];
}

interface IdeateViewData {
  variants: Variant[];
  selected_variant: string;
  selection_rationale: string;
}

export function IdeateView({ data }: { data: IdeateViewData }) {
  const { getValue, setValue, isDirty, isEditable, save, discard, saving } = useInlineEdit('ideate');
  const { sendChatFeedback } = usePipelineStore();
  const [generating, setGenerating] = useState(false);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [expandedSketch, setExpandedSketch] = useState<string | null>(null);

  const variants: Variant[] = (getValue('variants') as Variant[]) ?? data.variants ?? [];
  const selectedId: string = (getValue('selected_variant') as string) ?? data.selected_variant ?? '';

  if (!variants || variants.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Sparkles className="mb-3 h-8 w-8 text-zinc-600" />
        <p className="text-sm text-zinc-500">No variants generated yet</p>
      </div>
    );
  }

  const handleSelect = (variantId: string) => {
    if (!isEditable) return;
    setValue('selected_variant', variantId);
  };

  const handleGenerateMore = async () => {
    setGenerating(true);
    await sendChatFeedback('Please generate 2-3 more design variants exploring different approaches. Keep the existing variants and add new ones.');
    setGenerating(false);
  };

  return (
    <div className="flex flex-col gap-6 animate-slide-up-fade">
      {/* Header with count + Generate More */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-zinc-500">
            Design Explorations
          </h3>
          <p className="mt-0.5 text-xs text-zinc-600">
            {variants.length} variant{variants.length !== 1 ? 's' : ''}
            {selectedId && ' — click a card to change your selection'}
          </p>
        </div>
        {isEditable && (
          <button
            type="button"
            onClick={handleGenerateMore}
            disabled={generating}
            className="flex items-center gap-2 rounded-lg border border-dashed border-indigo-700/50 bg-indigo-950/20 px-4 py-2 font-display text-[11px] font-bold uppercase tracking-wider text-indigo-400 transition-all hover:border-indigo-500 hover:bg-indigo-950/40 hover:text-indigo-300 disabled:opacity-50"
          >
            {generating ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Plus className="h-3.5 w-3.5" />
            )}
            {generating ? 'Generating...' : 'Generate More'}
          </button>
        )}
      </div>

      {/* Variant Cards */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {variants.map((v) => {
          const isSelected = v.id === selectedId;
          const note = notes[v.id] || '';

          return (
            <div
              key={v.id}
              onClick={() => handleSelect(v.id)}
              className={`
                group/variant relative flex flex-col rounded-xl border transition-all
                ${isEditable ? 'cursor-pointer' : ''}
                ${isSelected
                  ? 'border-indigo-500 ring-1 ring-indigo-500/50 shadow-[0_0_20px_rgba(99,102,241,0.12)] bg-indigo-950/10'
                  : 'border-zinc-800 bg-zinc-900/40 hover:border-zinc-700 hover:bg-zinc-900/60'
                }
              `}
            >
              {/* Selection indicator */}
              {isSelected && (
                <div className="absolute -top-2.5 left-4 flex items-center gap-1 rounded-full bg-indigo-500 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-white shadow-lg shadow-indigo-500/30">
                  <Check className="h-2.5 w-2.5" /> Selected
                </div>
              )}

              {/* Card content */}
              <div className="p-5 pt-4">
                {/* Name */}
                <div className="mb-3 flex items-start justify-between gap-3">
                  <InlineField
                    value={v.name}
                    onChange={(val) => {
                      const updated = [...variants];
                      const idx = updated.findIndex((u) => u.id === v.id);
                      if (idx >= 0) { updated[idx] = { ...updated[idx], name: val }; setValue('variants', updated); }
                    }}
                    editable={isEditable}
                    variant="heading"
                  />
                  {/* Quick vote buttons */}
                  {isEditable && !isSelected && (
                    <div className="flex gap-1 opacity-0 transition-opacity group-hover/variant:opacity-100">
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleSelect(v.id); }}
                        className="rounded-md p-1.5 text-zinc-600 transition-colors hover:bg-emerald-500/10 hover:text-emerald-400"
                        title="Select this variant"
                      >
                        <ThumbsUp className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Description */}
                <div className="mb-4">
                  <InlineField
                    value={v.description}
                    onChange={(val) => {
                      const updated = [...variants];
                      const idx = updated.findIndex((u) => u.id === v.id);
                      if (idx >= 0) { updated[idx] = { ...updated[idx], description: val }; setValue('variants', updated); }
                    }}
                    editable={isEditable}
                    variant="body"
                    multiline
                  />
                </div>

                {/* Approach */}
                <div className="mb-4 rounded-lg bg-zinc-950/50 p-3 border border-zinc-800/80">
                  <span className="block mb-1.5 font-display text-[10px] font-bold uppercase tracking-widest text-zinc-600">
                    Approach
                  </span>
                  <InlineField
                    value={v.approach}
                    onChange={(val) => {
                      const updated = [...variants];
                      const idx = updated.findIndex((u) => u.id === v.id);
                      if (idx >= 0) { updated[idx] = { ...updated[idx], approach: val }; setValue('variants', updated); }
                    }}
                    editable={isEditable}
                    variant="body"
                    multiline
                  />
                </div>

                {/* SVG Sketch */}
                {v.sketch_svg && (
                  <div className="mb-4 overflow-hidden rounded-lg border border-zinc-800 bg-white/5">
                    <div className="flex items-center justify-between border-b border-zinc-800 px-3 py-1.5">
                      <span className="font-display text-[9px] font-bold uppercase tracking-widest text-zinc-600">
                        Wireframe
                      </span>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setExpandedSketch(expandedSketch === v.id ? null : v.id); }}
                        className="text-zinc-600 transition-colors hover:text-zinc-400"
                      >
                        <Eye className="h-3 w-3" />
                      </button>
                    </div>
                    <div
                      className={`w-full transition-all ${expandedSketch === v.id ? 'h-48' : 'h-20'} p-2`}
                      dangerouslySetInnerHTML={{ __html: v.sketch_svg }}
                    />
                  </div>
                )}

                {/* Pros / Cons */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <h5 className="mb-1.5 font-display text-[10px] font-bold uppercase tracking-widest text-emerald-500">
                      Pros
                    </h5>
                    {isEditable ? (
                      <InlineTagList
                        tags={v.pros || []}
                        onChange={(tags) => {
                          const updated = [...variants];
                          const idx = updated.findIndex((u) => u.id === v.id);
                          if (idx >= 0) { updated[idx] = { ...updated[idx], pros: tags }; setValue('variants', updated); }
                        }}
                        editable
                        tagClassName="bg-emerald-950/30 text-emerald-300 border-emerald-900/50"
                        placeholder="Add pro..."
                      />
                    ) : (
                      <ul className="space-y-1">
                        {v.pros?.map((p, i) => (
                          <li key={i} className="flex items-start gap-1 text-zinc-400">
                            <ChevronRight className="h-3 w-3 shrink-0 text-emerald-500 mt-0.5" />
                            <span className="leading-tight">{p}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div>
                    <h5 className="mb-1.5 font-display text-[10px] font-bold uppercase tracking-widest text-rose-500">
                      Cons
                    </h5>
                    {isEditable ? (
                      <InlineTagList
                        tags={v.cons || []}
                        onChange={(tags) => {
                          const updated = [...variants];
                          const idx = updated.findIndex((u) => u.id === v.id);
                          if (idx >= 0) { updated[idx] = { ...updated[idx], cons: tags }; setValue('variants', updated); }
                        }}
                        editable
                        tagClassName="bg-rose-950/30 text-rose-300 border-rose-900/50"
                        placeholder="Add con..."
                      />
                    ) : (
                      <ul className="space-y-1">
                        {v.cons?.map((c, i) => (
                          <li key={i} className="flex items-start gap-1 text-zinc-400">
                            <ChevronRight className="h-3 w-3 shrink-0 text-rose-500 mt-0.5" />
                            <span className="leading-tight">{c}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>

                {/* User Notes */}
                {isEditable && (
                  <div className="mt-4 border-t border-zinc-800/60 pt-3">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <StickyNote className="h-3 w-3 text-amber-500/60" />
                      <span className="font-display text-[9px] font-bold uppercase tracking-widest text-zinc-600">
                        Your Notes
                      </span>
                    </div>
                    <textarea
                      value={note}
                      onChange={(e) => setNotes({ ...notes, [v.id]: e.target.value })}
                      onClick={(e) => e.stopPropagation()}
                      placeholder="Why do you like/dislike this approach?"
                      className="w-full resize-none rounded-md border border-zinc-800 bg-zinc-950/50 px-3 py-2 text-xs text-zinc-400 outline-none placeholder-zinc-700 focus:border-amber-600/50 focus:ring-1 focus:ring-amber-600/20"
                      rows={2}
                    />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Save bar for inline edits */}
      <SaveBar isDirty={isDirty} saving={saving} onSave={save} onDiscard={discard} />
    </div>
  );
}
