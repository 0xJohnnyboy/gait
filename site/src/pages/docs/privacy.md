---
title: Privacy and trust
description: Understand exactly what gait collects and what it deliberately does not do.
layout: ../../layouts/DocsLayout.astro
---
<div class="eyebrow">privacy</div>
# Privacy and trust

Gait collects local behavioral summaries so an application can decide what to do with them. It does not make an identity decision and it has no transport, persistence, account, IP or FingerprintJS integration.

## What is exposed

Snapshots contain aggregate statistics such as dwell time, flight time, pointer speed, acceleration, distances, counts, context gaps and capture-quality metadata. Keyboard content is not exposed: internal key pairing uses a temporary key identifier, while the public snapshot contains only aggregate results and `unmatchedKeyCount`.

Every signal has `eventsSeen`, `eventsAccepted` and `eventsRejected`. These are diagnostic counters, not behavioral identity features. Missing metric summaries mean there were no usable observations; they are not zero-valued measurements.

## Confidence is a quality hint

`quality.confidence` reports a bounded score, a low/medium/high level and `degradationReasons`. Reasons explain why the capture quality is degraded, for example insufficient samples, timestamp anomalies, event gaps, visibility gaps or synthetic hints. They are not proof that an event was spoofed, and a score of zero cannot establish hostile code or automation.

Use these values as one correlation signal among others. If your product needs matching, document the decision and retention policy in the application or server that consumes the snapshot. Combining signals such as an external device signal, IP context or FingerprintJS is an integrator decision and is outside gait's scope.

## Application responsibilities

- Obtain any consent or notice required by the product's jurisdiction and context.
- Decide whether capture should be started for a given user interaction or session.
- Keep snapshots local until the application explicitly hands them to its own boundary.
- Define retention, access control, deletion and server-side protection policies.
- Never present gait as proof of identity, authorship or cheating.

Destroy the instance when the relevant session or component ends. `destroy()` releases listeners, timers, subscriptions and retained references; it does not delete data your application has already copied elsewhere.
