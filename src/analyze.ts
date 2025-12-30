/**
 * Main complexity analysis function for source code.
 */

import type {
  AnalyzeOptions,
  ComplexityResult,
  ComplexityResultVerbose,
  ComplexityResultWithLines,
} from './types.js';
import { parseContent } from './parser.js';
import { buildResult } from './result-builder.js';

/**
 * Analyze indentation-based complexity of source code.
 *
 * Uses statistical moments of indentation as a language-agnostic proxy
 * for code complexity, based on research by Hindle, Godfrey, and Holt.
 *
 * @example
 * ```typescript
 * const result = analyzeComplexity(code);
 * console.log(result.score, result.level);
 *
 * const detailed = analyzeComplexity(code, { verbose: true });
 * console.log(detailed.variance, detailed.max);
 * ```
 */
export function analyzeComplexity(
  content: string,
  options?: AnalyzeOptions & { verbose?: false; includeLines?: false }
): ComplexityResult;

export function analyzeComplexity(
  content: string,
  options: AnalyzeOptions & { verbose: true; includeLines?: false }
): ComplexityResultVerbose;

export function analyzeComplexity(
  content: string,
  options: AnalyzeOptions & { includeLines: true }
): ComplexityResultWithLines;

export function analyzeComplexity(
  content: string,
  options: AnalyzeOptions = {}
): ComplexityResult | ComplexityResultVerbose | ComplexityResultWithLines {
  const { verbose = false, includeLines = false, thresholds } = options;
  const { lines } = parseContent(content, { commentPattern: options.commentPattern });

  return buildResult(lines, { verbose, includeLines, userThresholds: thresholds });
}
