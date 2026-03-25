# Tailwind CSS Design Tokens Reference

A quick reference for the Tailwind utility classes most commonly used in component generation. All values are from the default Tailwind v3 configuration.

## Spacing Scale

Tailwind uses a consistent 4px base unit. The `p-`, `m-`, `gap-`, `w-`, `h-`, `top-`, `left-` (and all spacing utilities) share this scale.

| Class suffix | Value | Pixels |
|---|---|---|
| 0 | 0 | 0px |
| 0.5 | 0.125rem | 2px |
| 1 | 0.25rem | 4px |
| 1.5 | 0.375rem | 6px |
| 2 | 0.5rem | 8px |
| 3 | 0.75rem | 12px |
| 4 | 1rem | 16px |
| 5 | 1.25rem | 20px |
| 6 | 1.5rem | 24px |
| 8 | 2rem | 32px |
| 10 | 2.5rem | 40px |
| 12 | 3rem | 48px |
| 16 | 4rem | 64px |
| 20 | 5rem | 80px |
| 24 | 6rem | 96px |

Common patterns: `p-4` (16px padding), `px-6 py-3` (24px horizontal, 12px vertical), `gap-4` (16px grid/flex gap), `space-y-2` (8px vertical stack).

## Color Palette

Tailwind provides 22 color families each with shades from 50 to 950. The most commonly used:

### Neutral: Slate
- `slate-50` (#F8FAFC) -- page backgrounds
- `slate-100` (#F1F5F9) -- card backgrounds, subtle fills
- `slate-200` (#E2E8F0) -- borders, dividers
- `slate-400` (#94A3B8) -- placeholder text, disabled states
- `slate-600` (#475569) -- secondary text
- `slate-700` (#334155) -- primary body text
- `slate-900` (#0F172A) -- headings, high-emphasis text

### Primary: Blue
- `blue-50` (#EFF6FF) -- info background
- `blue-100` (#DBEAFE) -- hover background
- `blue-500` (#3B82F6) -- focus rings
- `blue-600` (#2563EB) -- primary buttons, links
- `blue-700` (#1D4ED8) -- primary button hover

### Success: Green
- `green-50` (#F0FDF4) -- success background
- `green-600` (#16A34A) -- success text, icons
- `green-700` (#15803D) -- success dark

### Error: Red
- `red-50` (#FEF2F2) -- error background
- `red-500` (#EF4444) -- error icons
- `red-600` (#DC2626) -- error text, destructive buttons
- `red-700` (#B91C1C) -- error dark

### Warning: Amber
- `amber-50` (#FFFBEB) -- warning background
- `amber-500` (#F59E0B) -- warning icons
- `amber-700` (#B45309) -- warning text

## Typography

### Font Size Scale

| Class | Size | Line Height | Use Case |
|---|---|---|---|
| text-xs | 0.75rem (12px) | 1rem | Captions, badges |
| text-sm | 0.875rem (14px) | 1.25rem | Secondary text, labels |
| text-base | 1rem (16px) | 1.5rem | Body text (default) |
| text-lg | 1.125rem (18px) | 1.75rem | Subheadings |
| text-xl | 1.25rem (20px) | 1.75rem | Section headers |
| text-2xl | 1.5rem (24px) | 2rem | Page titles |
| text-3xl | 1.875rem (30px) | 2.25rem | Hero headings |
| text-4xl | 2.25rem (36px) | 2.5rem | Display text |
| text-5xl | 3rem (48px) | 1 | Large display |

### Font Weight

| Class | Weight | Use Case |
|---|---|---|
| font-normal | 400 | Body text |
| font-medium | 500 | Labels, subtle emphasis |
| font-semibold | 600 | Headings, buttons |
| font-bold | 700 | Strong emphasis |

## Border Radius

| Class | Value | Use Case |
|---|---|---|
| rounded-none | 0 | Sharp edges |
| rounded-sm | 0.125rem (2px) | Subtle rounding |
| rounded | 0.25rem (4px) | Default inputs |
| rounded-md | 0.375rem (6px) | Buttons, badges |
| rounded-lg | 0.5rem (8px) | Cards, modals |
| rounded-xl | 0.75rem (12px) | Large cards |
| rounded-2xl | 1rem (16px) | Hero sections |
| rounded-full | 9999px | Avatars, pills |

## Shadow Scale

| Class | Use Case |
|---|---|
| shadow-sm | Subtle depth for cards |
| shadow | Default elevation |
| shadow-md | Dropdowns, popovers |
| shadow-lg | Modals, floating panels |
| shadow-xl | High-emphasis overlays |
| shadow-none | Flat design, remove shadow |

## Responsive Breakpoints

| Prefix | Min Width | Typical Target |
|---|---|---|
| (none) | 0px | Mobile first (default) |
| sm: | 640px | Large phones, landscape |
| md: | 768px | Tablets |
| lg: | 1024px | Small laptops |
| xl: | 1280px | Desktops |
| 2xl: | 1536px | Large screens |

Usage pattern -- mobile first, then override:

```
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
```

This creates a 1-column layout on mobile, 2 columns on tablets, and 3 columns on desktop.

## Common Utility Combinations

- **Button**: `px-4 py-2 rounded-lg font-semibold text-sm shadow-sm transition-colors`
- **Input**: `w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500`
- **Card**: `rounded-lg border border-slate-200 bg-white p-6 shadow-sm`
- **Badge**: `inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium`
