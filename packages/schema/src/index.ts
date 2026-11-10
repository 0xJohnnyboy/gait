import type { GaitSnapshot } from '@gait/core';

export const GAIT_SCHEMA_VERSION = '1.0' as const;

export function isGaitSnapshot(value: unknown): value is GaitSnapshot {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Partial<GaitSnapshot>;
  const capturedAt = candidate.capturedAt;
  const signals = candidate.signals;
  const quality = candidate.quality;
  return candidate.schemaVersion === GAIT_SCHEMA_VERSION
    && typeof candidate.libraryVersion === 'string'
    && typeof capturedAt === 'object'
    && capturedAt !== null
    && Number.isFinite(capturedAt.durationMs)
    && Number.isFinite(capturedAt.startedAtMonotonicMs)
    && typeof signals === 'object'
    && signals !== null
    && 'keyboard' in signals
    && 'pointer' in signals
    && 'touch' in signals
    && 'wheel' in signals
    && 'context' in signals
    && typeof quality === 'object'
    && quality !== null
    && 'confidence' in quality;
}
