import type { MetricSummary } from './types.js';

export class RunningStats {
  private static readonly sampleCapacity = 256;
  private count = 0;
  private total = 0;
  private meanValue = 0;
  private sumSquares = 0;
  private minimum = Number.POSITIVE_INFINITY;
  private maximum = Number.NEGATIVE_INFINITY;
  private readonly samples = new Float64Array(RunningStats.sampleCapacity);
  private sampleCount = 0;
  private sampleCursor = 0;

  add(value: number): void {
    if (!Number.isFinite(value)) return;
    this.count += 1;
    this.total += value;
    this.minimum = Math.min(this.minimum, value);
    this.maximum = Math.max(this.maximum, value);
    const delta = value - this.meanValue;
    this.meanValue += delta / this.count;
    this.sumSquares += delta * (value - this.meanValue);
    this.samples[this.sampleCursor] = value;
    this.sampleCursor = (this.sampleCursor + 1) % RunningStats.sampleCapacity;
    this.sampleCount = Math.min(this.sampleCount + 1, RunningStats.sampleCapacity);
  }

  reset(): void {
    this.count = 0;
    this.total = 0;
    this.meanValue = 0;
    this.sumSquares = 0;
    this.minimum = Number.POSITIVE_INFINITY;
    this.maximum = Number.NEGATIVE_INFINITY;
    this.samples.fill(0);
    this.sampleCount = 0;
    this.sampleCursor = 0;
  }

  summary(): MetricSummary | undefined {
    if (this.count === 0) return undefined;
    const ordered = Array.from(this.samples.subarray(0, this.sampleCount)).sort((left, right) => left - right);
    const percentile = (ratio: number): number => ordered[Math.min(ordered.length - 1, Math.floor((ordered.length - 1) * ratio))] ?? this.meanValue;
    return {
      n: this.count,
      min: this.minimum,
      max: this.maximum,
      mean: this.meanValue,
      p50: percentile(0.5),
      p90: percentile(0.9),
      p95: percentile(0.95),
      stdDev: Math.sqrt(this.sumSquares / this.count),
      sum: this.total,
    };
  }
}
