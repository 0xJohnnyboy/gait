# Spec: Renommer le scope npm en `@gaitjs/*`

## 1. Meta

- Statut : Draft — attente de `SPEC APPROVED`
- Scope cible : organisation npm `gaitjs`
- Changement : `@gait/*` → `@gaitjs/*`

## 2. Contexte / Problème

Le scope npm `@gait` n'est pas disponible. L'organisation npm créée pour le projet est `gaitjs`, donc les packages doivent utiliser ce scope pour pouvoir être publiés sous l'organisation contrôlée.

## 3. Objectifs

- Renommer tous les packages publiables en `@gaitjs/*`.
- Mettre à jour toutes les dépendances workspace et tous les imports internes.
- Mettre à jour les alias TypeScript, le site, la documentation, le README et les exemples.
- Conserver les versions, exports, API runtime et comportement inchangés.
- Vérifier que les artefacts buildés et les manifests sont publiables sous le nouveau scope.

## 4. Non-objectifs

- Modifier les noms de fonctions, les snapshots, les métriques ou les contrats JSON.
- Publier automatiquement sur npm dans cette livraison.
- Conserver des alias de compatibilité `@gait/*`.

## 5. Scope

### In

- `@gait/core` → `@gaitjs/core`
- `@gait/browser` → `@gaitjs/browser`
- `@gait/react` → `@gaitjs/react`
- `@gait/vue` → `@gaitjs/vue`
- `@gait/svelte` → `@gaitjs/svelte`
- `@gait/angular` → `@gaitjs/angular`
- `@gait/schema` → `@gaitjs/schema`
- `@gait/testing` → `@gaitjs/testing`
- imports, dépendances, alias, README, docs, scripts et fixtures concernés
- vérification de `pnpm pack`/build des manifests sans publication réseau

### Out

- Toute modification fonctionnelle des packages.
- Création ou modification de comptes, tokens ou permissions npm.
- Publication npm effective.

## 6. Risques et Impacts

- C'est un breaking change pour les imports consommateurs ; il faut le signaler explicitement dans le README.
- Les anciens noms ne seront pas automatiquement redirigés puisqu'ils ne sont pas publiés.
- Une référence oubliée peut casser le build, les types ou le site ; la recherche globale et les builds sont obligatoires.

## 7. Approche proposée

1. Remplacer les noms de package et dépendances dans les manifests.
2. Remplacer les imports et alias `@gait/*` dans le code, les tests, le site et la documentation.
3. Régénérer le lockfile.
4. Exécuter typecheck, tests, build monorepo et build/check site.
5. Vérifier qu'il ne reste aucune référence active à `@gait/` et que les tarballs contiennent des dépendances résolues vers `@gaitjs/*`.

## 8. Alternatives considérées

- Renommer les packages en noms non scopés : rejeté, car l'organisation `gaitjs` existe désormais.
- Garder `@gait/*` et publier ailleurs : impossible sans contrôler le scope npm `gait`.

## 9. Plan d'implémentation

1. Mettre à jour les manifests et références.
2. Régénérer le lockfile.
3. Vérifier le build et les artefacts npm.
4. Mettre à jour le README avec les nouveaux noms et la note de migration.
5. Commiter et ouvrir une PR dédiée.

## 10. Plan de test

- `pnpm install --frozen-lockfile`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`
- `pnpm --dir site check`
- `pnpm --dir site build`
- `rg '@gait/'` hors artefacts générés
- `pnpm pack --pack-destination` pour chaque package et inspection des manifests packés

## 11. Critères d'acceptation

- **AC-1** — Les huit manifests portent le nom `@gaitjs/*` attendu.
- **AC-2** — Aucune dépendance ou import runtime/typecheck ne référence encore `@gait/*`.
- **AC-3** — Le lockfile et les alias workspace sont cohérents avec `@gaitjs/*`.
- **AC-4** — README, site et exemples utilisent les nouveaux noms.
- **AC-5** — Typecheck, tests, build monorepo, site check et site build passent.
- **AC-6** — Chaque package produit un artefact packable dont les dépendances internes utilisent `@gaitjs/*`.
- **AC-7** — Aucun changement fonctionnel ou publication npm n'est effectué dans cette livraison.
