import type { EventSource, MonotonicClock, NormalizedEvent } from '@gait/core';

export class ControlledClock implements MonotonicClock {
  private current = 0;

  now(): number {
    return this.current;
  }

  advanceBy(milliseconds: number): void {
    if (!Number.isFinite(milliseconds) || milliseconds < 0) throw new RangeError('milliseconds must be finite and >= 0');
    this.current += milliseconds;
  }

  set(milliseconds: number): void {
    if (!Number.isFinite(milliseconds) || milliseconds < 0) throw new RangeError('milliseconds must be finite and >= 0');
    this.current = milliseconds;
  }
}

export class SyntheticEventSource implements EventSource {
  private emit: ((event: NormalizedEvent) => void) | undefined;
  private active = false;

  start(emit: (event: NormalizedEvent) => void): void {
    this.emit = emit;
    this.active = true;
  }

  stop(): void {
    this.active = false;
  }

  dispose(): void {
    this.active = false;
    this.emit = undefined;
  }

  send(event: NormalizedEvent): boolean {
    if (!this.active || this.emit === undefined) return false;
    this.emit(event);
    return true;
  }
}

export interface BenchmarkScenario {
  readonly name: string;
  readonly durationMs: number;
  readonly eventsPerSecond: number;
  readonly signals: readonly ('keyboard' | 'pointer' | 'context')[];
}

export interface BenchmarkResult {
  readonly scenario: string;
  readonly eventsProcessed: number;
  readonly elapsedMs: number;
  readonly eventsPerSecond: number;
}

export function runSynchronousBenchmark(scenario: BenchmarkScenario, processEvent: (event: NormalizedEvent) => void): BenchmarkResult {
  if (scenario.durationMs <= 0 || scenario.eventsPerSecond <= 0) throw new RangeError('benchmark duration and rate must be > 0');
  const count = Math.ceil((scenario.durationMs / 1000) * scenario.eventsPerSecond);
  const started = Date.now();
  for (let index = 0; index < count; index += 1) {
    processEvent({
      kind: 'pointer-move',
      pointerId: 1,
      pointerType: 'mouse',
      x: index,
      y: index % 10,
      timestamp: index + 1,
      trusted: true,
    });
  }
  const elapsedMs = Date.now() - started;
  return { scenario: scenario.name, eventsProcessed: count, elapsedMs, eventsPerSecond: (count / Math.max(elapsedMs, 0.001)) * 1000 };
}
