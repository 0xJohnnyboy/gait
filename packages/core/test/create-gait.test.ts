import assert from 'node:assert/strict';
import test from 'node:test';
import { createGait } from '../src/index.ts';
import type { EventSource, NormalizedEvent } from '../src/index.ts';

class TestClock {
  private value = 0;

  now(): number {
    return this.value;
  }

  advanceBy(ms: number): void {
    this.value += ms;
  }
}

class TestSource implements EventSource {
  private emit?: (event: NormalizedEvent) => void;
  started = 0;
  stopped = 0;
  disposed = 0;

  start(emit: (event: NormalizedEvent) => void): void {
    this.started += 1;
    this.emit = emit;
  }

  stop(): void {
    this.stopped += 1;
  }

  dispose(): void {
    this.disposed += 1;
  }

  send(event: NormalizedEvent): void {
    this.emit?.(event);
  }
}

test('aggregates keyboard dwell and flight times without exporting key identity', () => {
  const clock = new TestClock();
  const source = new TestSource();
  const gait = createGait({ clock, eventSource: source });

  gait.start();
  source.send({ kind: 'key-down', keyId: 'internal-a', timestamp: 10, repeat: false, trusted: true });
  source.send({ kind: 'key-up', keyId: 'internal-a', timestamp: 90, trusted: true });
  source.send({ kind: 'key-down', keyId: 'internal-b', timestamp: 150, repeat: false, trusted: true });
  source.send({ kind: 'key-up', keyId: 'internal-b', timestamp: 210, trusted: true });

  const snapshot = gait.snapshot();
  assert.equal(snapshot.signals.keyboard.eventsSeen, 4);
  assert.equal(snapshot.signals.keyboard.eventsAccepted, 4);
  assert.equal(snapshot.signals.keyboard.dwellTimeMs?.n, 2);
  assert.equal(snapshot.signals.keyboard.dwellTimeMs?.mean, 70);
  assert.equal(snapshot.signals.keyboard.flightTimeMs?.n, 1);
  assert.equal(snapshot.signals.keyboard.flightTimeMs?.mean, 60);
  assert.equal(JSON.stringify(snapshot).includes('keyId'), false);
});

test('aggregates pointer distance and speed and rejects untrusted input', () => {
  const clock = new TestClock();
  const source = new TestSource();
  const gait = createGait({ clock, eventSource: source });
  gait.start();
  source.send({ kind: 'pointer-move', pointerId: 1, pointerType: 'mouse', x: 0, y: 0, timestamp: 10, trusted: true });
  source.send({ kind: 'pointer-move', pointerId: 1, pointerType: 'mouse', x: 3, y: 4, timestamp: 20, trusted: true });
  source.send({ kind: 'pointer-move', pointerId: 1, pointerType: 'mouse', x: 9, y: 4, timestamp: 30, trusted: false });

  const snapshot = gait.snapshot();
  assert.equal(snapshot.signals.pointer.sampleCount, 1);
  assert.equal(snapshot.signals.pointer.distancePx, 5);
  assert.equal(snapshot.signals.pointer.speedPxPerMs?.mean, 0.5);
  assert.equal(snapshot.signals.pointer.eventsRejected, 1);
});

test('lifecycle is idempotent and destroy prevents future use', () => {
  const source = new TestSource();
  const gait = createGait({ eventSource: source });
  gait.start();
  gait.start();
  gait.stop();
  gait.stop();
  gait.destroy();
  gait.destroy();

  assert.equal(source.started, 1);
  assert.equal(source.stopped, 1);
  assert.equal(source.disposed, 1);
  assert.throws(() => gait.snapshot(), { name: 'GaitDestroyedError' });
});

test('flush publishes one stable snapshot to subscribers', () => {
  const source = new TestSource();
  const gait = createGait({ eventSource: source });
  const snapshots: unknown[] = [];
  gait.subscribe((snapshot) => snapshots.push(snapshot));
  gait.start();
  const first = gait.flush();
  const second = gait.snapshot();

  assert.equal(first, second);
  assert.equal(snapshots.length, 1);
});
