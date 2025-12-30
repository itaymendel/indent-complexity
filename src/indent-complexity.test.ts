import { describe, it, expect } from 'vitest';
import { analyzeComplexity, analyzeDiffComplexity } from './index.js';
import { DEFAULT_COMMENT_PATTERN, DEFAULT_THRESHOLDS } from './constants.js';

describe('analyzeComplexity', () => {
  describe('basic functionality', () => {
    it('should return simple result by default', () => {
      const result = analyzeComplexity('const x = 1;');

      expect(result).toHaveProperty('score');
      expect(result).toHaveProperty('level');
      expect(result).toHaveProperty('reason');
      expect(result).not.toHaveProperty('variance');
      expect(result).not.toHaveProperty('lineCount');
    });

    it('should return zero score for empty content', () => {
      const result = analyzeComplexity('');

      expect(result.score).toBe(0);
      expect(result.level).toBe('low');
    });

    it('should return verbose stats when requested', () => {
      const result = analyzeComplexity('const x = 1;', { verbose: true });

      expect(result.sum).toBe(0);
      expect(result.mean).toBe(0);
      expect(result.variance).toBe(0);
      expect(result.stdDev).toBe(0);
      expect(result.median).toBe(0);
      expect(result.max).toBe(0);
      expect(result.lineCount).toBe(1);
    });

    it('should return zero stats for only blank lines', () => {
      const result = analyzeComplexity('\n\n\n', { verbose: true });

      expect(result.lineCount).toBe(0);
      expect(result.sum).toBe(0);
    });

    it('should count flat code correctly', () => {
      const content = `a
b
c`;
      const result = analyzeComplexity(content, { verbose: true });

      expect(result.lineCount).toBe(3);
      expect(result.sum).toBe(0); // All at depth 0
      expect(result.mean).toBe(0);
      expect(result.variance).toBe(0);
      expect(result.max).toBe(0);
    });

    it('should compute statistics for nested code', () => {
      const content = `function foo() {
  if (true) {
    console.log('nested');
  }
}`;
      const result = analyzeComplexity(content, { verbose: true });

      // depths: [0, 1, 2, 1, 0]
      expect(result.lineCount).toBe(5);
      expect(result.sum).toBe(4); // 0+1+2+1+0
      expect(result.mean).toBeCloseTo(0.8); // 4/5
      expect(result.max).toBe(2);
      expect(result.depthHistogram).toEqual({ 0: 2, 1: 2, 2: 1 });
    });
  });

  describe('statistical moments (verbose)', () => {
    it('should compute variance correctly', () => {
      // Create code with known variance
      const content = `a
  b
    c
  d
e`;
      // depths: [0, 1, 2, 1, 0]
      // mean = 4/5 = 0.8
      // variance = ((0-0.8)² + (1-0.8)² + (2-0.8)² + (1-0.8)² + (0-0.8)²) / 5
      //          = (0.64 + 0.04 + 1.44 + 0.04 + 0.64) / 5
      //          = 2.8 / 5 = 0.56
      const result = analyzeComplexity(content, { verbose: true });

      expect(result.variance).toBeCloseTo(0.56);
      expect(result.stdDev).toBeCloseTo(Math.sqrt(0.56));
    });

    it('should compute median correctly for odd count', () => {
      const content = `a
  b
    c
      d
        e`;
      // depths: [0, 1, 2, 3, 4] - median is 2
      const result = analyzeComplexity(content, { verbose: true });

      expect(result.median).toBe(2);
    });

    it('should compute median correctly for even count', () => {
      const content = `a
  b
    c
      d`;
      // depths: [0, 1, 2, 3] - median is (1+2)/2 = 1.5
      const result = analyzeComplexity(content, { verbose: true });

      expect(result.median).toBe(1.5);
    });
  });

  describe('comment filtering', () => {
    it('should skip // comments by default', () => {
      const content = `function foo() {
  // this is a comment
  return 1;
}`;
      const result = analyzeComplexity(content, { verbose: true });

      // Should only count 3 lines (function, return, closing brace)
      expect(result.lineCount).toBe(3);
    });

    it('should skip multi-line /* */ comments', () => {
      const content = `function foo() {
  /*
   * multi-line comment
   */
  return 1;
}`;
      const result = analyzeComplexity(content, { verbose: true });

      expect(result.lineCount).toBe(3);
    });

    it('should skip # comments (Python/Ruby/Shell)', () => {
      const content = `def foo():
  # this is a comment
  return 1`;
      const result = analyzeComplexity(content, { verbose: true });

      expect(result.lineCount).toBe(2);
    });

    it('should allow disabling comment filtering with null', () => {
      const content = `function foo() {
  // this is a comment
  return 1;
}`;
      const result = analyzeComplexity(content, { verbose: true, commentPattern: null });

      expect(result.lineCount).toBe(4);
    });

    it('should allow custom comment pattern', () => {
      const content = `function foo() {
  // skip this
  # but not this
  return 1;
}`;
      const result = analyzeComplexity(content, { verbose: true, commentPattern: /^\s*\/\// });

      // Only // is skipped, # is counted
      expect(result.lineCount).toBe(4);
    });
  });

  describe('assessment', () => {
    it('should assess flat code as low complexity', () => {
      const content = `a
b
c
d
e`;
      const result = analyzeComplexity(content);

      expect(result.level).toBe('low');
    });

    it('should assess deeply nested code as high complexity', () => {
      const content = `a
  b
    c
      d
        e
          f
            g`;
      const result = analyzeComplexity(content);

      // score > 10 triggers high
      expect(result.level).toBe('high');
      expect(result.reason).toContain('high threshold');
    });

    it('should assess medium complexity code', () => {
      // Code with moderate nesting - score between 4 and 10
      // depths: [0,1,2,3,4,3,2,1,0] -> sum(d²)=44, score=44/9≈4.9
      const content = `a
  b
    c
      d
        e
      f
    g
  h
i`;
      const result = analyzeComplexity(content);

      // score ~4.9 should be medium (threshold: 4)
      expect(result.level).toBe('medium');
    });

    it('should respect custom thresholds', () => {
      const content = `a
  b
    c`;
      // Default thresholds: score ~1.3 is low
      const defaultResult = analyzeComplexity(content);
      expect(defaultResult.level).toBe('low');

      // With strict thresholds: score >= 1 is high
      const strictResult = analyzeComplexity(content, {
        thresholds: { medium: 0.5, high: 1 },
      });
      expect(strictResult.level).toBe('high');
    });
  });

  describe('includeLines option', () => {
    it('should not include lines by default', () => {
      const content = `a
  b`;
      const result = analyzeComplexity(content);

      expect('lines' in result).toBe(false);
    });

    it('should include lines when requested', () => {
      const content = `function foo() {
  return 1;
}`;
      const result = analyzeComplexity(content, { includeLines: true });

      expect(result.lines).toBeDefined();
      expect(result.lines).toHaveLength(3);
      expect(result.lines[0]).toEqual({
        line: 1,
        depth: 0,
        content: 'function foo() {',
      });
      expect(result.lines[1]).toEqual({
        line: 2,
        depth: 1,
        content: 'return 1;',
      });
    });
  });

  describe('indentation detection', () => {
    it('should handle tabs', () => {
      const content = `a
\tb
\t\tc`;
      const result = analyzeComplexity(content, { verbose: true });

      expect(result.max).toBe(2);
      expect(result.depthHistogram).toEqual({ 0: 1, 1: 1, 2: 1 });
    });

    it('should handle 2-space indentation', () => {
      const content = `a
  b
    c`;
      const result = analyzeComplexity(content, { verbose: true });

      expect(result.max).toBe(2);
    });

    it('should handle 4-space indentation', () => {
      const content = `a
    b
        c`;
      const result = analyzeComplexity(content, { verbose: true });

      expect(result.max).toBe(2);
    });
  });

  describe('realistic code', () => {
    it('should analyze TypeScript code', () => {
      const content = `export function processData(items: string[]): Result {
  const results: Result[] = [];

  for (const item of items) {
    if (item.length > 0) {
      const processed = item.trim();
      if (processed.startsWith('test')) {
        results.push({
          value: processed,
          valid: true,
        });
      }
    }
  }

  return results;
}`;
      const result = analyzeComplexity(content, { verbose: true });

      expect(result.lineCount).toBeGreaterThan(10);
      expect(result.max).toBeGreaterThanOrEqual(4);
      expect(result.variance).toBeGreaterThan(0);
    });
  });
});

describe('analyzeDiffComplexity', () => {
  const sampleDiff = `diff --git a/src/app.ts b/src/app.ts
index 1234567..abcdefg 100644
--- a/src/app.ts
+++ b/src/app.ts
@@ -10,6 +10,12 @@ export function processOrders(orders: Order[]) {
       if (validated.isValid) {
         for (const item of order.items) {
+          if (item.quantity > 0) {
+            const processed = {
+              id: item.id,
+              total: item.price * item.quantity,
+            };
+            results.push(processed);
+          }
         }
       }
`;

  describe('basic functionality', () => {
    it('should return simple result by default', () => {
      const result = analyzeDiffComplexity(sampleDiff);

      expect(result).toHaveProperty('score');
      expect(result).toHaveProperty('level');
      expect(result).toHaveProperty('reason');
      expect(result).not.toHaveProperty('lineCount');
    });

    it('should analyze additions by default', () => {
      const result = analyzeDiffComplexity(sampleDiff, { verbose: true });

      expect(result.lineCount).toBe(7);
    });

    it('should return zero stats for empty diff', () => {
      const result = analyzeDiffComplexity('', { verbose: true });

      expect(result.lineCount).toBe(0);
      expect(result.sum).toBe(0);
    });

    it('should skip diff headers', () => {
      const diff = `diff --git a/file.ts b/file.ts
--- a/file.ts
+++ b/file.ts
@@ -1,3 +1,4 @@
+newline`;
      const result = analyzeDiffComplexity(diff, { verbose: true });

      expect(result.lineCount).toBe(1);
      expect(result.depthHistogram).toEqual({ 0: 1 });
    });
  });

  describe('include option', () => {
    const diffWithBoth = `@@ -1,3 +1,3 @@
-old line
-  old nested
+new line
+    new deeply nested`;

    it('should analyze only additions by default', () => {
      const result = analyzeDiffComplexity(diffWithBoth, { verbose: true });

      expect(result.lineCount).toBe(2);
    });

    it('should analyze only deletions when specified', () => {
      const result = analyzeDiffComplexity(diffWithBoth, { verbose: true, include: 'deletions' });

      expect(result.lineCount).toBe(2);
    });

    it('should analyze both when specified', () => {
      const result = analyzeDiffComplexity(diffWithBoth, { verbose: true, include: 'both' });

      expect(result.lineCount).toBe(4);
    });
  });

  describe('includeLines option', () => {
    it('should include lines when requested', () => {
      const diff = `@@ -1,1 +1,2 @@
+function foo() {
+  return 1;`;
      const result = analyzeDiffComplexity(diff, { includeLines: true });

      expect(result.lines).toBeDefined();
      expect(result.lines).toHaveLength(2);
    });
  });

  describe('comment filtering', () => {
    it('should skip comments in diffs', () => {
      const diff = `@@ -1,1 +1,3 @@
+function foo() {
+  // comment
+  return 1;`;
      const result = analyzeDiffComplexity(diff, { verbose: true });

      expect(result.lineCount).toBe(2);
    });
  });
});

describe('DEFAULT_COMMENT_PATTERN', () => {
  it('should match // comments', () => {
    expect(DEFAULT_COMMENT_PATTERN.test('// comment')).toBe(true);
    expect(DEFAULT_COMMENT_PATTERN.test('  // indented')).toBe(true);
  });

  it('should match /* and * comments', () => {
    expect(DEFAULT_COMMENT_PATTERN.test('/* start */')).toBe(true);
    expect(DEFAULT_COMMENT_PATTERN.test(' * continuation')).toBe(true);
  });

  it('should match # comments', () => {
    expect(DEFAULT_COMMENT_PATTERN.test('# comment')).toBe(true);
  });

  it('should match <!-- comments', () => {
    expect(DEFAULT_COMMENT_PATTERN.test('<!-- comment -->')).toBe(true);
  });

  it('should match -- comments', () => {
    expect(DEFAULT_COMMENT_PATTERN.test('-- SQL comment')).toBe(true);
  });

  it('should not match regular code', () => {
    expect(DEFAULT_COMMENT_PATTERN.test('const x = 1;')).toBe(false);
    expect(DEFAULT_COMMENT_PATTERN.test('function foo() {')).toBe(false);
  });
});

describe('DEFAULT_THRESHOLDS', () => {
  it('should have expected structure', () => {
    expect(DEFAULT_THRESHOLDS.medium).toBe(4);
    expect(DEFAULT_THRESHOLDS.high).toBe(10);
  });
});
