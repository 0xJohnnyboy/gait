# Instructions agents — gait

## Contexte

`gait` est une bibliothèque TypeScript open-source qui capture et agrège localement des métriques comportementales de clavier, pointeur, touch et contexte navigateur. Les sorties peuvent être consommées par un serveur pour corrélation, matching ou analyse antifraude, mais `gait` ne réalise aucun matching, scoring de triche, bannissement ou envoi réseau.

La spécification de référence est [specs/2026-11-10-gait-behavioral-metrics.md](specs/2026-11-10-gait-behavioral-metrics.md). Le workflow multi-agent est décrit dans [agents/README.md](agents/README.md) et [agents/harness.json](agents/harness.json).

## Règles d’architecture

- `@gaitjs/core` reste pur TypeScript : aucun DOM, framework, réseau, stockage ou effet à l’import.
- `@gaitjs/browser` fournit les listeners DOM, la normalisation, l’horloge monotone et le scheduler.
- Les adaptateurs React, Vue, Svelte et Angular ne font que gérer lifecycle, subscription et exposition des snapshots.
- Les ports restent petits et injectables : source d’événements, horloge, scheduler.
- Pas d’hexagonale cérémonielle, de singleton global, de conteneur DI ou d’abstraction sans bénéfice mesurable.
- Les adaptateurs ne recalculent jamais les métriques et ne conservent pas d’événements bruts.

## Détection et confiance

- Les métriques sont des signaux de corrélation parmi d’autres, jamais une preuve d’identité ou de triche.
- `isTrusted`, les anomalies temporelles, les gaps et les incohérences de séquence peuvent dégrader la confiance, mais ne prouvent pas un spoofing.
- Le navigateur est un environnement contrôlable par du code hostile : il est impossible de garantir qu’un événement représente un humain réel.
- Aucun agent ne doit ajouter de sanction, de décision automatique, de fingerprint stable, d’adresse IP ou d’intégration obligatoire à FingerprintJS.
- Le traitement interne des touches doit rester minimal et temporaire ; aucun contenu, caractère ou identifiant précis de touche ne doit apparaître dans le snapshot.

## Performance obligatoire

- Aucun réseau, JSON ou callback utilisateur dans le chemin chaud.
- Aucun re-render framework par événement brut.
- Buffers strictement bornés ; aucun tri ou buffer non borné dans les listeners.
- Accumulateurs en ligne pour les statistiques ; snapshots construits lors d’un flush ou d’une lecture explicite.
- Après warm-up, aucune allocation JavaScript observable du code `gait` par événement dans le chemin chaud.
- Toute modification de performance doit être accompagnée d’un benchmark reproductible et de mesures p95/p99.
- `start()`, `stop()` et `destroy()` doivent libérer listeners, timers, rAF, abonnements et références retenues.

## SSR et compatibilité

- Aucun accès à `window`, `document`, `navigator` ou `performance` au niveau module.
- Les imports Core et adaptateurs doivent rester SSR-safe ; le démarrage navigateur est explicite et client-only.
- Les capacités optionnelles (`getCoalescedEvents`, touch, etc.) sont détectées à l’exécution avec fallback propre.

## Workflow agent

- Lire la spec et le rôle assigné avant de modifier un fichier.
- Respecter strictement l’ownership indiqué dans `agents/harness.json`.
- Ne pas modifier simultanément les contrats publics depuis plusieurs rôles.
- Ajouter ou mettre à jour les tests avec chaque changement de comportement.
- Signaler les changements d’API, de schéma ou de budget performance avant intégration.
- Le reviewer final ne modifie pas le code : il produit des findings par sévérité et une décision `approve` ou `request_changes`.
