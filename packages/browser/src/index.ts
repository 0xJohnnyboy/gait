import type { EventSource, MonotonicClock, NormalizedEvent } from '@gait/core';

export interface BrowserEventSourceOptions {
  readonly target?: Window;
  readonly document?: Document;
  readonly includeTouch?: boolean;
  readonly includeWheel?: boolean;
}

function trusted(event: Event): boolean {
  return event.isTrusted !== false;
}

function timestamp(event: Event): number {
  const value = event.timeStamp;
  return Number.isFinite(value) && value >= 0 ? value : performance.now();
}

export function createBrowserClock(): MonotonicClock {
  return { now: () => performance.now() };
}

export function createBrowserEventSource(options: BrowserEventSourceOptions = {}): EventSource {
  const target = options.target ?? window;
  const documentTarget = options.document ?? document;
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
          emit?.({
            kind: 'pointer-move',
            pointerId: point.pointerId,
            pointerType: point.pointerType === 'mouse' || point.pointerType === 'touch' || point.pointerType === 'pen' ? point.pointerType : 'unknown',
            x: point.clientX,
            y: point.clientY,
            timestamp: timestamp(point),
            trusted: trusted(point),
          });
        }
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
        target.addEventListener('wheel', () => undefined, { signal, passive: true });
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
