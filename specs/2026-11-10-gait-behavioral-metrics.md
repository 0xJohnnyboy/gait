# Spec: gait — bibliothèque TypeScript de métriques comportementales

## 1. Meta

- **Statut :** Draft — validation explicite requise (`SPEC APPROVED`).
- **Date :** 2026-11-10
- **Propriétaire :** équipe gait
- **Type :** bibliothèque open-source, monorepo TypeScript
- **V1 :** capture et agrégation locales de signaux clavier, souris, pointeur, touch et visibilité ; aucune communication réseau ni décision métier.

## 2. Contexte / Problème

Les jeux web peuvent avoir besoin de signaux comportementaux supplémentaires pour corréler des sessions, analyser de possibles multi-comptes ou assister la revue de triche ELO. Les événements bruts sont volumineux, sensibles et coûteux à transférer. Il faut donc produire un résumé typé, versionné et performant, sans coupler la collecte à un framework, un backend ou un fournisseur de fingerprinting.

Les métriques sont des éléments de corrélation parmi d’autres. Elles ne doivent jamais être présentées par `gait` comme une identité, une preuve de triche ou une recommandation de sanction.

## 3. Objectifs

- Fournir un Core TypeScript pur, indépendant de tout framework.
- Capturer et agréger des signaux clavier, souris/pointeur, touch, scroll, visibilité et focus.
- Calculer notamment vitesse de curseur, dwell time, flight time, latences, distributions et qualité de capture.
- Exposer une API impérative, fortement typée, compatible avec React, Vue, Svelte et Angular via adaptateurs minces.
- Éviter les re-renders, allocations et traitements synchrones coûteux sur le chemin des événements.
- Retourner un JSON sérialisable, versionné, sans contenu de touche ni trajectoire brute par défaut.
- Fournir un indice de confiance technique indiquant la qualité/complétude de la capture, sans prétendre détecter infailliblement la falsification.

## 4. Non-objectifs

- Envoi réseau, persistance, chiffrement, consentement ou gestion de profils.
- Matching d’utilisateurs, fingerprinting d’identité, scoring de triche ou sanction.
- Détection garantie des bots, injections JavaScript, DevTools ou événements synthétiques.
- Remplacement de FingerprintJS, d’une adresse IP ou d’un système anti-fraude serveur.
- Capture de texte saisi, valeurs de champs, coordonnées GPS ou contenu des pages.
- Support des anciennes plateformes hors matrice officiellement testée.

## 5. Scope

### In

- Monorepo pnpm/Turborepo ou équivalent avec packages indépendants :
  - `@gait/core` : types, collecte, agrégation, calculs, sérialisation.
  - `@gait/react`, `@gait/vue`, `@gait/svelte`, `@gait/angular` : intégrations lifecycle et abonnement.
  - `@gait/testing` : horloge, générateurs d’événements et fixtures de test.
- Distribution ESM et CommonJS, déclarations TypeScript, `strict: true`, tree-shaking.
- Support navigateur moderne avec `PointerEvent`, `KeyboardEvent`, `performance.now()`, `queueMicrotask` et `requestIdleCallback` optionnel ; aucun accès DOM lors de l’import.
- API de démarrage/arrêt, configuration des signaux, reset, snapshot et export JSON.
- Version de schéma explicite et compatibilité forward contrôlée.

### Out

- SDK serveur ou protocole de transport.
- Dépendance obligatoire à un framework, à React state ou à un store global.
- Collecte automatique d’identifiant stable ou de données réseau.
- Analyse ML intégrée ; les agrégats peuvent alimenter ultérieurement un modèle externe.

## 6. Risques et Impacts

- **Faux positifs :** périphériques, handicaps, latence, jeu au mobile, fatigue et contexte changent fortement le comportement. Les sorties sont descriptives et doivent être combinées à d’autres signaux et à une revue appropriée.
- **Falsification :** des scripts peuvent appeler `dispatchEvent`, monkey-patcher les APIs ou injecter des événements. `gait` ne peut pas établir une preuve d’authenticité dans un navigateur hostile.
- **Vie privée :** les distributions comportementales peuvent être distinctives. Le Core ne conserve pas de données brutes après agrégation et n’inclut pas de contenu de frappe. L’intégrateur reste responsable du traitement ultérieur et de sa base légale.
- **Performance :** l’écoute de `pointermove` peut être très fréquente. Toute logique O(n) par événement, re-render ou allocation répétée est interdite sur le chemin critique.
- **Compatibilité :** les événements et propriétés peuvent manquer ou être réduits selon le navigateur, le touch ou les permissions ; les métriques absentes sont représentées explicitement, pas inventées.
- **Rollback :** la capture doit pouvoir être arrêtée par `stop()` et désactivée par l’intégrateur avant création de l’instance ; aucun mécanisme distant n’est requis.

