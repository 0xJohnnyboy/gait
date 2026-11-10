---
title: Browser adapter
description: Connect gait to DOM events without leaking browser concerns into Core.
layout: ../../layouts/DocsLayout.astro
---
<div class="eyebrow">browser</div>
# Browser adapter

`@gait/browser` is the only package that touches browser globals. It normalizes keyboard, pointer, touch, wheel and lifecycle events, then delegates aggregation to `@gait/core`.

## Installation

```bash
pnpm add @gait/core @gait/browser
```

## Basic setup

```ts
import { createBrowserGait } from '@gait/browser';

const gait = createBrowserGait({
  signals: { keyboard: true, pointer: true, touch: true, wheel: false, context: true },
  includeTouch: true,
  includeWheel: false,
});

gait.start();
const stop = gait.subscribe((snapshot) => {
  // Hand the snapshot to your application-owned pipeline.
  console.log(snapshot.signals.keyboard.dwellTimeMs?.mean);
});

const timer = window.setInterval(() => gait.flush(), 250);
// On route/session end:
window.clearInterval(timer);
stop();
gait.destroy();
```

`flush()` is explicit. This keeps publication cadence separate from event capture and lets an application choose a suitable UI or transport boundary.

## Options and capabilities

| Option | Meaning |
| --- | --- |
| `target` | Event target window, useful for an iframe or tests. |
| `document` | Matching document used for visibility and focus events. |
| `includeTouch` | Enables the optional legacy touch listener; touch pointer events are normalized from `pointermove` when the browser reports `pointerType: "touch"`. |
| `includeWheel` | Enables wheel collection. |
| `signals` | Enables or disables metric families while preserving snapshot shape. |

Pointer events use `getCoalescedEvents()` when available and fall back to the original event. Touch is represented separately when `pointerType === 'touch'`.

## SSR

Importing `@gait/browser` is SSR-safe. Calling `createBrowserGait()` without injected `target` and `document` requires a browser and throws `GAIT_BROWSER_UNAVAILABLE` otherwise. Create and start the instance from a client lifecycle hook, never at module scope or during server rendering.

For deterministic tests, inject `eventSource` and `clock` through `@gait/core`; do not emulate browser globals just to test aggregation.

## Trust boundary

`isTrusted` is retained as a quality hint. It cannot prove that a human generated an event because page code, browser extensions and automation can influence the environment. The adapter never sends, stores or fingerprints data.
