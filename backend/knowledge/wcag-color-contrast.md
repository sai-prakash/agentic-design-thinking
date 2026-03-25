# WCAG Color Contrast Requirements

Contrast ratios ensure text and UI elements are readable for users with low vision or color deficiencies. This document covers the specific ratios required by WCAG 2.1 AA and provides actionable examples.

## Contrast Ratio Thresholds

| Element Type | Minimum Ratio | WCAG Criterion |
|---|---|---|
| Normal text (under 18pt / 24px) | 4.5:1 | 1.4.3 |
| Large text (18pt+ / 24px+ regular, or 14pt+ / 18.66px+ bold) | 3:1 | 1.4.3 |
| UI components (borders, icons, form controls) | 3:1 | 1.4.11 |
| Graphical objects conveying meaning | 3:1 | 1.4.11 |
| Disabled elements and decorative content | No requirement | -- |
| Placeholder text | 4.5:1 recommended | Best practice |

## Good Color Combinations

These pairings meet or exceed the 4.5:1 ratio for normal text:

- **Black `#000000` on White `#FFFFFF`** -- ratio 21:1. Maximum contrast.
- **Dark slate `#1E293B` on White `#FFFFFF`** -- ratio 15.4:1. Clean, professional look.
- **White `#FFFFFF` on Blue `#1D4ED8`** -- ratio 8.6:1. Strong call-to-action button.
- **White `#FFFFFF` on Emerald `#047857`** -- ratio 5.9:1. Success state text.
- **Dark gray `#374151` on Light gray `#F3F4F6`** -- ratio 9.3:1. Subtle card text.

## Bad Color Combinations (Common Failures)

These pairings fail the 4.5:1 threshold:

- **Light gray `#9CA3AF` on White `#FFFFFF`** -- ratio 2.9:1. Very common in placeholder text.
- **Red `#EF4444` on Black `#000000`** -- ratio 3.1:1. Fails for normal text, passes only for large text.
- **Orange `#F97316` on White `#FFFFFF`** -- ratio 2.8:1. Looks bright but fails contrast.
- **Green `#22C55E` on White `#FFFFFF`** -- ratio 2.4:1. Common in success badges.
- **Blue `#60A5FA` on White `#FFFFFF`** -- ratio 2.9:1. Light blue links are a frequent failure.

## Tailwind CSS Contrast-Safe Pairings

When using Tailwind, these utility class combinations are reliable:

```
text-slate-900 bg-white          -- 15.4:1
text-white bg-blue-700           -- 8.6:1
text-white bg-red-700            -- 7.1:1
text-white bg-green-800          -- 9.4:1
text-slate-700 bg-slate-100      -- 8.2:1
text-amber-900 bg-amber-50       -- 8.7:1
```

Avoid these Tailwind combinations:

```
text-gray-400 bg-white           -- 3.0:1 FAIL
text-blue-400 bg-white           -- 2.9:1 FAIL
text-green-500 bg-white          -- 2.4:1 FAIL
```

## Checking Contrast Ratios

Use the formula: `(L1 + 0.05) / (L2 + 0.05)` where L1 is the relative luminance of the lighter color and L2 is the darker.

Recommended tools:

- **WebAIM Contrast Checker** (webaim.org/resources/contrastchecker) -- enter two hex values, get pass/fail.
- **Chrome DevTools** -- hover any element in the Styles panel to see the contrast ratio inline.
- **axe DevTools** -- automated scanning flags all contrast failures.
- **Stark** (Figma plugin) -- checks contrast during design phase.

## Dark Mode Considerations

Dark backgrounds introduce different challenges:

- Pure white `#FFFFFF` on pure black `#000000` (21:1) can cause halation for users with astigmatism. Use `text-gray-100` on `bg-gray-900` instead (15.1:1).
- Ensure colored text (links, warnings) still meets 4.5:1 against the dark background.
- Test both themes independently; a color that passes in light mode may fail in dark mode.

## Non-Text Contrast (1.4.11)

Interactive UI components must have 3:1 contrast against adjacent colors:

- Input field borders must contrast against the background.
- Icon buttons must contrast against their container.
- Focus rings must contrast against both the element and the page background.
- Chart segments, graph lines, and data visualization marks all require 3:1 contrast.