## 7. Approche proposée

### 7.1 Architecture

Le Core contient un pipeline :

`EventSource -> Normalizer -> RingBuffer/Accumulators -> MetricWindows -> SnapshotSerializer`

Les adaptateurs framework ne calculent rien. Ils créent/détruisent une instance, transmettent les options et exposent un snapshot via mécanisme de souscription non réactif par défaut. Aucun événement ne doit provoquer un re-render ; l’application choisit explicitement quand lire ou publier un snapshot.

L’instance accepte une source d’événements injectable. La source navigateur par défaut s’abonne à `window`/`document` uniquement lors de `start()`, ce qui rend le Core testable et compatible SSR.

### 7.2 API publique proposée

```ts
export interface GaitConfig {
  signals?: Partial<Record<SignalName, boolean>>;
  sample?: { pointerHz?: number; flushMs?: number };
  window?: { durationMs?: number; maxEvents?: number };
  clock?: () => number;
  onSnapshot?: (snapshot: GaitSnapshot) => void;
}

export interface Gait {
  start(): void;
  stop(): void;
  reset(): void;
  snapshot(): GaitSnapshot;
  subscribe(listener: (snapshot: GaitSnapshot) => void): () => void;
  destroy(): void;
}

export declare function createGait(config?: GaitConfig): Gait;
```

`start()` et `stop()` sont idempotents. `destroy()` libère écouteurs, buffers et abonnés ; tout appel ultérieur hors `snapshot()` doit échouer clairement ou être documenté comme no-op. Les callbacks sont optionnels et jamais appelés sur chaque `pointermove` : ils sont déclenchés au flush configuré.

### 7.3 Signaux

- **Clavier :** `keydown`/`keyup`, sans caractère, valeur, code de touche ou contenu textuel ; conservation de la catégorie physique/logique seulement si disponible et autorisée par configuration.
- **Pointeur/souris :** `pointermove`, `pointerdown`, `pointerup`, `click`, `wheel`, avec delta, durée, vitesse et accélération agrégées ; coordonnées absolues non exportées par défaut.
- **Touch :** même modèle agrégé, avec nombre de points et pression seulement si supportée et activée.
- **Contexte :** focus/blur, visibilitychange, pagehide/pageshow, changement de fenêtre de mesure.
- **Qualité :** timestamps monotones, événements rejetés, événements hors ordre, gaps et échantillonnage.

### 7.4 Calculs mathématiques

Tous les temps utilisent `performance.now()` ou une horloge monotone injectable, en millisecondes. Les événements sont normalisés et les timestamps non finis ou strictement antérieurs au dernier timestamp accepté sont rejetés.

Pour une touche `k`, si `d_k` est le timestamp `keyup` et `u_k` le timestamp `keydown` correspondant :

- `dwellTime_k = max(0, d_k - u_k)`.

Pour deux touches consécutives `k_i`, `k_{i+1}`, avec `d_i` le `keyup` de la première et `u_{i+1}` le `keydown` de la seconde :

- `flightTime_i = u_{i+1} - d_i`.
- Les chevauchements donnent une valeur négative ; ils sont comptés comme overlap et exclus des statistiques flight positives, tout en conservant leur compte.

Pour deux points de pointeur `(x_i,y_i,t_i)` et `(x_{i+1},y_{i+1},t_{i+1})` :

- `distance_i = hypot(x_{i+1}-x_i, y_{i+1}-y_i)`.
- `dt_i = t_{i+1}-t_i` ; si `dt_i <= 0`, le segment est rejeté.
- `speed_i = distance_i / dt_i` en pixels/ms.
- `acceleration_i = (speed_i-speed_{i-1}) / dt_i`.

