---
title: Architecture
description: Core, browser source, adapters and the performance boundary.
layout: ../../layouts/DocsLayout.astro
---

<div class="eyebrow">architecture</div>

# One pipeline, thin edges.

The Core is pure TypeScript. The browser package translates native events. Framework adapters only manage lifecycle and subscriptions.

<div class="docs-pipeline">
  <div class="text-[#52e5d0]">Native browser events</div>
  <div class="pl-5 text-slate-500">↓ normalize once</div>
  <div class="text-[#9b8cff]">@gait/core aggregation</div>
  <div class="pl-5 text-slate-500">↓ flush on your cadence</div>
  <div class="text-[#f6c76b]">Versioned JSON snapshot</div>
</div>

## Performance

Hot paths use bounded state and online statistics. UI subscribers see snapshots, never raw `pointermove` events.

## Confidence

Confidence describes capture quality. It is a heuristic, not proof of a human or a device identity.
