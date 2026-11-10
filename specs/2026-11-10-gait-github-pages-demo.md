# Spec: gait — landing page et démo temps réel GitHub Pages

## 1. Meta

- **Statut :** Draft — validation explicite requise (`SPEC APPROVED`).
- **Date :** 2026-11-10
- **Projet :** `gait`
- **Emplacement :** même repository, répertoire `site/`.
- **Stack proposée :** Astro statique, île React pour le widget interactif, Tailwind CSS et composants shadcn/ui.
- **Déploiement :** GitHub Pages via GitHub Actions, avec support de l’URL de projet `/<repository>/`.

Références techniques : [déploiement Astro sur GitHub Pages](https://docs.astro.build/en/guides/deploy/github/), [intégration React Astro](https://docs.astro.build/en/guides/integrations-guide/react/), [installation shadcn/ui avec Astro](https://ui.shadcn.com/docs/installation/astro).

## 2. Contexte / Problème

`gait` dispose d’un Core de collecte et d’agrégation, mais il manque une expérience publique permettant de comprendre immédiatement sa valeur : observer des métriques comportementales calculées en temps réel, tout en montrant que les données restent locales au navigateur.

Le site doit servir de landing page produit pour développeurs et équipes antifraude, puis de point d’entrée vers une documentation Markdown versionnée dans le repository.

GitHub Pages impose un site statique pré-rendu. La démo ne peut donc dépendre d’un backend, d’un endpoint de collecte ou d’une session serveur.

## 3. Objectifs

- Créer une landing page esthétique, responsive et orientée produit.
- Montrer en temps réel les métriques calculées par `gait` sur les interactions de la page.
- Rendre visible et compréhensible la valeur de `gait` sans présenter ses métriques comme une preuve d’identité ou de triche.
- Afficher explicitement que la démo fonctionne localement et n’envoie pas les événements capturés.
- Réutiliser les vrais packages `@gait/core` et `@gait/browser`, sans réimplémenter les formules dans le site.
- Ajouter une documentation Markdown dans le repo, navigable depuis le site.
- Déployer automatiquement le dossier `site/` sur GitHub Pages depuis GitHub Actions.
- Garantir une bonne performance initiale : HTML statique rapide, JavaScript interactif limité à l’île de démo.

## 4. Non-objectifs

- Collecter, stocker ou transmettre les événements de visiteurs.
- Fournir un système de matching, de fingerprinting ou de scoring antifraude.
- Connecter FingerprintJS, une adresse IP ou une API serveur.
- Capturer le contenu des touches, les coordonnées brutes ou les trajectoires dans l’interface ou un formulaire.
- Construire une console d’administration ou une authentification.
- Transformer le site en application SPA complète.
- Garantir qu’un visiteur réel ou qu’un événement `isTrusted` représente un humain non manipulé.

## 5. Scope

### In

- Application Astro dans `site/`.
- Page d’accueil landing page avec :
  - hero produit et proposition de valeur ;
  - CTA vers la démo et la documentation ;
  - section “comment ça marche” ;
  - section métriques ;
  - section architecture/privacy ;
  - section intégration TypeScript ;
  - footer avec liens GitHub, npm/documentation et statut local-only.
- Île React `LiveMetricsDemo` hydratée côté client.
- Capture directe des événements clavier, pointeur, touch, wheel, focus et visibilité par `@gait/browser`.
- Agrégation via `@gait/core` et affichage de :
  - dwell time moyen, médian et p95 ;
  - flight time moyen, médian et p95 ;
  - vitesse et accélération du pointeur ;
  - distance, clics, événements touch et wheel ;
  - événements vus/acceptés/rejetés ;
  - indice de confiance et raisons de dégradation ;
  - durée de session locale et statut des signaux.
- Visualisations légères : cartes métriques, mini-histogrammes ou sparklines bornées, jauge de confiance.
- Documentation Markdown sous `site/src/content/docs/` ou emplacement équivalent :
  - démarrage rapide ;
  - API Core ;
  - intégration navigateur ;
  - adaptateurs frameworks ;
  - privacy et limites ;
  - performance.
- Navigation statique entre landing page et pages docs.
- Configuration Astro de `site` avec `site` et `base` adaptés au nom du repository.
- Workflow `.github/workflows/deploy-site.yml` : installation déterministe, build du site, upload et déploiement GitHub Pages.
- Vérification de build sur pull request sans déploiement de production.

### Out

- Analytics tiers, cookies marketing et tracking visiteur.
- API server-side ou fonction GitHub.
- Upload de snapshots.
- Mode “exporter vers le serveur” dans la démo.
- Panneau de configuration complet de `gait` ; seules les options utiles à la démonstration peuvent être visibles.

## 6. Risques et Impacts

- **Vie privée :** la page capture directement les interactions du visiteur. Le bandeau local-only doit être visible avant ou au moment de l’activation et aucune donnée brute ne doit quitter le navigateur.
- **Ambiguïté produit :** les graphiques peuvent suggérer une précision antifraude excessive. Le copywriting doit indiquer “signal de corrélation” et “heuristique”, jamais “preuve” ou “détection garantie”.
- **Performance :** le widget ne doit pas provoquer de re-render à chaque événement. Les mises à jour visuelles sont limitées à une fréquence de publication explicite, par exemple 4 à 10 Hz.
- **Accessibilité :** les graphiques doivent avoir un équivalent textuel, les animations doivent respecter `prefers-reduced-motion`, et les contrastes doivent être vérifiés.
- **GitHub Pages :** les assets et routes doivent fonctionner sous un sous-chemin de repository, pas seulement à la racine d’un domaine.
- **Compatibilité :** un navigateur sans Pointer Events ou sans une capacité optionnelle doit afficher un état dégradé compréhensible, pas une page cassée.
- **Spoofing :** la démo ne doit pas présenter `isTrusted` ou l’indice de confiance comme une preuve d’intégrité du navigateur.

## 7. Approche proposée

### 7.1 Architecture du site

```text
site/
├── astro.config.mjs
├── package.json
├── public/
├── src/
│   ├── components/
│   │   ├── ui/                 # composants shadcn/ui utilisés
│   │   ├── LiveMetricsDemo.tsx # seule île interactive principale
│   │   ├── MetricCard.astro
│   │   └── MetricChart.tsx
│   ├── content/docs/
│   ├── layouts/
│   ├── pages/
│   │   ├── index.astro
│   │   └── docs/[...slug].astro
│   ├── styles/
│   └── lib/
└── tests/
```

Astro rend la structure et le contenu statiques. React est réservé au widget qui doit écouter le navigateur et publier des snapshots périodiques. Les composants shadcn/ui servent aux primitives visuelles ; ils ne doivent pas devenir une dépendance de `@gait/core`.

### 7.2 Landing page

Direction visuelle “developer tool premium” : thème sombre par défaut, accents cyan/violet, surfaces translucides limitées, typographie nette et animations discrètes. Le design doit rester lisible et crédible plutôt que ressembler à un dashboard antifraude agressif.

Sections obligatoires :

1. **Hero :** “Behavioral signals, computed locally.” avec CTA `See it live` et `Read the docs`.
2. **Démo :** widget immédiatement visible après le hero sur desktop, empilé sur mobile.
3. **Signals :** clavier, pointeur, contexte, confiance, chacun avec une explication simple.
4. **Architecture :** schéma léger `browser events → core → aggregated snapshot`, sans réseau.
5. **Code :** exemple minimal `createBrowserGait()` et `snapshot()`.
6. **Privacy/performance :** messages courts sur local-only, données brutes non exportées et absence de re-render par événement.
7. **Docs CTA/footer.**

### 7.3 Widget temps réel

`LiveMetricsDemo` instancie `createBrowserGait()` côté client et écoute les snapshots publiés par `flush()` ou par un scheduler dédié. Aucun événement brut ne doit être placé dans l’état React.

Le widget capture directement les interactions, sans bouton de démarrage obligatoire, conformément à la demande produit. Il affiche en permanence une mention compacte : `Local demo · nothing is sent`.

Comportement :

- démarrage client-only après hydratation ;
- arrêt et destruction à la sortie de l’île/composant ;
- publication visuelle limitée à une cadence contrôlée ;
- snapshot initial vide et déterministe pour SSR ;
- état `collecting`, `unsupported` ou `error` affiché sans casser la landing page ;
- `prefers-reduced-motion` désactive les animations décoratives ;
- aucun appel `fetch`, beacon, analytics ou stockage local lié aux métriques.

Le widget doit privilégier les valeurs agrégées et les labels compréhensibles. Les codes de touche, le contenu saisi, les coordonnées brutes et les trajectoires ne sont jamais affichés.

### 7.4 Documentation

Les pages Markdown sont la source versionnée de la documentation du site. Elles doivent expliquer :

- installation et import ;
- `createGait` et `createBrowserGait` ;
- structure de snapshot ;
- signaux disponibles ;
- performance et publication des snapshots ;
- limites de confiance et de spoofing ;
- responsabilité de l’intégrateur concernant l’usage serveur ultérieur.

Les exemples de code doivent être cohérents avec les exports réellement construits par le monorepo.

### 7.5 GitHub Pages

Le site doit définir explicitement `site` et `base` pour produire des URLs correctes sous `https://<owner>.github.io/<repository>/`. Le workflow doit utiliser les permissions minimales nécessaires, builder `site/`, publier l’artefact Astro et déployer via l’environnement GitHub Pages.

Le workflow doit être déclenché sur push vers `main` lorsqu’un fichier du site, de ses packages ou du workflow change, et sur pull request en mode build/validation uniquement.

## 8. Alternatives considérées

- **Astro sans React :** plus léger, mais moins ergonomique pour le widget réactif et les primitives shadcn demandées.
- **React/Vite SPA complète :** plus simple pour le widget, mais moins performante pour la landing et moins adaptée à une documentation Markdown statique.
- **Démo avec bouton “Start”:** meilleure maîtrise de la collecte, mais contraire à la volonté de montrer la capture directe des événements.
- **Graphiques externes lourds :** rejetés ; les visualisations de la démo doivent rester petites et contrôlables.
- **GitHub Pages depuis `docs/`:** possible, mais `site/` sépare clairement l’application de démonstration du package et de la documentation technique du repository.

## 9. Plan d'implémentation

1. Créer `site/` Astro avec Tailwind, React et shadcn/ui ; configurer alias, base path et build statique.
2. Ajouter le layout global, thème, navigation, typography, tokens et primitives UI nécessaires.
3. Implémenter la landing page statique et ses sections produit.
4. Implémenter `LiveMetricsDemo` avec `@gait/browser` et `@gait/core`, snapshot initial, cadence de publication et cleanup.
5. Ajouter cartes, sparklines/histogrammes, jauge de confiance et états unsupported/error.
6. Migrer/écrire la documentation Markdown et les pages docs Astro.
7. Ajouter tests de composants et tests navigateur : SSR, hydration, capture locale, absence de réseau, render count et responsive smoke tests.
8. Ajouter `.github/workflows/deploy-site.yml`, vérifier le build sur sous-chemin et publier un preview artifact en PR.
9. Effectuer une revue accessibilité, performance et privacy, puis documenter les limites résiduelles.

## 10. Plan de test

- Build Astro en production avec base path de repository.
- Vérification des routes landing/docs et des assets sous sous-chemin.
- SSR/hydration sans accès aux APIs browser pendant le rendu serveur.
- Test du widget avec événements clavier/pointeur/touch/wheel synthétiques.
- Test qu’aucun `fetch`, beacon, WebSocket, cookie ou localStorage n’est utilisé pour les métriques.
- Test qu’une rafale de 10 000 événements ne produit pas 10 000 re-renders React.
- Test du cleanup des listeners à la destruction de l’île.
- Test des états unsupported/error et des snapshots sans échantillon.
- Test de l’équivalent textuel des graphiques et des labels ARIA.
- Test `prefers-reduced-motion`, clavier seul et contrastes principaux.
- Lighthouse ou équivalent sur build production : HTML initial statique, JS de l’île limité et absence de long task attribuable au widget dans le scénario nominal.
- Validation GitHub Actions du build sur push et PR.

## 11. Critères d'acceptation

- **AC-1 :** le site est situé dans le repository sous `site/`, se build en statique Astro et fonctionne sous le sous-chemin GitHub Pages du repository.
- **AC-2 :** la landing page contient hero, CTA, démo, signaux, architecture, exemple de code, privacy/performance et footer cohérents visuellement.
- **AC-3 :** le widget capture directement les événements côté client et affiche des métriques réelles calculées par `@gait/core`/`@gait/browser`, sans formule dupliquée dans le site.
- **AC-4 :** le widget affiche au minimum dwell time, flight time, vitesse/accélération pointeur, événements acceptés/rejetés et confiance avec `degradationReasons`.
- **AC-5 :** la mention locale est visible dans le widget et aucun événement ou snapshot n’est envoyé, stocké ou transmis par le site.
- **AC-6 :** aucun contenu de touche, code de touche, coordonnée brute ou trajectoire ne figure dans l’UI ou dans un export de démo.
- **AC-7 :** le widget ne déclenche pas de render React par événement brut ; les mises à jour sont limitées à la cadence de snapshot définie.
- **AC-8 :** l’import SSR, l’hydratation, l’arrêt et la destruction de la démo sont testés ; aucun listener ne fuit.
- **AC-9 :** la documentation Markdown couvre installation, API, snapshots, performance, privacy et limites de confiance, avec exemples compilables ou vérifiés.
- **AC-10 :** GitHub Actions build et déploie le site sur GitHub Pages depuis `main`, avec permissions minimales et validation de build sur pull request.
- **AC-11 :** les états navigateur non supporté, erreur, absence d’échantillons et `prefers-reduced-motion` sont accessibles et non bloquants.
- **AC-12 :** le build de production respecte un budget documenté de JavaScript initial et ne produit pas de long task attribuable à la démo dans le scénario nominal.
