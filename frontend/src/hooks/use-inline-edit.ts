import { useState, useCallback, useRef } from 'react';
import { usePipelineStore } from '../store/pipeline-store';
import type { StageName } from '../types';

/**
 * Hook for inline editing of stage data.
 * Tracks a local draft of edits, provides a save function,
 * and reports dirty state for showing a save bar.
 */
export function useInlineEdit(stage: StageName) {
  const { sessionId, state, editStage } = usePipelineStore();
  const [edits, setEdits] = useState<Record<string, unknown>>({});
  const [saving, setSaving] = useState(false);
  const dirtyRef = useRef(false);

  const stageData = state?.[stage]?.data;
  const isEditable = state?.[stage]?.status === 'awaiting_review';

  const isDirty = Object.keys(edits).length > 0;
  dirtyRef.current = isDirty;

  /** Get the current value of a field — draft if edited, otherwise original */
  const getValue = useCallback(
    (path: string) => {
      if (path in edits) return edits[path];
      return getNestedValue(stageData, path);
    },
    [edits, stageData]
  );

  /** Set a field value in the local draft */
  const setValue = useCallback((path: string, value: unknown) => {
    setEdits((prev) => ({ ...prev, [path]: value }));
  }, []);

  /** Build the full edited data object by applying edits on top of original */
  const buildEditedData = useCallback(() => {
    if (!stageData) return {};
    const result = JSON.parse(JSON.stringify(stageData));
    for (const [path, value] of Object.entries(edits)) {
      setNestedValue(result, path, value);
    }
    return result;
  }, [stageData, edits]);

  /** Save all edits to the backend */
  const save = useCallback(async () => {
    if (!sessionId || !isDirty) return;
    setSaving(true);
    const edited = buildEditedData();
    await editStage(stage, edited);
    setEdits({});
    setSaving(false);
  }, [sessionId, isDirty, buildEditedData, editStage, stage]);

  /** Discard all edits */
  const discard = useCallback(() => {
    setEdits({});
  }, []);

  return { getValue, setValue, isDirty, isEditable, save, discard, saving };
}

/** Get a nested value from an object using dot notation: "persona.name" */
function getNestedValue(obj: unknown, path: string): unknown {
  if (!obj || typeof obj !== 'object') return undefined;
  const keys = path.split('.');
  let current: unknown = obj;
  for (const key of keys) {
    if (current == null || typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[key];
  }
  return current;
}

/** Set a nested value on an object using dot notation */
function setNestedValue(obj: Record<string, unknown>, path: string, value: unknown): void {
  const keys = path.split('.');
  let current = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (!(key in current) || typeof current[key] !== 'object') {
      current[key] = {};
    }
    current = current[key] as Record<string, unknown>;
  }
  current[keys[keys.length - 1]] = value;
}
