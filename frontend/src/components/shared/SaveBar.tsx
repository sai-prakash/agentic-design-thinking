import { Save, Undo2, Loader2 } from 'lucide-react';

interface SaveBarProps {
  isDirty: boolean;
  saving: boolean;
  onSave: () => void;
  onDiscard: () => void;
}

/**
 * Floating save bar that appears when inline edits are dirty.
 */
export function SaveBar({ isDirty, saving, onSave, onDiscard }: SaveBarProps) {
  if (!isDirty) return null;

  return (
    <div className="sticky bottom-0 z-20 border-t border-amber-800/40 bg-zinc-950/95 backdrop-blur-sm px-6 py-3 animate-slide-up-fade" style={{ animationDuration: '150ms' }}>
      <div className="flex items-center justify-between">
        <p className="font-body text-xs text-amber-400">
          You have unsaved edits
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onDiscard}
            disabled={saving}
            className="flex items-center gap-1.5 rounded-lg border border-zinc-700 px-3 py-1.5 font-display text-[10px] font-bold uppercase tracking-wider text-zinc-400 transition-all hover:text-zinc-200 disabled:opacity-50 focus-visible:focus-ring"
          >
            <Undo2 className="h-3 w-3" />
            Discard
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="flex items-center gap-1.5 rounded-lg bg-amber-600 px-4 py-1.5 font-display text-[10px] font-bold uppercase tracking-wider text-white transition-all hover:bg-amber-500 disabled:opacity-50 focus-visible:focus-ring"
          >
            {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
            {saving ? 'Saving...' : 'Save Edits'}
          </button>
        </div>
      </div>
    </div>
  );
}
