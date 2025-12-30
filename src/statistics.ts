/**
 * Statistical computation functions for indentation depths.
 *
 * These are pure functions operating on arrays of numbers.
 */

export interface StatisticalMoments {
  score: number;
  sum: number;
  mean: number;
  variance: number;
  stdDev: number;
  median: number;
  max: number;
}

/**
 * Compute all statistical moments from an array of depths.
 *
 * @param depths - Array of indentation depth values
 * @returns Statistical moments (score, sum, mean, variance, stdDev, median, max)
 */
export function computeStatistics(depths: number[]): StatisticalMoments {
  if (depths.length === 0) {
    return {
      score: 0,
      sum: 0,
      mean: 0,
      variance: 0,
      stdDev: 0,
      median: 0,
      max: 0,
    };
  }

  const sum = depths.reduce((acc, d) => acc + d, 0);
  const mean = sum / depths.length;

  const squaredDiffs = depths.map((d) => (d - mean) ** 2);
  const variance = squaredDiffs.reduce((acc, d) => acc + d, 0) / depths.length;
  const stdDev = Math.sqrt(variance);

  const sorted = [...depths].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const median =
    sorted.length % 2 === 0
      ? ((sorted[mid - 1] ?? 0) + (sorted[mid] ?? 0)) / 2
      : (sorted[mid] ?? 0);

  const max = sorted.at(-1) ?? 0;

  // Complexity score: Σ(depth²) / lineCount
  // Deeper nesting contributes exponentially more, like cognitive complexity
  const sumSquaredDepths = depths.reduce((acc, d) => acc + d * d, 0);
  const score = sumSquaredDepths / depths.length;

  return { score, sum, mean, variance, stdDev, median, max };
}

/**
 * Build a histogram of depth occurrences.
 *
 * @param depths - Array of indentation depth values
 * @returns Record mapping depth to count of occurrences
 */
export function buildHistogram(depths: number[]): Record<number, number> {
  const histogram: Record<number, number> = {};

  for (const depth of depths) {
    histogram[depth] = (histogram[depth] ?? 0) + 1;
  }

  return histogram;
}
