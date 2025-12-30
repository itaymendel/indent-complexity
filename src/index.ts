/**
 * Indentation-based complexity analysis.
 *
 * Uses statistical moments of indentation as a language-agnostic proxy
 * for code complexity, based on research by Hindle, Godfrey, and Holt.
 *
 * @see https://softwareprocess.es/static/WhiteSpace.html
 * @module indent-complexity
 */

// Main analysis functions
export { analyzeComplexity } from './analyze.js';
export { analyzeDiffComplexity } from './analyze-diff.js';

// Types
export type {
  ComplexityLevel,
  ComplexityResult,
  ComplexityResultVerbose,
  ComplexityResultWithLines,
  LineDetail,
  Thresholds,
  AnalyzeOptions,
  DiffOptions,
} from './types.js';

