# WCAG Keyboard Navigation and Focus Management

All interactive content must be fully operable with a keyboard alone. This is a foundational requirement for users who cannot use a mouse, including screen reader users, motor-impaired users, and power users who prefer keyboard workflows.

## Core Keyboard Requirements

### All Interactive Elements Must Be Focusable

Native HTML elements like `<button>`, `<a href>`, `<input>`, `<select>`, and `<textarea>` are focusable by default. When building custom components:

- Use native elements whenever possible instead of `<div>` or `<span>` with click handlers.
- If you must use a non-interactive element, add `tabindex="0"` and appropriate `role` and keyboard event handlers.
- Never use `tabindex` values greater than 0. This overrides the natural DOM order and creates unpredictable navigation.

```jsx
// BAD: div with click handler, not keyboard accessible
<div onClick={handleClick}>Submit</div>

// GOOD: native button, keyboard accessible by default
<button onClick={handleClick}>Submit</button>

// ACCEPTABLE: custom element with proper attributes
<div role="button" tabindex={0} onClick={handleClick} onKeyDown={handleKeyDown}>
  Submit
</div>
```

### Visible Focus Indicators (WCAG 2.4.7)

Every focusable element must show a visible focus ring. The default browser outline is acceptable but often gets removed by CSS resets.

Tailwind CSS focus patterns:

```
focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
```

Minimum requirements for focus indicators:

- At least 2px wide outline or border change.
- Contrast ratio of 3:1 against adjacent colors (WCAG 1.4.11).
- Visible in both light and dark modes.
- Never use `outline: none` or `outline: 0` without a replacement indicator.

### Logical Tab Order (WCAG 2.4.3)

Focus must move in a logical reading order, typically left-to-right, top-to-bottom in LTR languages. Ensure:

- DOM order matches visual order. Do not rely on CSS to reorder elements.
- Flexbox `order` and CSS Grid placement can break tab order when the visual layout diverges from DOM sequence.
- Group related controls (e.g., form fields) in a `<fieldset>`.

## Skip Navigation (WCAG 2.4.1)

Provide a "Skip to main content" link as the first focusable element on the page. It should be visually hidden until focused:

```jsx
<a href="#main-content"
   className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4
              focus:z-50 focus:bg-white focus:px-4 focus:py-2 focus:text-blue-700">
  Skip to main content
</a>
```

The target must have a matching `id`:

```jsx
<main id="main-content" tabIndex={-1}>...</main>
```

## No Keyboard Traps (WCAG 2.1.2)

A keyboard trap occurs when a user can Tab into a component but cannot Tab out. This is a critical failure. Common traps:

- Embedded widgets (video players, rich text editors) that consume all key events.
- Infinite focus loops without an exit mechanism.
- Custom select dropdowns that do not close on Escape.

Prevention: always test that pressing Tab or Shift+Tab eventually moves focus out of any component.

## Focus Management for Modals and Dialogs

Modals require careful focus handling to remain accessible:

1. **Trap focus inside the modal** while it is open. Tab and Shift+Tab cycle through only the modal's focusable elements.
2. **Move focus into the modal** when it opens -- typically to the first focusable element or the close button.
3. **Restore focus** to the trigger element when the modal closes.
4. **Close on Escape** key press.

```jsx
// Focus trap pattern
const focusableElements = modal.querySelectorAll(
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
);
const firstElement = focusableElements[0];
const lastElement = focusableElements[focusableElements.length - 1];

modal.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeModal();
  if (e.key === 'Tab') {
    if (e.shiftKey && document.activeElement === firstElement) {
      e.preventDefault();
      lastElement.focus();
    } else if (!e.shiftKey && document.activeElement === lastElement) {
      e.preventDefault();
      firstElement.focus();
    }
  }
});
```

## Common Keyboard Interaction Patterns

| Component | Keys | Behavior |
|---|---|---|
| Button | Enter, Space | Activate |
| Link | Enter | Navigate |
| Checkbox | Space | Toggle |
| Radio group | Arrow keys | Move selection |
| Tabs | Arrow keys | Switch tab; Tab moves to panel |
| Dropdown | Arrow keys, Enter, Escape | Navigate options, select, close |
| Modal | Escape | Close |
| Menu | Arrow keys, Enter, Escape | Navigate, activate, close |

## Testing Keyboard Accessibility

1. Unplug or disable the mouse.
2. Press Tab to move through all interactive elements.
3. Verify visible focus on every element.
4. Confirm all actions can be triggered with Enter or Space.
5. Test Escape closes overlays and dropdowns.
6. Verify no keyboard traps exist anywhere in the flow.
