import { useState, useEffect } from 'react';
import { usePipelineStore } from '../../store/pipeline-store';
import { editStage } from '../../lib/api';
import { Save, AlertTriangle, Loader2 } from 'lucide-react';

export interface EditModeProps {
  onCancel?: () => void;
  onClose?: () => void;
}

export function EditMode({ onCancel, onClose }: EditModeProps) {
  const handleClose = onCancel || onClose || (() => {});
  const { sessionId, selectedStage, state } = usePipelineStore();
  const [jsonText, setJsonText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const stageData = selectedStage ? state?.[selectedStage]?.data : null;

  // Initialize with current data
  useEffect(() => {
    if (stageData) {
      setJsonText(JSON.stringify(stageData, null, 2));
    }
  }, [stageData]);

  const handleSave = async () => {
    if (!sessionId || !selectedStage) return;

    try {
      setIsSaving(true);
      setError(null);
      
      // Validate JSON
      const parsedData = JSON.parse(jsonText);
      
      // Submit edit request
      await editStage(sessionId, parsedData, "Manual edit by User");
      
      // Auto-cancel on success
      handleClose();
    } catch (err) {
      if (err instanceof SyntaxError) {
        setError(`Invalid JSON: ${err.message}`);
      } else {
        setError("Failed to save edits to server. Check connection.");
      }
      setIsSaving(false);
    }
  };

  return (
    <div className="flex h-full flex-col animate-slide-up-fade">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-amber-500">
          Edit Mode Active
        </h3>
        <span className="font-body text-xs text-[var(--text-secondary)]">
          Modify JSON below. Keep structure intact.
        </span>
      </div>

      {error && (
        <div className="mb-4 flex items-start gap-2 rounded-lg border border-red-900/50 bg-red-950/20 p-3 text-sm text-red-400">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span className="break-all">{error}</span>
        </div>
      )}

      <div className="flex-1 relative overflow-hidden rounded-xl border border-[var(--border-subtle)] focus-within:border-amber-500 focus-within:ring-1 focus-within:ring-amber-500">
        <textarea
          value={jsonText}
          onChange={(e) => {
            setJsonText(e.target.value);
            if (error) setError(null);
          }}
          className="h-full w-full resize-none bg-zinc-950 p-4 font-mono text-xs text-zinc-300 outline-none"
          spellCheck={false}
          disabled={isSaving}
        />
      </div>

      <div className="mt-4 flex justify-end gap-3">
        <button
          onClick={handleClose}
          disabled={isSaving}
          className="rounded-lg px-4 py-2 text-sm font-semibold text-[var(--text-secondary)] transition-colors hover:text-white"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-amber-500 disabled:opacity-50"
        >
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save Edits
        </button>
      </div>
    </div>
  );
}
