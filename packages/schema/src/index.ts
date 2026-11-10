import type { GaitSnapshot } from '@gait/core';

export const GAIT_SCHEMA_VERSION = '1.0' as const;

export function isGaitSnapshot(value: unknown): value is GaitSnapshot {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Partial<GaitSnapshot>;
  return candidate.schemaVersion === GAIT_SCHEMA_VERSION
    && typeof candidate.libraryVersion === 'string'
    && typeof candidate.capturedAt === 'object'
    && candidate.capturedAt !== null
    && typeof candidate.signals === 'object'
    && candidate.signals !== null
    && typeof candidate.quality === 'object'
    && candidate.quality !== null;
}
