# React Component Patterns for Design Systems

Common UI component patterns with their key props, accessibility requirements, and Tailwind CSS class conventions. All components must be self-contained and renderable by react-live without external imports.

## Card

A content container with optional header, body, and footer sections.

Key props: `title`, `description`, `children`, `variant` (default, outlined, elevated), `onClick` (makes it interactive).

Accessibility: If clickable, use `role="article"` or wrap content in an `<a>` or `<button>`. Provide `aria-label` when the card action is not clear from visible text.

```jsx
<div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
  <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
  <p className="mt-2 text-sm text-slate-600">{description}</p>
  <div className="mt-4">{children}</div>
</div>
```

## Modal / Dialog

An overlay that captures focus and blocks interaction with the page behind it.

Key props: `isOpen`, `onClose`, `title`, `children`, `size` (sm, md, lg).

Accessibility: Use `role="dialog"`, `aria-modal="true"`, `aria-labelledby` pointing to the title. Trap focus inside. Close on Escape. Return focus to trigger on close.

```jsx
<div role="dialog" aria-modal="true" aria-labelledby="modal-title"
     className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
  <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
    <h2 id="modal-title" className="text-xl font-bold text-slate-900">{title}</h2>
    <div className="mt-4">{children}</div>
    <button onClick={onClose}
            className="mt-6 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700
                       focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
      Close
    </button>
  </div>
</div>
```

## Form with Validation

Collects user input with inline error feedback.

Key props: `fields` (array of field configs), `onSubmit`, `initialValues`, `validationRules`.

Accessibility: Every input needs a visible `<label>` linked via `htmlFor`/`id`. Error messages use `aria-describedby`. Invalid fields use `aria-invalid="true"`. Group related fields in `<fieldset>` with `<legend>`.

```jsx
<form onSubmit={handleSubmit} noValidate>
  <div className="space-y-4">
    <div>
      <label htmlFor="email" className="block text-sm font-medium text-slate-700">Email</label>
      <input id="email" type="email" aria-invalid={!!errors.email} aria-describedby="email-error"
             className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2
                        text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500" />
      {errors.email && <p id="email-error" role="alert" className="mt-1 text-sm text-red-600">{errors.email}</p>}
    </div>
    <button type="submit" className="rounded-lg bg-blue-600 px-4 py-2 text-white">Submit</button>
  </div>
</form>
```

## Data Table with Sorting

Displays tabular data with sortable column headers.

Key props: `columns` (array with key, label, sortable), `rows`, `onSort`, `sortColumn`, `sortDirection`.

Accessibility: Use native `<table>`, `<thead>`, `<tbody>`, `<th scope="col">`. Sortable headers need `aria-sort` ("ascending", "descending", or "none"). Sort buttons inside headers need descriptive `aria-label`.

```jsx
<table className="w-full text-left text-sm">
  <thead className="border-b border-slate-200 bg-slate-50">
    <tr>
      <th scope="col" aria-sort={sortDir} className="px-4 py-3 font-medium text-slate-700">
        <button onClick={() => onSort('name')} aria-label="Sort by name">
          Name {sortIcon}
        </button>
      </th>
    </tr>
  </thead>
  <tbody className="divide-y divide-slate-100">
    {rows.map(row => <tr key={row.id} className="hover:bg-slate-50">
      <td className="px-4 py-3 text-slate-900">{row.name}</td>
    </tr>)}
  </tbody>
</table>
```

## Navigation: Tabs

Switches between content panels without page navigation.

Key props: `tabs` (array of label/content), `activeIndex`, `onChange`.

Accessibility: Use `role="tablist"`, `role="tab"`, `role="tabpanel"`. Active tab gets `aria-selected="true"`. Arrow keys navigate between tabs. Tab key moves into the panel content. Each tab references its panel via `aria-controls`.

## Dropdown / Select

A custom select menu that opens a list of options.

Key props: `options`, `value`, `onChange`, `placeholder`, `disabled`.

Accessibility: Use `role="listbox"` on the options container, `role="option"` on each item. Trigger button uses `aria-haspopup="listbox"` and `aria-expanded`. Arrow keys navigate options. Enter selects. Escape closes.

## Toast / Notification

A temporary message that appears and auto-dismisses.

Key props: `message`, `type` (success, error, warning, info), `duration`, `onDismiss`.

Accessibility: Use `role="status"` for informational toasts and `role="alert"` for errors. Include a visible dismiss button. Do not auto-dismiss error toasts. Keep toast text concise.

```jsx
<div role="status" aria-live="polite"
     className="fixed bottom-4 right-4 flex items-center gap-3 rounded-lg bg-green-50
                border border-green-200 px-4 py-3 text-sm text-green-800 shadow-lg">
  <span>{message}</span>
  <button onClick={onDismiss} aria-label="Dismiss notification"
          className="text-green-600 hover:text-green-800">X</button>
</div>
```

## Accordion / Collapsible

Expandable content sections that show or hide details.

Key props: `items` (array of title/content), `allowMultiple`, `defaultOpen`.

Accessibility: Trigger is a `<button>` with `aria-expanded` and `aria-controls` pointing to the panel. Panel has `role="region"` and `aria-labelledby` pointing back to the trigger. Enter and Space toggle.

```jsx
<div className="divide-y divide-slate-200 rounded-lg border border-slate-200">
  <div>
    <button aria-expanded={isOpen} aria-controls="panel-1" id="header-1"
            className="flex w-full items-center justify-between px-4 py-3 text-left
                       font-medium text-slate-900 hover:bg-slate-50">
      {title}
      <span className={`transform transition-transform ${isOpen ? 'rotate-180' : ''}`}>V</span>
    </button>
    {isOpen && <div id="panel-1" role="region" aria-labelledby="header-1"
                    className="px-4 py-3 text-sm text-slate-600">{content}</div>}
  </div>
</div>
```
