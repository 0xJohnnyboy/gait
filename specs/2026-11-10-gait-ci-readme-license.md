# Spec: CI qualité, README public et licence AGPL-3.0

## 1. Meta

- Statut : Draft — attente de `SPEC APPROVED`
- Branche prévue : `chore/ci-readme-license`
- Périmètre : racine du dépôt et `.github/workflows/`, sans changement de comportement de la bibliothèque
- Titulaire proposé : `gait contributors`, année `2026`

## 2. Contexte / Problème

Le dépôt est public et open-source, mais il ne possède pas encore de README de découverte, de fichier de licence explicite ni de CI qualité exécutant automatiquement le typecheck et les tests. Le workflow existant vérifie uniquement le site avant le déploiement GitHub Pages.

## 3. Objectifs

- Exécuter automatiquement les tests et le typecheck sur les pull requests et les pushes vers `main`.
- Garder la validation et le déploiement Pages lisibles et indépendants : une régression package doit être visible comme un échec CI qualité.
- Fournir un README concis, lisible par un humain et immédiatement utile à un nouvel utilisateur.
- Afficher des badges fiables pour la CI, la licence et la documentation/demo.
- Publier le dépôt sous GNU Affero General Public License v3.0, SPDX `AGPL-3.0-only`.

## 4. Non-objectifs

- Modifier les métriques, l'API publique, le schéma de snapshot ou le comportement runtime.
- Ajouter un système de release, npm publish, changelog automatique ou contribution complète.
- Changer le déploiement ou le design du site.
- Remplacer les licences de dépendances tierces.

## 5. Scope

### In

- Ajouter `.github/workflows/ci.yml` déclenché sur `pull_request` et `push` vers `main`, avec Node 24, pnpm 9.15.0 et `pnpm install --frozen-lockfile`.
- Exécuter dans cette CI : `pnpm typecheck`, `pnpm test`, `pnpm --dir site check` et `pnpm --dir site build`.
- Utiliser une concurrence distincte par workflow/PR afin de ne pas annuler un déploiement Pages de `main`.
- Ajouter `README.md` avec badges CI, licence et lien vers la demo/docs GitHub Pages, proposition de valeur, installation, exemple minimal, packages, limites privacy/trust, scripts de développement et licence.
- Ajouter `LICENSE` contenant le texte officiel complet de l'AGPL-3.0-only.
- Ajouter éventuellement le champ `license: AGPL-3.0-only` aux manifests npm pertinents sans modifier le caractère privé du workspace root.

### Out

- Aucun changement dans `packages/**` ou `site/src/**`, sauf si nécessaire pour rendre la CI existante exécutable.
- Aucun badge de couverture tant qu'aucun rapport de couverture stable n'est produit.

## 6. Risques et Impacts

- Le build du site augmente la durée de la CI, mais garantit que le README et les badges ne pointent pas vers un artefact cassé.
- Le badge Actions dépend du nom stable `.github/workflows/ci.yml`; le fichier ne doit pas être renommé sans mise à jour du README.
- AGPL-3.0 impose des obligations de redistribution lorsqu'une version modifiée est fournie via réseau ; le README doit rester factuel et ne pas présenter la licence comme MIT/Apache.
- Le texte légal doit être la version officielle, sans adaptation locale ni traduction partielle.
- Node 24 doit rester aligné avec les workflows existants et ne pas réintroduire Node 20.

## 7. Approche proposée

1. Créer une CI qualité dédiée, avec étapes nommées et commandes identiques à celles utilisées localement.
2. Garder `.github/workflows/deploy-site.yml` responsable de la validation Pages et du déploiement ; éviter les dépendances croisées qui rendraient le déploiement impossible à diagnostiquer.
3. Rédiger le README comme une page d'entrée : `gait` en une phrase, badges, liens, installation, exemple local, packages disponibles, garanties et limites, commandes de contribution.
4. Ajouter le texte officiel `GNU AFFERO GENERAL PUBLIC LICENSE Version 3, 19 November 2007` dans `LICENSE` et référencer `AGPL-3.0-only` dans le README.
5. Vérifier les URLs de badges, la présence du fichier de licence et le succès des commandes sur une checkout propre.

## 8. Alternatives considérées

- Ajouter uniquement `pnpm test` au workflow Pages : rejeté, car la CI qualité et le déploiement auraient des responsabilités mélangées.
- Ajouter une couverture de code : reporté, car aucun seuil ni reporter n'est défini.
- Utiliser AGPL-3.0-or-later : rejeté pour cette livraison ; `AGPL-3.0-only` est le choix demandé et doit être cohérent partout.

## 9. Plan d'implémentation

1. Ajouter le workflow CI et vérifier les actions/runtime existants.
2. Ajouter le README et les métadonnées de licence.
3. Ajouter le texte intégral de `LICENSE`.
4. Valider localement les commandes et les liens/fichiers attendus.
5. Committer atomiquement et ouvrir une PR dédiée.

## 10. Plan de test

- `pnpm install --frozen-lockfile`
- `pnpm typecheck`
- `pnpm test`
- `pnpm --dir site check`
- `pnpm --dir site build`
- vérifier que `README.md`, `LICENSE` et `.github/workflows/ci.yml` existent dans une checkout propre
- vérifier les badges et liens du README par inspection des URLs attendues
- valider la syntaxe YAML du workflow et les versions Node/pnpm

## 11. Critères d'acceptation

- **AC-1** — Une PR déclenche `.github/workflows/ci.yml` et exécute typecheck, tests, site check et site build avec Node 24 et pnpm 9.15.0.
- **AC-2** — Un push vers `main` déclenche la même CI qualité sans partager une concurrence destructive avec le déploiement Pages.
- **AC-3** — Le README présente en moins de quelques écrans le but, l'installation, un exemple, les packages, les liens demo/docs, les limites privacy/trust et les commandes principales.
- **AC-4** — Le README contient un badge CI pointant vers le workflow `ci.yml`, un badge licence AGPL-3.0-only et un lien fonctionnel vers la demo/docs.
- **AC-5** — `LICENSE` contient le texte officiel complet de l'AGPL v3 et le README indique explicitement `AGPL-3.0-only`.
- **AC-6** — Aucun package runtime, métrique, schéma ou API publique n'est modifié par cette livraison.
- **AC-7** — Toutes les commandes de validation passent localement avec `--frozen-lockfile` et une CI fraîche.
