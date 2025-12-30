/**
 * Shared result building logic for complexity analysis.
 */

import type {
  ComplexityResult,
  ComplexityResultVerbose,
  ComplexityResultWithLines,
  LineDetail,
  ParsedLine,
  Thresholds,
} from './types.js';
import { computeStatistics, buildHistogram } from './statistics.js';
import { assessComplexity, resolveThresholds } from './assessment.js';

interface BuildResultOptions {
  verbose: boolean;
  includeLines: boolean;
  userThresholds?: Partial<Thresholds>;
}

export function buildResult(
  lines: ParsedLine[],
  options: BuildResultOptions
): ComplexityResult | ComplexityResultVerbose | ComplexityResultWithLines {
  const { verbose, includeLines, userThresholds } = options;

  const depths = lines.map((l) => l.depth);
  const stats = computeStatistics(depths);
  const thresholds = resolveThresholds(userThresholds);
  const assessment = assessComplexity(stats.score, thresholds);

  const result: ComplexityResult = {
    score: stats.score,
    level: assessment.level,
    reason: assessment.reason,
  };

  if (!verbose && !includeLines) {
    return result;
  }

  const verboseResult: ComplexityResultVerbose = {
    ...result,
    lineCount: lines.length,
    max: stats.max,
    variance: stats.variance,
    mean: stats.mean,
    stdDev: stats.stdDev,
    median: stats.median,
    sum: stats.sum,
    depthHistogram: buildHistogram(depths),
  };

  if (includeLines) {
    const lineDetails: LineDetail[] = lines.map((l) => ({
      line: l.lineNumber,
      depth: l.depth,
      content: l.content,
    }));
    return { ...verboseResult, lines: lineDetails } as ComplexityResultWithLines;
  }

  return verboseResult;
}
