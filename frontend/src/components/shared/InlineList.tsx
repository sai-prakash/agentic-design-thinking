import { useState } from 'react';
import { Plus, X, Pencil, Check } from 'lucide-react';

interface InlineListProps {
  items: string[];
  onChange: (items: string[]) => void;
  editable?: boolean;
  itemClassName?: string;
  placeholder?: string;
}

/**
 * Editable list — each item can be clicked to edit inline.
 * Has add (+) and remove (x) controls when editable.
 */
export function InlineList({
  items,
  onChange,
  editable = false,
  itemClassName = 'rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-2 text-sm text-zinc-300',
  placeholder = 'Add item...',
}: InlineListProps) {
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [draft, setDraft] = useState('');
  const [adding, setAdding] = useState(false);
  const [addDraft, setAddDraft] = useState('');

  const startEdit = (idx: number) => {
    setEditIdx(idx);
    setDraft(items[idx]);
  };

  const commitEdit = () => {
    if (editIdx === null) return;
    const trimmed = draft.trim();
    if (trimmed) {
      const updated = [...items];
      updated[editIdx] = trimmed;
      onChange(updated);
    }
    setEditIdx(null);
  };

  const removeItem = (idx: number) => {
    onChange(items.filter((_, i) => i !== idx));
  };

  const addItem = () => {
    const trimmed = addDraft.trim();
    if (trimmed) {
      onChange([...items, trimmed]);
      setAddDraft('');
      setAdding(false);
    }
  };

  return (
    <div className="space-y-1.5">
      {items.map((item, i) => (
        <div key={i} className={`group/item flex items-start gap-2 ${editIdx === i ? '' : itemClassName}`}>
          {editIdx === i ? (
            <div className="flex-1 flex items-center gap-1.5">
              <input
                autoFocus
                type="text"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onBlur={commitEdit}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') commitEdit();
                  if (e.key === 'Escape') setEditIdx(null);
                }}
                className="flex-1 bg-zinc-950 border border-indigo-500/50 rounded-lg px-3 py-2 text-sm text-zinc-300 outline-none focus:border-indigo-500"
              />
              <button type="button" onClick={commitEdit} className="p-1 text-emerald-400 hover:text-emerald-300">
                <Check className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <>
              <span
                className={`flex-1 ${editable ? 'cursor-text' : ''}`}
                onClick={editable ? () => startEdit(i) : undefined}
              >
                {item}
              </span>
              {editable && (
                <div className="flex items-center gap-0.5 opacity-0 group-hover/item:opacity-100 transition-opacity shrink-0">
                  <button
                    type="button"
                    onClick={() => startEdit(i)}
                    className="p-0.5 text-zinc-600 hover:text-zinc-400"
                    aria-label="Edit item"
                  >
                    <Pencil className="h-3 w-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeItem(i)}
                    className="p-0.5 text-zinc-600 hover:text-red-400"
                    aria-label="Remove item"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      ))}

      {/* Add new item */}
      {editable && (
        adding ? (
          <div className="flex items-center gap-1.5">
            <input
              autoFocus
              type="text"
              value={addDraft}
              onChange={(e) => setAddDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') addItem();
                if (e.key === 'Escape') { setAdding(false); setAddDraft(''); }
              }}
              onBlur={() => { if (!addDraft.trim()) setAdding(false); }}
              placeholder={placeholder}
              className="flex-1 bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-300 outline-none focus:border-indigo-500 placeholder-zinc-600"
            />
            <button type="button" onClick={addItem} className="p-1.5 text-emerald-400 hover:text-emerald-300">
              <Check className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="flex items-center gap-1.5 rounded-lg border border-dashed border-zinc-800 px-3 py-2 text-xs text-zinc-600 transition-colors hover:border-zinc-600 hover:text-zinc-400"
          >
            <Plus className="h-3 w-3" />
            {placeholder}
          </button>
        )
      )}
    </div>
  );
}
