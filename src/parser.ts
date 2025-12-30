/**
 * Line parsing and indentation detection.
 */

import detectIndent from 'detect-indent';
import type { ParsedLine } from './types.js';
import { DEFAULT_COMMENT_PATTERN } from './constants.js';

export interface ParseOptions {
  commentPattern?: RegExp | null;
}

export interface ParseResult {
  lines: ParsedLine[];
  indentUnit: number;
}

/**
 * Parse source content into lines with indentation depths.
 *
 * @param content - Source code content
 * @param options - Parsing options
 * @returns Parsed lines and detected indent unit
 */
export function parseContent(content: string, options: ParseOptions = {}): ParseResult {
  const { commentPattern = DEFAULT_COMMENT_PATTERN } = options;

  const rawLines = content.split('\n');
  const { amount, type } = detectIndent(content);
  const indentUnit = type === 'tab' ? 1 : amount || 1;

  const lines: ParsedLine[] = [];

  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i];
    if (line === undefined) continue;
    const trimmed = line.trim();

    // Skip empty lines
    if (trimmed.length === 0) {
      continue;
    }

    // Skip comment lines
    if (commentPattern !== null && commentPattern.test(line)) {
      continue;
    }

    const depth = computeIndentDepth(line, indentUnit);

    lines.push({
      lineNumber: i + 1,
      depth,
      content: trimmed,
    });
  }

  return { lines, indentUnit };
}

/**
 * Compute the logical indentation depth of a line.
 *
 * @param line - Raw line content
 * @param indentUnit - Number of spaces per indent level
 * @returns Logical indent depth
 */
export function computeIndentDepth(line: string, indentUnit: number): number {
  const leadingWhitespace = line.match(/^[\t ]*/)?.[0] ?? '';

  let charCount = 0;
  for (const char of leadingWhitespace) {
    charCount += char === '\t' ? indentUnit : 1;
  }

  return Math.floor(charCount / indentUnit);
}

const DIFF_HEADER_PREFIXES = ['diff ', 'index ', '+++', '---', '@@'];

function isDiffHeader(line: string): boolean {
  return DIFF_HEADER_PREFIXES.some((prefix) => line.startsWith(prefix));
}

function shouldIncludeLine(line: string, include: 'additions' | 'deletions' | 'both'): boolean {
  const isAddition = line.startsWith('+');
  const isDeletion = line.startsWith('-');

  if (!isAddition && !isDeletion) return false;

  if (include === 'additions') return isAddition;
  if (include === 'deletions') return isDeletion;
  // include === 'both'
  return true;
}

function extractDiffCodeLines(rawLines: string[]): string[] {
  return rawLines
    .filter((line) => line.startsWith('+') || line.startsWith('-'))
    .filter((line) => !line.startsWith('+++') && !line.startsWith('---'))
    .map((line) => line.slice(1));
}

/**
 * Parse a unified diff and extract lines based on filter.
 *
 * @param diff - Unified diff content
 * @param include - Which lines to include: 'additions', 'deletions', or 'both'
 * @param options - Parsing options
 * @returns Parsed lines from the diff
 */
export function parseDiff(
  diff: string,
  include: 'additions' | 'deletions' | 'both' = 'additions',
  options: ParseOptions = {}
): ParseResult {
  const { commentPattern = DEFAULT_COMMENT_PATTERN } = options;

  const rawLines = diff.split('\n');
  const codeLines = extractDiffCodeLines(rawLines);
  const codeContent = codeLines.join('\n');

  const { amount, type } = detectIndent(codeContent);
  const indentUnit = type === 'tab' ? 1 : amount || 1;

  const lines: ParsedLine[] = [];
  let lineNumber = 0;

  for (const line of rawLines) {
    if (isDiffHeader(line)) continue;
    if (!shouldIncludeLine(line, include)) continue;

    const content = line.slice(1);
    const trimmed = content.trim();
    lineNumber++;

    if (trimmed.length === 0) continue;
    if (commentPattern !== null && commentPattern.test(content)) continue;

    lines.push({
      lineNumber,
      depth: computeIndentDepth(content, indentUnit),
      content: trimmed,
    });
  }

  return { lines, indentUnit };
}
