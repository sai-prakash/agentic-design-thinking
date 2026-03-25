# WCAG 2.1 AA Compliance Checklist

A concise reference for the four WCAG 2.1 Level AA principles. Every UI component produced by this system must satisfy these criteria before shipping.

## Perceivable

Users must be able to perceive all information and UI components.

- **1.1.1 Non-text Content**: Every `<img>`, `<svg>`, and icon must have a text alternative (`alt`, `aria-label`, or `aria-labelledby`). Decorative images use `alt=""` and `aria-hidden="true"`.
- **1.2.1 Audio/Video Alternatives**: Pre-recorded audio needs transcripts; pre-recorded video needs captions or audio descriptions.
- **1.2.5 Audio Description**: Pre-recorded video content must provide audio description of visual-only information.
- **1.3.1 Info and Relationships**: Use semantic HTML (`<nav>`, `<main>`, `<section>`, `<table>`, `<fieldset>`) so structure is programmatically determinable. Do not rely on visual styling alone to convey meaning.
- **1.3.4 Orientation**: Content must not be restricted to a single display orientation unless essential.
- **1.4.1 Use of Color**: Color must not be the only visual means of conveying information. Pair color with text labels, icons, or patterns.
- **1.4.3 Contrast (Minimum)**: Text must have a contrast ratio of at least 4.5:1 against its background. Large text (18pt or 14pt bold) requires 3:1.
- **1.4.4 Resize Text**: Text must be resizable up to 200% without loss of content or functionality.
- **1.4.5 Images of Text**: Avoid images of text; use styled HTML text instead.
- **1.4.10 Reflow**: Content must reflow at 320px width without horizontal scrolling.
- **1.4.11 Non-text Contrast**: UI components and graphical objects must have 3:1 contrast against adjacent colors.

## Operable

Users must be able to operate all interface components and navigation.

- **2.1.1 Keyboard**: All functionality must be operable via keyboard. No mouse-only interactions.
- **2.1.2 No Keyboard Trap**: Users must be able to navigate away from any component using only the keyboard (typically Tab and Escape).
- **2.2.1 Timing Adjustable**: If a time limit exists, the user must be able to turn off, adjust, or extend it.
- **2.3.1 Three Flashes**: No content flashes more than three times per second.
- **2.4.1 Bypass Blocks**: Provide a "Skip to main content" link at the top of the page.
- **2.4.2 Page Titled**: Every page or view must have a descriptive `<title>`.
- **2.4.3 Focus Order**: Tab order must follow a logical, meaningful sequence that preserves meaning and operability.
- **2.4.4 Link Purpose**: Each link's purpose must be determinable from its text or its surrounding context.
- **2.4.6 Headings and Labels**: Headings and labels must describe the topic or purpose of their content.
- **2.4.7 Focus Visible**: Keyboard focus indicators must be visible on all interactive elements.
- **2.5.1 Pointer Gestures**: Multi-point or path-based gestures must have single-pointer alternatives.

## Understandable

Users must be able to understand information and the operation of the UI.

- **3.1.1 Language of Page**: Set the `lang` attribute on the `<html>` element.
- **3.1.2 Language of Parts**: Mark up content in a different language with the appropriate `lang` attribute.
- **3.2.1 On Focus**: Changing focus must not automatically trigger a change of context.
- **3.2.2 On Input**: Changing a form input must not automatically trigger a change of context unless the user is informed beforehand.
- **3.3.1 Error Identification**: Input errors must be detected and described to the user in text.
- **3.3.2 Labels or Instructions**: Provide labels or instructions when user input is required.
- **3.3.3 Error Suggestion**: When an input error is detected, suggest a correction if possible.
- **3.3.4 Error Prevention (Legal/Financial)**: For submissions with legal or financial consequences, allow review, confirmation, or reversal.

## Robust

Content must be robust enough to be interpreted by a wide variety of user agents and assistive technologies.

- **4.1.1 Parsing**: HTML must be well-formed with no duplicate IDs, proper nesting, and complete open/close tags.
- **4.1.2 Name, Role, Value**: All UI components must expose their name, role, and value to assistive technologies. Use native HTML elements or proper ARIA attributes.
- **4.1.3 Status Messages**: Status messages (success alerts, error banners, loading indicators) must be programmatically determinable via `role="status"` or `role="alert"` without receiving focus.
