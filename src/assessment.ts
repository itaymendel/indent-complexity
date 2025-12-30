/**
 * Score-based complexity assessment.
 */

import type { ComplexityLevel, Thresholds } from './types.js';
import { DEFAULT_THRESHOLDS } from './constants.js';

/**
 * Merge user thresholds with defaults.
 */
export function resolveThresholds(userThresholds?: Partial<Thresholds>): Thresholds {
  if (!userThresholds) {
    return DEFAULT_THRESHOLDS;
  }
  return { ...DEFAULT_THRESHOLDS, ...userThresholds };
}

/**
 * Determine complexity level from score.
 */
export function assessComplexity(
  score: number,
  thresholds: Thresholds
): { level: ComplexityLevel; reason: string } {
  if (score >= thresholds.high) {
    return {
      level: 'high',
      reason: `Score ${score.toFixed(1)} exceeds high threshold (${thresholds.high})`,
    };
  }

  if (score >= thresholds.medium) {
    return {
      level: 'medium',
      reason: `Score ${score.toFixed(1)} exceeds medium threshold (${thresholds.medium})`,
    };
  }

  return {
    level: 'low',
    reason: 'Score indicates simple, low-nesting code',
  };
}