Les métriques exportées comprennent au minimum `n` (nombre d’observations de la métrique), `min`, `max`, `mean`, `median` (P50), `p90`, `p95`, `stdDev` et `sum` lorsque définis. La moyenne et la variance utilisent des accumulateurs numériques stables de type Welford ; les percentiles utilisent un histogramme configurable ou un buffer borné, jamais un tri non borné sur le chemin événementiel. Les unités et valeurs invalides sont documentées dans le schéma. Les compteurs techniques d’événements (`eventsSeen`, `eventsAccepted`, `eventsRejected`) restent dans chaque section de signal concernée.

### 7.5 Indice de confiance

`confidence` est un objet de qualité de capture, pas un score d’identité :

```ts
interface CaptureConfidence {
  score: number; // 0..1
  level: 'low' | 'medium' | 'high';
  degradationReasons: Array<'insufficient_sample' | 'timestamp_anomaly' | 'event_gap' |
    'synthetic_hint' | 'visibility_gap' | 'unsupported_signal'>;
}
```

Le score est calculé à partir de la complétude, de la régularité temporelle, des anomalies et de la visibilité. `degradationReasons` décrit les facteurs qui empêchent le score d’atteindre 1.0 ; un niveau `high` peut donc avoir une ou plusieurs raisons de dégradation. Des indices comme `event.isTrusted === false` ou une incohérence entre source et horloge peuvent ajouter `synthetic_hint`, mais ne permettent pas de conclure qu’un émetteur a été modifié. Toute règle heuristique doit être documentée, testée et versionnée.

### 7.6 Schéma JSON de sortie

```json
{
  "schemaVersion": "1.0",
  "libraryVersion": "0.1.0",
  "capturedAt": { "durationMs": 42000, "startedAtMonotonicMs": 12.4 },
  "signals": {
    "keyboard": {
      "eventsSeen": 240,
      "eventsAccepted": 239,
      "eventsRejected": 1,
      "unmatchedKeyCount": 1,
      "dwellTimeMs": { "n": 118, "mean": 87.2, "p50": 81.0, "p90": 131.0, "p95": 162.0, "stdDev": 34.1 },
      "flightTimeMs": { "n": 96, "mean": 74.4, "p50": 62.0, "p90": 143.0, "overlapCount": 11 }
    },
    "pointer": {
      "eventsSeen": 875,
      "eventsAccepted": 840,
      "eventsRejected": 35,
      "sampleCount": 840,
      "distancePx": 18342.7,
      "speedPxPerMs": { "n": 839, "mean": 0.81, "p50": 0.63, "p90": 1.54, "p95": 2.08, "max": 4.7 },
      "accelerationPxPerMs2": { "n": 838, "mean": 0.02, "p95": 0.11 },
      "clickCount": 27,
      "wheelCount": 8
    },
    "context": {
      "eventsSeen": 6,
      "eventsAccepted": 6,
      "eventsRejected": 0,
      "focusMs": 38600,
      "blurCount": 2,
      "visibilityGapMs": 3400
    }
  },
  "quality": {
    "confidence": { "score": 0.86, "level": "high", "degradationReasons": ["event_gap"] }
  }
}
```

Le schéma est additif dans une même major version. Les champs absents indiquent une métrique non disponible ; `null` est réservé à une métrique connue mais indéfinie faute d’échantillons suffisants. Aucun champ ne contient une touche, un caractère, une coordonnée brute ou une URL.

### 7.7 Performance

- `pointermove` est coalescé au maximum à une fréquence configurable, idéalement via `requestAnimationFrame` ou un scheduler monotone.
- Les accumulateurs sont mutables et préalloués quand possible ; buffers circulaires bornés, pas de tableau global d’événements.
- Le flush et les percentiles sont différés hors chemin critique via `queueMicrotask`/`requestIdleCallback` avec fallback ; la capture ne bloque jamais le thread de jeu.
- `snapshot()` construit un objet immuable uniquement à la demande ou au flush ; les callbacks ne déclenchent pas de rendu framework par défaut.
- Les adaptateurs utilisent `useSyncExternalStore` pour React et équivalents de subscription/lifecycle pour Vue, Svelte et Angular, sans copier les snapshots à chaque événement.
- Les benchmarks doivent couvrir 60/120 Hz, rafales de pointeur, clavier soutenu et appareils bas de gamme ; budget cible : traitement moyen < 0,2 ms par événement normalisé et aucune allocation durable par événement après warm-up.

