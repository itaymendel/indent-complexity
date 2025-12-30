# indent-complexity

A language-agnostic code complexity analyzer. Works on **any language** by [measuring indentation depth](https://softwareprocess.es/static/WhiteSpace.html).

## Usage

```bash
npm install indent-complexity
```

```typescript
import { analyzeComplexity, analyzeDiffComplexity } from 'indent-complexity';

// Pass any code snippet, function of complete file to get complexity assessment:
const codeComplexity = analyzeComplexity(codeSnippet);
console.log(codeComplexity.score);

// Also supports `git diff` output to evaluate complexity for added lines (by default):
const diffComplexity = analyzeDiffComplexity(gitDiff);
console.log(diffComplexity.score);
```

## The Score

Unfortunately none of the researchers suggests a single-metric similar to how Cyclomatic and Cognitive complexity work. So I decided to suggest one:

```
Σ(depth²) / lineCount
```

I chose depth squared weighting because:

- Mirrors cognitive complexity principles (nested code is harder to understand)
- Normalized by line count for cross-file comparison
- Shallow-but-wide code scores low; deep code scores high

Default thresholds:

| Level    | Score  |
| -------- | ------ |
| `low`    | < 4    |
| `medium` | 4 - 10 |
| `high`   | ≥ 10   |

`verbose: true` returns all research-backed metrics for you to experiment and explore:

| Metric           | Description                                  |
| ---------------- | -------------------------------------------- |
| `variance`       | Correlates with McCabe cyclomatic complexity |
| `max`            | Deepest nesting level                        |
| `mean`           | Average depth per line                       |
| `lineCount`      | Lines analyzed (excluding comments/blanks)   |
| `depthHistogram` | Distribution of depths                       |

## License

MIT
