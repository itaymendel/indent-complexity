import type { Thresholds } from './types.js';

/**
 * Default pattern to identify comment lines.
 *
 * Covers common comment syntaxes across many languages:
 * - `//` - C-family (JavaScript, TypeScript, Java, C, C++, C#, Go, Rust, Swift, Kotlin)
 * - `/*`, `*` - C-style multi-line comments
 * - `#` - Python, Ruby, Shell, Perl, R, YAML, TOML
 * - `<!--` - HTML, XML, SVG
 * - `--` - SQL, Lua, Haskell, Ada
 */
export const DEFAULT_COMMENT_PATTERN = /^\s*(\/\/|\/\*|\*|#|<!--|--)/;

/**
 * Default score thresholds for complexity assessment.
 *
 * Score formula: Σ(depth²) / lineCount
 *
 * Typical ranges:
 * - 0-4: Simple, flat code
 * - 4-10: Moderate nesting
 * - 10+: Deep nesting, consider refactoring
 */
export const DEFAULT_THRESHOLDS: Thresholds = {
  medium: 4,
  high: 10,
};