## 8. Alternatives considérées

- **Événements bruts exportés :** rejetés par défaut pour le volume, la vie privée et le couplage serveur.
- **Worker obligatoire :** non retenu en V1 car le transfert des événements et la sérialisation peuvent coûter plus cher ; architecture compatible avec un Worker ultérieur.
- **Calcul uniquement côté serveur :** rejeté car il augmente le volume et la latence ; le Core fournit des agrégats locaux.
- **Store réactif intégré :** rejeté pour éviter les re-renders implicites ; les adaptateurs exposent seulement l’intégration lifecycle/subscription.
- **Score antifraude intégré :** rejeté car le contexte et les autres signaux appartiennent à l’application consommatrice.

## 9. Plan d'implémentation

1. Initialiser le monorepo, les règles TypeScript strictes, les exports conditionnels, lint, tests et génération de schéma.
2. Implémenter types, horloge, normalisation, buffers bornés et accumulateurs statistiques.
3. Implémenter les collecteurs clavier, pointeur, touch, wheel et contexte, puis `createGait`.
4. Implémenter confiance, snapshot versionné et tests de compatibilité JSON.
5. Ajouter les adaptateurs React, Vue, Svelte et Angular, sans logique métier dupliquée.
6. Ajouter benchmarks, fixtures synthétiques, documentation des limites et exemple d’intégration.
7. Publier une première version 0.x ; toute modification incompatible du schéma ou de l’API augmente la major version avant 1.0.

## 10. Plan de test

- Tests unitaires déterministes avec horloge contrôlée pour dwell, flight, vitesse, accélération, percentiles, overlaps et événements hors ordre.
- Tests de propriétés : invariance aux timestamps monotones, absence de valeurs NaN/Infinity, buffers toujours bornés.
- Tests d’intégration navigateur : start/stop/reset/destroy, listeners, focus/visibility, touch et SSR import-safe.
- Tests d’adaptateurs : absence de re-render par événement et désabonnement complet au démontage.
- Tests de performance sur rafales 60/120 Hz, mémoire stable après warm-up et absence de fuite de listeners.
- Tests de sortie : validation JSON Schema, `schemaVersion`, absence de données brutes et compatibilité additive.
- Tests de limites : événements synthétiques, `isTrusted`, horloge manipulée, onglet masqué, périphérique non supporté ; vérifier que la confiance baisse sans prétendre identifier la cause avec certitude.

## 11. Critères d'acceptation

- **AC-1 :** `@gait/core` se compile en TypeScript strict et fonctionne sans framework ni accès DOM lors de l’import.
- **AC-2 :** l’API `start`, `stop`, `reset`, `snapshot`, `subscribe` et `destroy` est typée, documentée et idempotente selon le contrat.
- **AC-3 :** les signaux clavier, pointeur, touch, wheel et contexte sont capturables séparément et désactivables par configuration.
- **AC-4 :** dwell time, flight time, vitesse, accélération, overlaps et statistiques descriptives sont vérifiés par tests déterministes avec tolérance numérique documentée.
- **AC-5 :** le snapshot respecte `schemaVersion`, est JSON-sérialisable et ne contient ni contenu de frappe, ni coordonnées/trajectoires brutes, ni appel réseau.
- **AC-6 :** l’indice de confiance est borné dans `[0,1]`, expose ses raisons et traite les signaux d’anomalie comme heuristiques non probantes.
- **AC-7 :** aucune notification framework n’est déclenchée par événement brut ; les adaptateurs libèrent tous leurs listeners au démontage.
- **AC-8 :** les benchmarks démontrent des buffers bornés, aucune allocation durable par événement après warm-up et le budget moyen de traitement défini dans la section performance.
- **AC-9 :** les quatre adaptateurs React/Vue/Svelte/Angular sont publiés, testés et ne dupliquent pas la logique de calcul du Core.
- **AC-10 :** la documentation décrit explicitement les limites de spoofing, faux positifs, variations inter-périphériques et l’interdiction d’utiliser `gait` seul pour sanctionner un utilisateur.
