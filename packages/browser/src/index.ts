import { createGait } from '@gait/core';
import type { EventSource, Gait, GaitConfig, MonotonicClock, NormalizedEvent } from '@gait/core';

export interface BrowserEventSourceOptions {
  readonly target?: Window;
  readonly document?: Document;
  readonly includeTouch?: boolean;
  readonly includeWheel?: boolean;
}

export type BrowserGaitConfig = GaitConfig & BrowserEventSourceOptions;

function trusted(event: Event): boolean {
  return event.isTrusted !== false;
}

function timestamp(event: Event): number {
  const value = event.timeStamp;
  const now = performance.now();
  return Number.isFinite(value) && value >= 0 && value <= now + 1000 ? value : now;
}

export function createBrowserClock(): MonotonicClock {
  return { now: () => performance.now() };
}

export function createBrowserGait(config: BrowserGaitConfig = {}): Gait {
  const { target, document: documentTarget, includeTouch, includeWheel, ...coreConfig } = config;
  const browserOptions: BrowserEventSourceOptions = {
    ...(target === undefined ? {} : { target }),
    ...(documentTarget === undefined ? {} : { document: documentTarget }),
    ...(includeTouch === undefined ? {} : { includeTouch }),
    ...(includeWheel === undefined ? {} : { includeWheel }),
  };
  return createGait({
    ...coreConfig,
    clock: coreConfig.clock ?? createBrowserClock(),
    eventSource: coreConfig.eventSource ?? createBrowserEventSource(browserOptions),
  });
}

export function createBrowserEventSource(options: BrowserEventSourceOptions = {}): EventSource {
  const target = options.target ?? globalThis.window;
  const documentTarget = options.document ?? globalThis.document;
  if (target === undefined || documentTarget === undefined) throw new Error('GAIT_BROWSER_UNAVAILABLE');
  let emit: ((event: NormalizedEvent) => void) | undefined;
  let controller: AbortController | undefined;

  return {
    start(nextEmit): void {
      if (controller !== undefined) return;
      emit = nextEmit;
      controller = new AbortController();
      const signal = controller.signal;
      const emitKeyDown = (event: KeyboardEvent): void => {
        emit?.({
          kind: 'key-down',
          keyId: event.code || 'unknown',
          repeat: event.repeat,
          timestamp: timestamp(event),
          trusted: trusted(event),
        });
      };
      const emitKeyUp = (event: KeyboardEvent): void => {
        emit?.({ kind: 'key-up', keyId: event.code || 'unknown', timestamp: timestamp(event), trusted: trusted(event) });
      };
      const emitPointer = (event: PointerEvent): void => {
        const events = event.getCoalescedEvents?.() ?? [event];
        for (const point of events) {
          if (point.pointerType === 'touch') {
            emit?.({ kind: 'touch-move', pointerId: point.pointerId, x: point.clientX, y: point.clientY, timestamp: timestamp(point), trusted: trusted(point) });
          } else {
            emit?.({ kind: 'pointer-move', pointerId: point.pointerId, pointerType: point.pointerType === 'mouse' || point.pointerType === 'pen' ? point.pointerType : 'unknown', x: point.clientX, y: point.clientY, timestamp: timestamp(point), trusted: trusted(point) });
          }
        }
      };
      const emitWheel = (event: WheelEvent): void => {
        const mode: 0 | 1 | 2 = event.deltaMode === 1 || event.deltaMode === 2 ? event.deltaMode : 0;
        emit?.({ kind: 'wheel', timestamp: timestamp(event), deltaX: event.deltaX, deltaY: event.deltaY, deltaZ: event.deltaZ, deltaMode: mode, trusted: trusted(event) });
      };
      const emitContext = (event: 'focus' | 'blur' | 'visible' | 'hidden' | 'pagehide' | 'pageshow', source: Event): void => {
        emit?.({ kind: 'context', event, timestamp: timestamp(source) });
      };

      target.addEventListener('keydown', emitKeyDown, { signal, passive: true });
      target.addEventListener('keyup', emitKeyUp, { signal, passive: true });
      target.addEventListener('pointermove', emitPointer, { signal, passive: true });
      target.addEventListener('focus', (event) => emitContext('focus', event), { signal, passive: true });
      target.addEventListener('blur', (event) => emitContext('blur', event), { signal, passive: true });
      target.addEventListener('pagehide', (event) => emitContext('pagehide', event), { signal, passive: true });
      target.addEventListener('pageshow', (event) => emitContext('pageshow', event), { signal, passive: true });
      documentTarget.addEventListener('visibilitychange', (event) => emitContext(documentTarget.visibilityState === 'hidden' ? 'hidden' : 'visible', event), { signal, passive: true });

      if (options.includeTouch) {
        target.addEventListener('touchmove', () => undefined, { signal, passive: true });
      }
      if (options.includeWheel) {
        target.addEventListener('wheel', emitWheel, { signal, passive: true });
      }
    },
    stop(): void {
      controller?.abort();
      controller = undefined;
      emit = undefined;
    },
    dispose(): void {
      controller?.abort();
      controller = undefined;
      emit = undefined;
    },
  };
}
