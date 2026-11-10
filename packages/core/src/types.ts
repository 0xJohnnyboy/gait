export type SignalName = 'keyboard' | 'pointer' | 'touch' | 'wheel' | 'context';

export interface SignalOptions {
  readonly keyboard?: boolean;
  readonly pointer?: boolean;
  readonly touch?: boolean;
  readonly wheel?: boolean;
  readonly context?: boolean;
}

export interface SamplingOptions {
  readonly pointerHz?: number;
  readonly flushMs?: number;
}

export interface WindowOptions {
  readonly durationMs?: number;
  readonly maxEvents?: number;
}

export interface MonotonicClock {
  now(): number;
}

export type NormalizedEvent =
  | {
      readonly kind: 'key-down';
      readonly timestamp: number;
      readonly keyId: string;
      readonly repeat: boolean;
      readonly trusted: boolean;
    }
  | {
      readonly kind: 'key-up';
      readonly timestamp: number;
      readonly keyId: string;
      readonly trusted: boolean;
    }
  | {
      readonly kind: 'pointer-move';
      readonly timestamp: number;
      readonly pointerId: number;
      readonly pointerType: 'mouse' | 'touch' | 'pen' | 'unknown';
      readonly x: number;
      readonly y: number;
      readonly trusted: boolean;
    }
  | {
      readonly kind: 'touch-move';
      readonly timestamp: number;
      readonly pointerId: number;
      readonly x: number;
      readonly y: number;
      readonly trusted: boolean;
    }
  | {
      readonly kind: 'wheel';
      readonly timestamp: number;
      readonly deltaX: number;
      readonly deltaY: number;
      readonly deltaZ: number;
      readonly deltaMode: 0 | 1 | 2;
      readonly trusted: boolean;
    }
  | {
      readonly kind: 'context';
      readonly timestamp: number;
      readonly event: 'focus' | 'blur' | 'visible' | 'hidden' | 'pagehide' | 'pageshow';
    };

export interface EventSource {
  start(emit: (event: NormalizedEvent) => void): void;
  stop(): void;
  dispose(): void;
}

export interface MetricSummary {
  readonly n: number;
  readonly min?: number;
  readonly max?: number;
  readonly mean?: number;
  readonly stdDev?: number;
  readonly sum?: number;
}

export interface KeyboardSnapshot {
  readonly eventsSeen: number;
  readonly eventsAccepted: number;
  readonly eventsRejected: number;
  readonly unmatchedKeyCount: number;
  readonly dwellTimeMs?: MetricSummary;
  readonly flightTimeMs?: MetricSummary & { readonly overlapCount: number };
}

export interface PointerSnapshot {
  readonly eventsSeen: number;
  readonly eventsAccepted: number;
  readonly eventsRejected: number;
  readonly sampleCount: number;
  readonly distancePx: number;
  readonly speedPxPerMs?: MetricSummary;
}

export interface TouchSnapshot {
  readonly eventsSeen: number;
  readonly eventsAccepted: number;
  readonly eventsRejected: number;
  readonly sampleCount: number;
  readonly distancePx: number;
}

export interface WheelSnapshot {
  readonly eventsSeen: number;
  readonly eventsAccepted: number;
  readonly eventsRejected: number;
  readonly deltaX: number;
  readonly deltaY: number;
  readonly deltaZ: number;
  readonly pixelCount: number;
  readonly lineCount: number;
  readonly pageCount: number;
}

export interface ContextSnapshot {
  readonly eventsSeen: number;
  readonly eventsAccepted: number;
  readonly eventsRejected: number;
  readonly focusMs: number;
  readonly blurCount: number;
  readonly visibilityGapMs: number;
}

export interface CaptureConfidence {
  readonly score: number;
  readonly level: 'low' | 'medium' | 'high';
  readonly degradationReasons: readonly (
    | 'insufficient_sample'
    | 'timestamp_anomaly'
    | 'event_gap'
    | 'synthetic_hint'
    | 'visibility_gap'
    | 'unsupported_signal'
  )[];
}

export interface GaitSnapshot {
  readonly schemaVersion: '1.0';
  readonly libraryVersion: string;
  readonly capturedAt: { readonly durationMs: number; readonly startedAtMonotonicMs: number };
  readonly signals: {
    readonly keyboard: KeyboardSnapshot;
    readonly pointer: PointerSnapshot;
    readonly touch: TouchSnapshot;
    readonly wheel: WheelSnapshot;
    readonly context: ContextSnapshot;
  };
  readonly quality: {
    readonly confidence: CaptureConfidence;
  };
}

export type SnapshotListener = (snapshot: GaitSnapshot) => void;

export interface GaitConfig {
  readonly signals?: SignalOptions;
  readonly sample?: SamplingOptions;
  readonly window?: WindowOptions;
  readonly clock?: MonotonicClock;
  readonly eventSource?: EventSource;
  readonly onSnapshot?: SnapshotListener;
}

export interface Gait {
  start(): void;
  stop(): void;
  reset(): void;
  snapshot(): GaitSnapshot;
  flush(): GaitSnapshot;
  subscribe(listener: SnapshotListener): () => void;
  destroy(): void;
}

export class GaitDestroyedError extends Error {
  readonly code = 'GAIT_DESTROYED' as const;

  constructor() {
    super('The gait instance has been destroyed.');
    this.name = 'GaitDestroyedError';
  }
}
