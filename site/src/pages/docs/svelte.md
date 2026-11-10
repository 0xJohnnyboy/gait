---
title: Svelte adapter
description: A readable store with subscription-scoped capture and cleanup.
layout: ../../layouts/DocsLayout.astro
---
<div class="eyebrow">svelte</div>
# Svelte adapter

```bash
pnpm add @gait/core @gait/browser @gait/svelte
```

`createGaitStore()` returns a readable store. The underlying gait instance is created when the first subscriber appears and destroyed when the last subscriber leaves:

```svelte
<script lang="ts">
  import { createGaitStore } from '@gait/svelte';

  const metrics = createGaitStore();
</script>

<output>{$metrics?.signals.pointer.speedPxPerMs?.mean ?? '—'}</output>
```

In a browser app, pass a client-created `GaitConfig` containing the browser event source and clock. Do not construct browser globals at module scope in an SSR build; use a client-only module or boundary. The store starts capture on subscription and stops, unsubscribes and destroys on teardown.

Svelte's store contract means multiple components can share the store while it has subscribers. Publications happen on `flush()`, not on each pointer or keyboard event, so the UI remains decoupled from the hot path. Keep the store value read-only and hand snapshots to application-owned transport only at an explicit boundary.

For tests, use a fake event source and clock, subscribe to the store, emit normalized events, flush, then unsubscribe to verify cleanup.
