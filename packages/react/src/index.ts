import { useEffect, useRef, useSyncExternalStore } from 'react';
import { createGait } from '@gait/core';
import type { Gait, GaitConfig, GaitSnapshot } from '@gait/core';

const EMPTY_SNAPSHOT: GaitSnapshot = {
  schemaVersion: '1.0',
  libraryVersion: '0.1.0',
  capturedAt: { durationMs: 0, startedAtMonotonicMs: 0 },
  signals: {
    keyboard: { eventsSeen: 0, eventsAccepted: 0, eventsRejected: 0, unmatchedKeyCount: 0 },
    pointer: { eventsSeen: 0, eventsAccepted: 0, eventsRejected: 0, sampleCount: 0, distancePx: 0 },
    touch: { eventsSeen: 0, eventsAccepted: 0, eventsRejected: 0, sampleCount: 0, distancePx: 0 },
    wheel: { eventsSeen: 0, eventsAccepted: 0, eventsRejected: 0, deltaX: 0, deltaY: 0, deltaZ: 0, pixelCount: 0, lineCount: 0, pageCount: 0 },
    context: { eventsSeen: 0, eventsAccepted: 0, eventsRejected: 0, focusMs: 0, blurCount: 0, visibilityGapMs: 0 },
  },
  quality: { confidence: { score: 0, level: 'low', degradationReasons: ['insufficient_sample'] } },
};

export function useGaitInstance(config?: GaitConfig): Gait {
  const instance = useRef<Gait | undefined>(undefined);
  if (instance.current === undefined) instance.current = createGait(config);
  useEffect(() => () => instance.current?.destroy(), []);
  return instance.current;
}

export function useGaitSnapshot(gait: Gait): GaitSnapshot {
  return useSyncExternalStore(
    (listener) => gait.subscribe(() => listener()),
    () => gait.snapshot(),
    () => EMPTY_SNAPSHOT,
  );
}

export function useGait(config?: GaitConfig & { readonly autoStart?: boolean }): Gait {
  const gait = useGaitInstance(config);
  useEffect(() => {
    if (config?.autoStart !== false) gait.start();
    return () => gait.stop();
  }, [gait, config?.autoStart]);
  return gait;
}
