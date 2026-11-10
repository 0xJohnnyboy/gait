import { RunningStats } from './statistics.ts';
import type {
  CaptureConfidence,
  ContextSnapshot,
  EventSource,
  Gait,
  GaitConfig,
  GaitSnapshot,
  KeyboardSnapshot,
  MonotonicClock,
  NormalizedEvent,
  PointerSnapshot,
  SnapshotListener,
  TouchSnapshot,
  WheelSnapshot,
} from './types.ts';
import { GaitDestroyedError } from './types.ts';

const LIBRARY_VERSION = '0.1.0';

let lastDefaultClockValue = 0;
const defaultClock: MonotonicClock = {
  now: () => {
    lastDefaultClockValue = Math.max(lastDefaultClockValue, Date.now());
    return lastDefaultClockValue;
  },
};

const emptyKeyboard = (): KeyboardSnapshot => ({
  eventsSeen: 0,
  eventsAccepted: 0,
  eventsRejected: 0,
  unmatchedKeyCount: 0,
});

const emptyPointer = (): PointerSnapshot => ({
  eventsSeen: 0,
  eventsAccepted: 0,
  eventsRejected: 0,
  sampleCount: 0,
  distancePx: 0,
  downCount: 0,
  upCount: 0,
  clickCount: 0,
});

const emptyContext = (): ContextSnapshot => ({
  eventsSeen: 0,
  eventsAccepted: 0,
  eventsRejected: 0,
  focusMs: 0,
  blurCount: 0,
  visibilityGapMs: 0,
});

const emptyTouch = (): TouchSnapshot => ({ eventsSeen: 0, eventsAccepted: 0, eventsRejected: 0, sampleCount: 0, distancePx: 0 });
const emptyWheel = (): WheelSnapshot => ({ eventsSeen: 0, eventsAccepted: 0, eventsRejected: 0, deltaX: 0, deltaY: 0, deltaZ: 0, pixelCount: 0, lineCount: 0, pageCount: 0, wheelCount: 0 });

function confidenceFor(keyboard: KeyboardSnapshot, pointer: PointerSnapshot): CaptureConfidence {
  const reasons: CaptureConfidence['degradationReasons'][number][] = [];
  const samples = (keyboard.dwellTimeMs?.n ?? 0) + pointer.sampleCount;
  if (samples < 10) reasons.push('insufficient_sample');
  if (keyboard.eventsRejected + pointer.eventsRejected > 0) reasons.push('event_gap');
  const score = Math.max(0, Math.min(1, 1 - reasons.length * 0.15));
  return {
    score,
    level: score >= 0.8 ? 'high' : score >= 0.5 ? 'medium' : 'low',
    degradationReasons: reasons,
  };
}

