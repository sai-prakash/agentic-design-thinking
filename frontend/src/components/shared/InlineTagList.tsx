import { useState } from 'react';
import { Plus, X } from 'lucide-react';

interface InlineTagListProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  editable?: boolean;
  tagClassName?: string;
  placeholder?: string;
}

/**
 * Editable tag pills — click X to remove, + to add new.
 */
export function InlineTagList({
  tags,
  onChange,
  editable = false,
  tagClassName = 'bg-zinc-800 text-zinc-300 border-zinc-700',
  placeholder = 'Add tag...',
}: InlineTagListProps) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState('');

  const removeTag = (idx: number) => {
    onChange(tags.filter((_, i) => i !== idx));
  };

  const addTag = () => {
    const trimmed = draft.trim();
    if (trimmed && !tags.includes(trimmed)) {
      onChange([...tags, trimmed]);
      setDraft('');
      setAdding(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {tags.map((tag, i) => (
        <span
          key={i}
          className={`group/tag inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs ${tagClassName}`}
        >
          {tag}
          {editable && (
            <button
              type="button"
              onClick={() => removeTag(i)}
              className="text-zinc-600 opacity-0 transition-opacity hover:text-red-400 group-hover/tag:opacity-100"
              aria-label={`Remove ${tag}`}
            >
              <X className="h-2.5 w-2.5" />
            </button>
          )}
        </span>
      ))}

      {editable && (
        adding ? (
          <input
            autoFocus
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') addTag();
              if (e.key === 'Escape') { setAdding(false); setDraft(''); }
            }}
            onBlur={() => { if (!draft.trim()) setAdding(false); else addTag(); }}
            placeholder={placeholder}
            className="rounded-md border border-zinc-700 bg-zinc-950 px-2 py-0.5 text-xs text-zinc-300 outline-none focus:border-indigo-500 w-24"
          />
        ) : (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="inline-flex items-center gap-0.5 rounded-md border border-dashed border-zinc-700 px-2 py-0.5 text-xs text-zinc-600 transition-colors hover:border-zinc-500 hover:text-zinc-400"
          >
            <Plus className="h-2.5 w-2.5" />
          </button>
        )
      )}
    </div>
  );
}
