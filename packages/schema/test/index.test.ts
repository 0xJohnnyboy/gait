import assert from 'node:assert/strict';
import test from 'node:test';
import { isGaitSnapshot } from '../src/index.ts';

test('validates the versioned snapshot envelope', () => {
  const snapshot = {
    schemaVersion: '1.0',
    libraryVersion: '0.1.0',
    capturedAt: { durationMs: 1, startedAtMonotonicMs: 0 },
    signals: { keyboard: {}, pointer: {}, touch: {}, wheel: {}, context: {} },
    quality: { confidence: {} },
  };
  assert.equal(isGaitSnapshot(snapshot), true);
  assert.equal(isGaitSnapshot({ ...snapshot, schemaVersion: '2.0' }), false);
  assert.equal(isGaitSnapshot(null), false);
});
