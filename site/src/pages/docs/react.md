---
title: React adapter
description: React lifecycle and external-store integration for gait.
layout: ../../layouts/DocsLayout.astro
---
<div class="eyebrow">react</div>
# React adapter

Install the adapter alongside Core and the browser adapter:

```bash
pnpm add @gait/core @gait/browser @gait/react
```

## Live snapshot hook

```tsx
import type { GaitConfig } from '@gait/core';
import { useGait, useGaitSnapshot } from '@gait/react';

export function MetricsPanel({ config }: { config: GaitConfig }) {
  const gait = useGait({ ...config, autoStart: true });
  const snapshot = useGaitSnapshot(gait);
  return <output>{snapshot.signals.pointer.speedPxPerMs?.mean ?? '—'}</output>;
}
```

In a browser application, build `config` in a client-only boundary with `createBrowserEventSource()` and `createBrowserClock()` from `@gait/browser`. The adapter creates the Core instance once, subscribes through `useSyncExternalStore`, starts by default and stops/destroys it during cleanup. Set `autoStart: false` when the surrounding flow owns the start boundary. Passing the config as a prop also makes the SSR/client boundary explicit; do not construct browser globals during server rendering.

## Rendering guidance

React receives updates only after `flush()`. Keep the subscription at the smallest component boundary that needs the values, derive display-only values with normal React techniques, and never attach React state updates to native pointer events. The server snapshot is a stable empty snapshot, so importing and rendering the hook remains SSR-safe; browser capture still starts only in an effect.

## Cleanup and tests

Unmounting destroys the instance. If the session ends before unmount, call `gait.stop()` and flush explicitly from the owning component or session controller. For tests, inject a fake `EventSource` and monotonic `clock`, emit normalized events, call `flush()`, then assert the snapshot without a DOM.
