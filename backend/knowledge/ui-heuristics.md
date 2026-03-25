# Nielsen's 10 Usability Heuristics

Jakob Nielsen's 10 usability heuristics are broad principles for interaction design. They are called "heuristics" because they are general rules of thumb rather than specific usability guidelines. Use these to evaluate UI prototypes during the Test stage.

## 1. Visibility of System Status

The system should always keep users informed about what is going on through appropriate feedback within a reasonable time.

**Example**: When a user submits a form, show a loading spinner immediately, then a success or error message. Do not leave the user staring at a static screen wondering if their click registered.

**Implementation**: Use `aria-live="polite"` regions for status updates. Show progress bars for long operations. Disable submit buttons during processing and change the label to "Submitting..."

## 2. Match Between System and Real World

The system should speak the users' language, with words, phrases, and concepts familiar to the user, rather than system-oriented terms.

**Example**: A shopping cart should say "Your Cart (3 items)" not "Active Transaction Queue: 3 Entities." An error message should say "We could not find that page" not "404: Resource Not Found."

**Implementation**: Use domain language from user research. Organize information in a natural, logical order. Use metaphors and conventions from the physical world when helpful.

## 3. User Control and Freedom

Users often perform actions by mistake. They need a clearly marked "emergency exit" to leave the unwanted state without going through an extended process.

**Example**: Provide an "Undo" option after deleting an item rather than an irreversible delete. Allow users to close modals by clicking outside or pressing Escape. Include "Cancel" buttons on every form.

**Implementation**: Support Ctrl+Z where applicable. Use confirmation dialogs only for destructive actions. Provide "Back" navigation that preserves state.

## 4. Consistency and Standards

Users should not have to wonder whether different words, situations, or actions mean the same thing. Follow platform and industry conventions.

**Example**: If blue underlined text is a link on one page, it should be a link on every page. If "Save" is in the top-right on one form, it should be in the top-right on all forms. Do not use "Submit" on one form and "Send" on another for the same action.

**Implementation**: Use a design system with consistent component patterns. Standardize button styles, colors, and placement across all views.

## 5. Error Prevention

Even better than good error messages is a design that prevents problems from occurring in the first place.

**Example**: Use input masks for phone numbers and dates. Disable the "Submit" button until required fields are completed. Show inline validation as the user types rather than only after submission.

**Implementation**: Use `type="email"`, `type="tel"`, `pattern` attributes. Provide auto-complete suggestions. Confirm destructive actions with a dialog that requires typing the item name.

## 6. Recognition Rather Than Recall

Minimize the user's memory load by making objects, actions, and options visible. The user should not have to remember information from one part of the interface to another.

**Example**: Show recently viewed items. Display breadcrumbs so users know where they are. Provide dropdown menus with options rather than empty text fields that require exact input.

**Implementation**: Use placeholder text as hints (but always pair with visible labels). Show search suggestions and autocomplete. Display contextual help inline rather than in a separate help page.

## 7. Flexibility and Efficiency of Use

Accelerators -- unseen by the novice user -- may speed up the interaction for the expert user so that the system can cater to both inexperienced and experienced users.

**Example**: Provide keyboard shortcuts (Ctrl+K for search, Ctrl+S for save). Support both click-and-drag and arrow-key interactions. Allow power users to use slash commands or command palettes.

**Implementation**: Show keyboard shortcuts in tooltips. Provide both a wizard flow for beginners and a direct form for experts. Support bulk actions for power users.

## 8. Aesthetic and Minimalist Design

Every extra unit of information in a dialogue competes with the relevant units of information and diminishes their relative visibility.

**Example**: A checkout page should show only the fields needed to complete the purchase. Move optional fields behind a "Show more options" toggle. Use whitespace generously to separate content groups.

**Implementation**: Follow a visual hierarchy with clear headings, consistent spacing, and limited color palette. Remove decorative elements that do not serve a functional purpose. Use progressive disclosure to hide complexity.

## 9. Help Users Recognize, Diagnose, and Recover from Errors

Error messages should be expressed in plain language (no codes), precisely indicate the problem, and constructively suggest a solution.

**Example**: Instead of "Invalid input in field 3," say "Please enter a valid email address (e.g., name@example.com)." Instead of "Error 500," say "Something went wrong on our end. Please try again in a few minutes."

**Implementation**: Place error messages adjacent to the field that caused the error. Use `aria-invalid="true"` and `aria-describedby` to link errors to inputs. Use red text with an error icon, but also include text -- do not rely on color alone.

## 10. Help and Documentation

Even though it is better if the system can be used without documentation, it may be necessary to provide help and documentation. Such information should be easy to search, focused on the user's task, list concrete steps, and not be too large.

**Example**: Provide contextual tooltips on complex form fields. Include an inline "What is this?" link next to unfamiliar terms. Offer a searchable help center rather than a single long FAQ page.

**Implementation**: Use `title` attributes sparingly (they are not accessible on mobile). Prefer visible hint text below form fields. Provide a `?` icon button that opens a focused help popover with `role="tooltip"` or a dialog.

## Using Heuristics in Evaluation

During the Test stage, evaluate the prototype against each heuristic:

1. Walk through every screen and interaction.
2. For each heuristic, note violations with severity ratings (cosmetic, minor, major, catastrophic).
3. Prioritize fixes: catastrophic and major issues must be resolved before shipping.
4. Use the heuristic number as a reference (e.g., "H4 violation: inconsistent button placement").
