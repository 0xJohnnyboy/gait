import type { MetricSummary } from './types.js';

export class RunningStats {
  private count = 0;
  private total = 0;
  private meanValue = 0;
  private sumSquares = 0;
  private minimum = Number.POSITIVE_INFINITY;
  private maximum = Number.NEGATIVE_INFINITY;

  add(value: number): void {
    if (!Number.isFinite(value)) return;
    this.count += 1;
    this.total += value;
    this.minimum = Math.min(this.minimum, value);
    this.maximum = Math.max(this.maximum, value);
    const delta = value - this.meanValue;
    this.meanValue += delta / this.count;
    this.sumSquares += delta * (value - this.meanValue);
  }

  reset(): void {
    this.count = 0;
    this.total = 0;
    this.meanValue = 0;
    this.sumSquares = 0;
    this.minimum = Number.POSITIVE_INFINITY;
    this.maximum = Number.NEGATIVE_INFINITY;
  }

  summary(): MetricSummary | undefined {
    if (this.count === 0) return undefined;
    return {
      n: this.count,
      min: this.minimum,
      max: this.maximum,
      mean: this.meanValue,
      stdDev: Math.sqrt(this.sumSquares / this.count),
      sum: this.total,
    };
  }
}
