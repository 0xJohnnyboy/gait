---
title: Quickstart
description: Create your first local gait snapshot.
layout: ../../layouts/DocsLayout.astro
---

<div class="eyebrow">quickstart</div>

# Your first local snapshot.

gait observes browser events, computes aggregates and leaves transport to your application.

```ts
import { createBrowserGait } from '@gait/browser';

const gait = createBrowserGait();
gait.start();

gait.subscribe((snapshot) => {
  console.log(snapshot.signals.pointer);
});

// Stop and release every listener when your session ends.
gait.destroy();
```

<div class="docs-callout">
  The Core does not send data, persist data or identify users. Your application owns any later transport and interpretation.
</div>
