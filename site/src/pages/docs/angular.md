---
title: Angular adapter
description: Angular signal integration with render-safe startup and destroy hooks.
layout: ../../layouts/DocsLayout.astro
---
<div class="eyebrow">angular</div>
# Angular adapter

```bash
pnpm add @gait/core @gait/browser @gait/angular
```

`GaitAdapter` exposes the latest snapshot as a readonly Angular signal:

```ts
import { Component, DestroyRef, inject } from '@angular/core';
import { GaitAdapter } from '@gait/angular';

@Component({
  standalone: true,
  template: `{{ gait.snapshot()?.signals.pointer.speedPxPerMs?.mean ?? '—' }}`,
})
export class MetricsComponent {
  readonly gait = new GaitAdapter();
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    this.gait.start(clientGaitConfig, this.destroyRef);
  }
}
```

`start()` is idempotent. It subscribes to snapshots, schedules browser capture through `afterNextRender`, and registers `destroy()` with the supplied scope. `destroy()` is safe to call explicitly and releases the subscription and Core instance. The adapter does not calculate metrics and does not retain raw events.

Build `clientGaitConfig` only in a browser-safe boundary with `createBrowserEventSource()` and `createBrowserClock()`. For Angular SSR, do not create the browser source in a module initializer or constructor that runs on the server; defer it to the browser lifecycle and pass the resulting config to `start()`.

Because the signal changes only on `flush()`, Angular change detection sees bounded snapshot updates rather than every native event. Use an explicit session controller when capture must outlive a component, and destroy it when that session ends.
