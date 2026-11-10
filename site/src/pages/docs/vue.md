---
title: Vue adapter
description: Vue lifecycle integration with shallow snapshot refs.
layout: ../../layouts/DocsLayout.astro
---
<div class="eyebrow">vue</div>
# Vue adapter

```bash
pnpm add @gait/core @gait/browser @gait/vue
```

`useGait()` returns shallow refs for the instance and the latest published snapshot:

```vue
<script setup lang="ts">
import { useGait } from '@gait/vue';

const { snapshot } = useGait({
  // Pass a client-created eventSource/clock in an SSR application.
});
</script>

<template>
  <output>{{ snapshot?.signals.keyboard.dwellTimeMs?.mean ?? '—' }}</output>
</template>
```

The composable creates and starts the instance in `onMounted`, subscribes to snapshot publications, then unsubscribes and destroys it in `onUnmounted`. This makes the import SSR-safe, but the config must also avoid creating browser globals during server setup. In Nuxt or another SSR app, create the browser config in a client-only component/plugin.

The refs are shallow on purpose: a snapshot is a replacement value at flush time, not a deeply reactive event stream. Choose a flush cadence appropriate to the view and keep expensive matching or persistence outside the component.

For tests, mount the composable with an injected fake `EventSource`, emit normalized events, call `flush()`, and assert `snapshot.value`. A route change naturally ends capture through the unmount cleanup.