export function createGait(config: GaitConfig = {}): Gait {
  const clock = config.clock ?? defaultClock;
  const source = config.eventSource;
  const listeners = new Set<SnapshotListener>();
  const activeKeys = new Map<string, number>();
  const dwellStats = new RunningStats();
  const flightStats = new RunningStats();
  const speedStats = new RunningStats();
  const accelerationStats = new RunningStats();
  let keyboard = emptyKeyboard();
  let pointer = emptyPointer();
  let touch = emptyTouch();
  let wheel = emptyWheel();
  let context = emptyContext();
  let previousPointer: { x: number; y: number; timestamp: number; pointerId: number } | undefined;
  let previousSpeed: { value: number; timestamp: number } | undefined;
  let focusStartedAt: number | undefined;
  let hiddenStartedAt: number | undefined;
  let lastKeyUp: number | undefined;
  let startedAt = clock.now();
  let lastTimestamp = startedAt;
  let running = false;
  let destroyed = false;
  let cachedSnapshot: GaitSnapshot | undefined;
  let flightOverlapCount = 0;

  const handleEvent = (event: NormalizedEvent): void => {
    if (destroyed || !Number.isFinite(event.timestamp) || event.timestamp < lastTimestamp) return;
    lastTimestamp = event.timestamp;
    cachedSnapshot = undefined;
    if (event.kind === 'key-down') {
      if (config.signals?.keyboard === false) return;
      keyboard = { ...keyboard, eventsSeen: keyboard.eventsSeen + 1 };
      if (!event.trusted || event.repeat || activeKeys.has(event.keyId)) {
        keyboard = { ...keyboard, eventsRejected: keyboard.eventsRejected + 1 };
        return;
      }
      activeKeys.set(event.keyId, event.timestamp);
      keyboard = { ...keyboard, eventsAccepted: keyboard.eventsAccepted + 1 };
      return;
    }
    if (event.kind === 'key-up') {
      if (config.signals?.keyboard === false) return;
      keyboard = { ...keyboard, eventsSeen: keyboard.eventsSeen + 1 };
      const downAt = activeKeys.get(event.keyId);
      if (!event.trusted || downAt === undefined) {
        keyboard = {
          ...keyboard,
          eventsRejected: keyboard.eventsRejected + 1,
          unmatchedKeyCount: keyboard.unmatchedKeyCount + 1,
        };
        return;
      }
      activeKeys.delete(event.keyId);
      const dwell = event.timestamp - downAt;
      if (dwell < 0) return;
      dwellStats.add(dwell);
      if (lastKeyUp !== undefined) {
        const flight = downAt - lastKeyUp;
        if (flight < 0) flightOverlapCount += 1;
        else flightStats.add(flight);
      }
      lastKeyUp = event.timestamp;
      keyboard = { ...keyboard, eventsAccepted: keyboard.eventsAccepted + 1 };
      return;
    }
    if (event.kind === 'pointer-move') {
      if (config.signals?.pointer === false) return;
      pointer = { ...pointer, eventsSeen: pointer.eventsSeen + 1 };
      if (!event.trusted || !Number.isFinite(event.x) || !Number.isFinite(event.y)) {
        pointer = { ...pointer, eventsRejected: pointer.eventsRejected + 1 };
        return;
      }
      if (previousPointer !== undefined && previousPointer.pointerId === event.pointerId) {
        const dt = event.timestamp - previousPointer.timestamp;
        if (dt > 0) {
          const distance = Math.hypot(event.x - previousPointer.x, event.y - previousPointer.y);
          pointer = {
            ...pointer,
            distancePx: pointer.distancePx + distance,
            sampleCount: pointer.sampleCount + 1,
            eventsAccepted: pointer.eventsAccepted + 1,
          };
          const speed = distance / dt;
          speedStats.add(speed);
          if (previousSpeed !== undefined) {
            const accelerationDt = event.timestamp - previousSpeed.timestamp;
            if (accelerationDt > 0) accelerationStats.add((speed - previousSpeed.value) / accelerationDt);
          }
          previousSpeed = { value: speed, timestamp: event.timestamp };
        }
      } else {
        pointer = { ...pointer, eventsAccepted: pointer.eventsAccepted + 1 };
      }
      previousPointer = { x: event.x, y: event.y, timestamp: event.timestamp, pointerId: event.pointerId };
      return;
    }
    if (event.kind === 'pointer-button') {
      if (config.signals?.pointer === false) return;
      pointer = { ...pointer, eventsSeen: pointer.eventsSeen + 1 };
      if (!event.trusted) {
        pointer = { ...pointer, eventsRejected: pointer.eventsRejected + 1 };
        return;
      }
      pointer = {
        ...pointer,
        eventsAccepted: pointer.eventsAccepted + 1,
        downCount: pointer.downCount + (event.action === 'down' ? 1 : 0),
        upCount: pointer.upCount + (event.action === 'up' ? 1 : 0),
        clickCount: pointer.clickCount + (event.action === 'click' ? 1 : 0),
      };
      return;
    }
    if (event.kind === 'touch-move') {
      if (config.signals?.touch === false) return;
      touch = { ...touch, eventsSeen: touch.eventsSeen + 1 };
      if (!event.trusted || !Number.isFinite(event.x) || !Number.isFinite(event.y)) {
        touch = { ...touch, eventsRejected: touch.eventsRejected + 1 };
        return;
      }
      touch = { ...touch, eventsAccepted: touch.eventsAccepted + 1, sampleCount: touch.sampleCount + 1 };
      return;
    }
    if (event.kind === 'wheel') {
      if (config.signals?.wheel === false) return;
      wheel = { ...wheel, eventsSeen: wheel.eventsSeen + 1 };
      if (!event.trusted || ![event.deltaX, event.deltaY, event.deltaZ].every(Number.isFinite)) {
        wheel = { ...wheel, eventsRejected: wheel.eventsRejected + 1 };
        return;
      }
      wheel = {
        ...wheel,
        eventsAccepted: wheel.eventsAccepted + 1,
        deltaX: wheel.deltaX + event.deltaX,
        deltaY: wheel.deltaY + event.deltaY,
        deltaZ: wheel.deltaZ + event.deltaZ,
        pixelCount: wheel.pixelCount + (event.deltaMode === 0 ? 1 : 0),
        lineCount: wheel.lineCount + (event.deltaMode === 1 ? 1 : 0),
        pageCount: wheel.pageCount + (event.deltaMode === 2 ? 1 : 0),
        wheelCount: wheel.wheelCount + 1,
      };
      return;
    }
    if (event.kind === 'context') {
      if (config.signals?.context === false) return;
      context = { ...context, eventsSeen: context.eventsSeen + 1, eventsAccepted: context.eventsAccepted + 1 };
      if (event.event === 'focus') focusStartedAt ??= event.timestamp;
      if (event.event === 'blur') {
        if (focusStartedAt !== undefined && event.timestamp >= focusStartedAt) {
          context = { ...context, focusMs: context.focusMs + event.timestamp - focusStartedAt };
        }
        focusStartedAt = undefined;
        context = { ...context, blurCount: context.blurCount + 1 };
      }
      if (event.event === 'hidden') {
        hiddenStartedAt = event.timestamp;
        activeKeys.clear();
        previousPointer = undefined;
        previousSpeed = undefined;
      }
      if (event.event === 'visible' && hiddenStartedAt !== undefined && event.timestamp >= hiddenStartedAt) {
        context = { ...context, visibilityGapMs: context.visibilityGapMs + event.timestamp - hiddenStartedAt };
        hiddenStartedAt = undefined;
      }
      return;
    }
  };

  const buildSnapshot = (): GaitSnapshot => {
    const dwellTimeMs = dwellStats.summary();
    const flightTime = flightStats.summary();
    const speedPxPerMs = speedStats.summary();
    const accelerationPxPerMs2 = accelerationStats.summary();
    const keyboardSnapshot: KeyboardSnapshot = {
      ...keyboard,
      ...(dwellTimeMs === undefined ? {} : { dwellTimeMs }),
      ...(flightTime === undefined && flightOverlapCount === 0
        ? {}
        : { flightTimeMs: { ...(flightTime ?? { n: 0 }), overlapCount: flightOverlapCount } }),
    };
    const pointerSnapshot: PointerSnapshot = {
      ...pointer,
      ...(speedPxPerMs === undefined ? {} : { speedPxPerMs }),
      ...(accelerationPxPerMs2 === undefined ? {} : { accelerationPxPerMs2 }),
    };
    return {
      schemaVersion: '1.0',
      libraryVersion: LIBRARY_VERSION,
      capturedAt: { durationMs: Math.max(0, clock.now() - startedAt), startedAtMonotonicMs: startedAt },
      signals: { keyboard: keyboardSnapshot, pointer: pointerSnapshot, touch, wheel, context },
      quality: { confidence: confidenceFor(keyboardSnapshot, pointerSnapshot) },
    };
  };

  const ensureAlive = (): void => {
    if (destroyed) throw new GaitDestroyedError();
  };

  return {
    start(): void {
      ensureAlive();
      if (running) return;
      running = true;
      source?.start(handleEvent);
    },
    stop(): void {
      if (destroyed || !running) return;
      running = false;
      source?.stop();
      activeKeys.clear();
      previousPointer = undefined;
    },
    reset(): void {
      ensureAlive();
      activeKeys.clear();
      dwellStats.reset();
      flightStats.reset();
      speedStats.reset();
      accelerationStats.reset();
      keyboard = emptyKeyboard();
      pointer = emptyPointer();
      touch = emptyTouch();
      wheel = emptyWheel();
      context = emptyContext();
      previousPointer = undefined;
      previousSpeed = undefined;
      focusStartedAt = undefined;
      hiddenStartedAt = undefined;
      lastKeyUp = undefined;
      flightOverlapCount = 0;
      startedAt = clock.now();
      lastTimestamp = startedAt;
      cachedSnapshot = undefined;
    },
    snapshot(): GaitSnapshot {
      ensureAlive();
      cachedSnapshot ??= buildSnapshot();
      return cachedSnapshot;
    },
    flush(): GaitSnapshot {
      ensureAlive();
      const nextSnapshot = buildSnapshot();
      cachedSnapshot = nextSnapshot;
      for (const listener of [...listeners]) listener(nextSnapshot);
      config.onSnapshot?.(nextSnapshot);
      return nextSnapshot;
    },
    subscribe(listener: SnapshotListener): () => void {
      ensureAlive();
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    destroy(): void {
      if (destroyed) return;
      if (running) source?.stop();
      source?.dispose();
      listeners.clear();
      activeKeys.clear();
      destroyed = true;
    },
  };
}
