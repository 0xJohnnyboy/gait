---
title: Performance
description: Keep capture cheap, bounded and invisible to the rendering path.
layout: ../../layouts/DocsLayout.astro
---
<div class="eyebrow">performance</div>
# Performance

Gait is designed for high-frequency browser input. The hot path accepts normalized events, updates online accumulators and drops raw event objects immediately. It does not serialize JSON, call the network or invoke application callbacks for every event.

## Recommended integration

Capture continuously, publish at a coarse cadence, and render only published snapshots:

```ts
const gait = createBrowserGait({ signals: { keyboard: true, pointer: true } });
const unsubscribe = gait.subscribe(renderMetrics);
const flushTimer = window.setInterval(() => gait.flush(), 250);

// cleanup
window.clearInterval(flushTimer);
unsubscribe();
gait.destroy();
```

Do not subscribe a component directly to native `keydown`, `pointermove` or `mousemove` events. Do not call `flush()` from each native event. Framework adapters already subscribe to snapshot publications, not raw events.

## Memory and allocation rules

- Metric accumulators are updated online; snapshots are materialized on `snapshot()` or `flush()`.
- Internal sample storage is bounded. There is no unbounded event log or raw-key snapshot.
- Pointer sampling and browser coalescing reduce redundant work where the platform supports it.
- A snapshot is immutable from the consumer's point of view; treat it as a value and replace it rather than mutating it.
- `window.maxEvents` and `window.durationMs` are configuration seams for bounded collection. Verify the chosen values against the workload you expect.

## Choosing a cadence

Use roughly 200–500 ms for a live dashboard, longer intervals for background telemetry, and explicit session-end `flush()` for a final local snapshot. A faster cadence increases publications and framework work; it does not improve the raw capture resolution.

## Measuring changes

Performance changes require a reproducible benchmark. Measure event ingestion and snapshot publication separately, report p95/p99 latency, and test a sustained pointer stream together with keyboard input. A browser profile should include scripting time, long tasks, allocations and component renders.

The library is an instrumentation primitive, not a scheduler for your application. Keep expensive matching, persistence, encryption and network work outside the capture path.
