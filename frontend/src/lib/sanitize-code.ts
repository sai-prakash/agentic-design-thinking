/**
 * Sanitize LLM-generated component code for react-live rendering.
 *
 * LLMs routinely ignore "no imports/exports" instructions, so we strip them
 * client-side before handing code to LiveProvider.
 */

interface SanitizeResult {
  code: string;
  warnings: string[];
  componentName: string | null;
}

/**
 * Strip markdown fences (```tsx ... ```) that LLMs wrap code in,
 * even when the code is already inside a JSON string value.
 */
function stripMarkdownFences(code: string): string {
  // Handle opening fence with optional language tag
  let cleaned = code.replace(/^```[a-zA-Z]*\s*\n?/gm, "");
  // Handle closing fence
  cleaned = cleaned.replace(/\n?```\s*$/gm, "");
  return cleaned.trim();
}

/**
 * Remove all import statements (ES module and CommonJS require).
 * Handles: import X from 'y', import { X } from 'y', import 'y',
 *          const X = require('y'), require('y')
 */
function stripImports(code: string): string {
  // ES module imports (single or multiline)
  // Match: import ... from '...'; or import '...';
  let cleaned = code.replace(
    /^\s*import\s+(?:[\s\S]*?\s+from\s+)?['"][^'"]*['"];?\s*$/gm,
    ""
  );
  // CommonJS require
  cleaned = cleaned.replace(
    /^\s*(?:const|let|var)\s+\w+\s*=\s*require\s*\(['"][^'"]*['"]\);?\s*$/gm,
    ""
  );
  return cleaned;
}

/**
 * Remove all export statements and convert them to plain declarations.
 * Handles: export default function, export const, export function, etc.
 */
function stripExports(code: string): string {
  let cleaned = code;
  // export default function Foo(...) → function Foo(...)
  cleaned = cleaned.replace(/^\s*export\s+default\s+/gm, "");
  // export function, export const, export let, export var, export class
  cleaned = cleaned.replace(/^\s*export\s+(?=(?:function|const|let|var|class)\s)/gm, "");
  // Standalone: export default Foo; or export { Foo };
  cleaned = cleaned.replace(/^\s*export\s+(?:default\s+\w+|\{[^}]*\})\s*;?\s*$/gm, "");
  return cleaned;
}

/**
 * Detect the component function name from the code.
 * Looks for: function Name(, const Name = (, const Name: ... = (
 */
function detectComponentName(code: string): string | null {
  // function declaration
  const fnMatch = code.match(
    /(?:^|\n)\s*function\s+([A-Z][A-Za-z0-9]*)\s*\(/
  );
  if (fnMatch) return fnMatch[1];

  // arrow function: const Name = (...)  or  const Name: FC = (...)
  const arrowMatch = code.match(
    /(?:^|\n)\s*(?:const|let|var)\s+([A-Z][A-Za-z0-9]*)\s*(?::[^=]*)?\s*=\s*(?:\([^)]*\)|[A-Za-z])\s*=>/
  );
  if (arrowMatch) return arrowMatch[1];

  // Arrow function without params: const Name = () =>
  const simpleArrow = code.match(
    /(?:^|\n)\s*(?:const|let|var)\s+([A-Z][A-Za-z0-9]*)\s*=\s*\(\s*\)\s*=>/
  );
  if (simpleArrow) return simpleArrow[1];

  return null;
}

/**
 * Strip TypeScript type annotations that react-live's Sucrase transform
 * might choke on. Handles common patterns:
 * - `: Type` after params, variables
 * - `<Type>` generic params on arrow functions (but not JSX)
 * - `interface` and `type` declarations
 */
function stripTypeAnnotations(code: string): string {
  let cleaned = code;

  // Remove standalone interface/type declarations (multiline)
  cleaned = cleaned.replace(
    /^\s*(?:interface|type)\s+\w+[\s\S]*?\n\}\s*;?\s*$/gm,
    ""
  );

  // Remove inline type annotations on function params - be conservative
  // `: string`, `: number`, `: boolean`, `: any`, `: React.XXX`, `: { ... }`
  // This is intentionally simple to avoid breaking JSX
  // We only strip obvious patterns
  cleaned = cleaned.replace(
    /:\s*(?:string|number|boolean|any|void|never|undefined|null|object)\b/g,
    ""
  );

  return cleaned;
}

/**
 * Ensure the code doesn't reference `React.` when react-live provides React
 * already in scope but not as a named export. Usually react-live exposes
 * React, useState, useEffect, etc. in scope — but `React.useState` also works
 * since we pass React in scope. This is a no-op check for now.
 */
function ensureReactReferences(code: string): string {
  // react-live: we pass React in scope so React.useState works fine
  return code;
}

/**
 * Remove blank lines clusters (3+ consecutive blank lines → 1 blank line)
 */
function collapseBlankLines(code: string): string {
  return code.replace(/\n{3,}/g, "\n\n");
}

/**
 * Main sanitizer: takes raw LLM output and returns react-live-safe code.
 */
export function sanitizeForReactLive(rawCode: string): SanitizeResult {
  const warnings: string[] = [];

  let code = rawCode;

  // Step 1: Strip markdown fences
  code = stripMarkdownFences(code);

  // Step 2: Strip imports
  const beforeImports = code;
  code = stripImports(code);
  if (code !== beforeImports) {
    warnings.push("Stripped import statements from generated code");
  }

  // Step 3: Strip exports
  const beforeExports = code;
  code = stripExports(code);
  if (code !== beforeExports) {
    warnings.push("Stripped export statements from generated code");
  }

  // Step 4: Detect component name
  const componentName = detectComponentName(code);

  // Step 5: Strip TS type annotations (conservative)
  code = stripTypeAnnotations(code);

  // Step 6: Ensure React references work
  code = ensureReactReferences(code);

  // Step 7: Clean up whitespace
  code = collapseBlankLines(code).trim();

  return { code, warnings, componentName };
}

/**
 * Build the final code string for react-live's LiveProvider.
 * Appends `render(<ComponentName />)` for noInline mode.
 */
export function buildRenderableCode(
  rawCode: string,
  expectedName: string = "PrototypeComponent"
): { code: string; warnings: string[]; usedName: string } {
  const result = sanitizeForReactLive(rawCode);

  // Use detected name, fall back to expected name
  const usedName = result.componentName || expectedName;

  // If detected name differs from expected, warn
  if (result.componentName && result.componentName !== expectedName) {
    result.warnings.push(
      `Component named "${result.componentName}" (expected "${expectedName}") — adjusted render call`
    );
  }

  // If no component detected at all, warn
  if (!result.componentName) {
    result.warnings.push(
      `Could not detect component function — using "${expectedName}" for render call`
    );
  }

  const code = `${result.code}\n\nrender(<${usedName} />);`;

  return { code, warnings: result.warnings, usedName };
}
