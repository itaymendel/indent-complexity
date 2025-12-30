/**
 * Complexity analysis for unified diffs.
 *
 * Based on the SCAM 2008 paper which validated indentation metrics
 * specifically on revision histories and code changes.
 */

import type {
  DiffOptions,
  ComplexityResult,
  ComplexityResultVerbose,
  ComplexityResultWithLines,
} from './types.js';
import { parseDiff } from './parser.js';
import { buildResult } from './result-builder.js';

/**
 * Analyze complexity of a unified diff.
 *
 * Computes statistics only on changed lines (additions by default).
 * Useful for git hooks, CI pipelines, and code review tools.
 *
 * @example
 * ```typescript
 * const result = analyzeDiffComplexity(diff);
 * if (result.level === 'high') {
 *   console.warn('Complex code detected!');
 * }
 * ```
 */
export function analyzeDiffComplexity(
  diff: string,
  options?: DiffOptions & { verbose?: false; includeLines?: false }
): ComplexityResult;

export function analyzeDiffComplexity(
  diff: string,
  options: DiffOptions & { verbose: true; includeLines?: false }
): ComplexityResultVerbose;

export function analyzeDiffComplexity(
  diff: string,
  options: DiffOptions & { includeLines: true }
): ComplexityResultWithLines;

export function analyzeDiffComplexity(
  diff: string,
  options: DiffOptions = {}
): ComplexityResult | ComplexityResultVerbose | ComplexityResultWithLines {
  const { include = 'additions', verbose = false, includeLines = false, thresholds } = options;
  const { lines } = parseDiff(diff, include, { commentPattern: options.commentPattern });

  return buildResult(lines, { verbose, includeLines, userThresholds: thresholds });
}
