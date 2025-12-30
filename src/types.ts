/**
 * Type definitions for indentation-based complexity analysis.
 *
 * Based on research by Hindle, Godfrey, and Holt on using
 * statistical moments of indentation as complexity proxies.
 */

/** Complexity level */
export type ComplexityLevel = 'low' | 'medium' | 'high';

/** Line-by-line indentation detail */
export interface LineDetail {
  /** 1-indexed line number in source */
  line: number;
  /** Logical indentation depth */
  depth: number;
  /** Line content (trimmed) */
  content: string;
}

/**
 * Simple complexity result (default).
 * This is what most consumers need.
 */
export interface ComplexityResult {
  /** Primary complexity score: Σ(depth²) / lineCount.
   * Deeper nesting contributes exponentially more. */
  score: number;
  /** Complexity level based on thresholds */
  level: ComplexityLevel;
  /** Human-readable explanation */
  reason: string;
}

/**
 * Detailed complexity result (when verbose: true).
 * Includes all statistical metrics for debugging/analysis.
 */
export interface ComplexityResultVerbose extends ComplexityResult {
  /** Number of non-empty, non-comment lines analyzed */
  lineCount: number;
  /** Maximum indentation depth */
  max: number;
  /** Variance of indentation - correlates with McCabe complexity */
  variance: number;
  /** Average indent depth */
  mean: number;
  /** Standard deviation of depths */
  stdDev: number;
  /** Median indent depth */
  median: number;
  /** Total indentation units across all lines */
  sum: number;
  /** Distribution of indent depths: depth -> count */
  depthHistogram: Record<number, number>;
}

/** Result with line-by-line details (when includeLines: true) */
export interface ComplexityResultWithLines extends ComplexityResultVerbose {
  /** Line-by-line indentation details */
  lines: LineDetail[];
}

/** Score thresholds for complexity levels */
export interface Thresholds {
  /** Score at or above this is 'medium' complexity */
  medium: number;
  /** Score at or above this is 'high' complexity */
  high: number;
}

/** Options for analyzeComplexity */
export interface AnalyzeOptions {
  /** Regex to identify comment lines. Set to null to include comments. */
  commentPattern?: RegExp | null;
  /** Custom thresholds for assessment levels */
  thresholds?: Partial<Thresholds>;
  /** Return detailed statistics (variance, max, histogram, etc.) */
  verbose?: boolean;
  /** Include line-by-line detail in output (implies verbose) */
  includeLines?: boolean;
}

/** Options for analyzeDiffComplexity */
export interface DiffOptions extends AnalyzeOptions {
  /** Which lines to analyze from the diff. Default: 'additions' */
  include?: 'additions' | 'deletions' | 'both';
}

/** Internal representation of a parsed line */
export interface ParsedLine {
  lineNumber: number;
  depth: number;
  content: string;
}
