import { useState, useRef, useEffect } from 'react';
import { Pencil } from 'lucide-react';

interface InlineFieldProps {
  value: string;
  onChange: (val: string) => void;
  editable?: boolean;
  /** Display variant */
  variant?: 'text' | 'heading' | 'blockquote' | 'body';
  className?: string;
  placeholder?: string;
  multiline?: boolean;
}

/**
 * Click-to-edit text field. Displays as styled text normally,
 * becomes an input/textarea when clicked (if editable).
 */
export function InlineField({
  value,
  onChange,
  editable = false,
  variant = 'text',
  className = '',
  placeholder = 'Click to edit...',
  multiline = false,
}: InlineFieldProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  // Sync external value changes
  useEffect(() => {
    if (!editing) setDraft(value);
  }, [value, editing]);

  // Auto-focus when entering edit mode
  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const commit = () => {
    setEditing(false);
    if (draft !== value) {
      onChange(draft);
    }
  };

  const cancel = () => {
    setEditing(false);
    setDraft(value);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !multiline) {
      e.preventDefault();
      commit();
    }
    if (e.key === 'Enter' && multiline && e.metaKey) {
      e.preventDefault();
      commit();
    }
    if (e.key === 'Escape') {
      cancel();
    }
  };

  const variantStyles: Record<string, string> = {
    text: 'text-sm text-zinc-300',
    heading: 'font-display text-base font-bold text-zinc-100',
    blockquote: 'text-base italic text-zinc-200 leading-relaxed',
    body: 'text-sm text-zinc-400 leading-relaxed',
  };

  if (editing) {
    const inputClass = `w-full bg-zinc-950 border border-indigo-500/50 rounded-lg px-3 py-2 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 ${variantStyles[variant]} ${className}`;

    if (multiline) {
      return (
        <textarea
          ref={inputRef as React.RefObject<HTMLTextAreaElement>}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={handleKeyDown}
          className={`${inputClass} resize-none min-h-[60px]`}
          rows={3}
        />
      );
    }

    return (
      <input
        ref={inputRef as React.RefObject<HTMLInputElement>}
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={handleKeyDown}
        className={inputClass}
      />
    );
  }

  // Display mode
  return (
    <span
      onClick={editable ? () => setEditing(true) : undefined}
      className={`
        ${variantStyles[variant]} ${className}
        ${editable ? 'cursor-text rounded-md px-1 -mx-1 transition-colors hover:bg-zinc-800/60 group/field inline-flex items-center gap-1' : ''}
        ${!value ? 'text-zinc-600 italic' : ''}
      `}
      role={editable ? 'button' : undefined}
      tabIndex={editable ? 0 : undefined}
      onKeyDown={editable ? (e) => { if (e.key === 'Enter') setEditing(true); } : undefined}
    >
      {value || placeholder}
      {editable && (
        <Pencil className="h-3 w-3 text-zinc-600 opacity-0 transition-opacity group-hover/field:opacity-100" />
      )}
    </span>
  );
}
