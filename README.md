# gait

[![CI](https://github.com/0xJohnnyboy/gait/actions/workflows/ci.yml/badge.svg)](https://github.com/0xJohnnyboy/gait/actions/workflows/ci.yml)
[![License: AGPL-3.0-only](https://img.shields.io/badge/License-AGPL--3.0--only-blue.svg)](./LICENSE)
[![Docs](https://img.shields.io/badge/docs-live-52e5d0.svg)](https://0xjohnnyboy.github.io/gait/docs/)

Local, privacy-first behavioral metrics for web applications.

`gait` captures and aggregates keyboard, pointer, touch, wheel and browser-context signals in TypeScript. It exposes compact, versioned snapshots that your application can inspect, store or send to its own server.

It does not send data, persist data, fingerprint users, match accounts, score cheating or take enforcement actions.

## Quick start

```bash
pnpm add @gaitjs/core @gaitjs/browser
```

```ts
import { createBrowserGait } from '@gaitjs/browser';

const gait = createBrowserGait();
const unsubscribe = gait.subscribe((snapshot) => {
  console.log(snapshot.signals.keyboard.dwellTimeMs?.mean);
});

gait.start();
const timer = window.setInterval(() => gait.flush(), 250);

// When the session ends:
window.clearInterval(timer);
unsubscribe();
gait.destroy();
```

Snapshots are published on explicit `flush()` calls, so native input events never cause application renders or network work by themselves.

## Packages

- `@gaitjs/core` — pure TypeScript aggregation and injectable ports.
- `@gaitjs/browser` — DOM event normalization and a monotonic browser clock.
- `@gaitjs/react` — React lifecycle and external-store hooks.
- `@gaitjs/vue` — Vue lifecycle and shallow refs.
- `@gaitjs/svelte` — subscription-scoped readable store.
- `@gaitjs/angular` — Angular signal adapter.
- `@gaitjs/schema` — versioned snapshot schema.
- `@gaitjs/testing` — deterministic event source helpers.

## Documentation

Read the [documentation](https://0xjohnnyboy.github.io/gait/docs/) or try the [live demo](https://0xjohnnyboy.github.io/gait/).

The metrics are correlation signals, not proof of identity or cheating. The browser is a controllable environment: confidence hints cannot prove that an event came from a human or that a device is unique.

## Development

```bash
pnpm install
pnpm typecheck
pnpm test
pnpm --dir site check
pnpm --dir site build
```

## License

gait is licensed under the [GNU Affero General Public License v3.0 only](./LICENSE) (`AGPL-3.0-only`).
