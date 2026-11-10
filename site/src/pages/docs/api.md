---
title: API & snapshots
description: Lifecycle, configuration and the versioned gait snapshot.
layout: ../../layouts/DocsLayout.astro
---
<div class="eyebrow">contract</div>
# API & snapshots
The public API is deliberately small. `@gait/core` owns aggregation; `@gait/browser` only translates native browser events into normalized input.
## Creating an instance
```ts
import { createGait } from '@gait/core';
import { createBrowserGait } from '@gait/browser';

const gait = createBrowserGait({
  signals: { keyboard: true, pointer: true, touch: true, wheel: true, context: true },
  sample: { flushMs: 250 },
});
```
Use `createGait()` when the event source, clock or test scheduler is injected. Use `createBrowserGait()` in a browser application. Neither function sends data.
## Lifecycle
| Method | Contract |
| --- | --- |
| `start()` | Installs the source once. Repeated calls are no-ops. |
| `stop()` | Stops capture and releases the active source. Safe to repeat. |
| `snapshot()` | Returns the latest stable snapshot, building one if needed. |
| `flush()` | Builds and publishes a snapshot to subscribers. |
| `reset()` | Clears metrics and starts a new measurement window. |
| `subscribe(listener)` | Subscribes to explicit snapshot publications and returns an idempotent unsubscribe. |
| `destroy()` | Releases the source and makes the instance unusable. |
## Configuration
`signals` disables a family without changing the public snapshot shape. `sample` and `window` are intended for capture cadence and bounded windows. `clock` and `eventSource` are the main testing seams.
```ts
const gait = createGait({
  clock: controlledClock,
  eventSource: syntheticSource,
  onSnapshot: (snapshot) => saveForYourApplication(snapshot),
});
```
Keep transport outside gait. If a listener throws, isolate that failure in your application boundary so capture cannot become a hidden network or state-management layer.
## Snapshot shape
Every output starts with `schemaVersion`, `libraryVersion`, `capturedAt`, `signals` and `quality`. Metric summaries expose `n`, `min`, `max`, `mean`, `p50`, `p90`, `p95`, `stdDev` and `sum` when enough observations exist.
```json
{
  "schemaVersion": "1.0",
  "signals": {
    "keyboard": { "eventsSeen": 120, "unmatchedKeyCount": 1 },
    "pointer": { "sampleCount": 840, "distancePx": 18342.7 },
    "touch": { "sampleCount": 0 },
    "wheel": { "wheelCount": 8 },
    "context": { "visibilityGapMs": 3400 }
  },
  "quality": {
    "confidence": { "score": 0.86, "level": "high", "degradationReasons": ["event_gap"] }
  }
}
```
Missing statistics mean that the metric has no usable observations; they are not zeroes. `degradationReasons` explains why quality is below a perfect score, not why the level label exists.
## Destroying correctly
Call `destroy()` when a game session, route or embedded widget ends. Framework adapters do this from their unmount/destroy lifecycle. Do not reuse a destroyed instance; create a new one for a new session.
