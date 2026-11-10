# Spec: Site de documentation gait basé sur Astro Starlight

## 1. Meta

- Statut : Draft — attente de `SPEC APPROVED`
- Branche : `feat/docs-site-proper`
- Périmètre : `site/` uniquement, hors landing page et démo temps réel existantes
- Référence technique : Astro Starlight, contenu Markdown/MDX et composants Starlight

## 2. Contexte / Problème

Le site actuel mélange la direction visuelle de la landing page avec la documentation. La navigation est insuffisante, la recherche absente, la structure de contenu n'est pas celle d'un site de documentation classique et les exemples multi-frameworks ne sont pas présentés de façon cohérente.

La landing page existante est jugée bonne et doit rester intacte. La documentation doit être reconstruite séparément avec une architecture de contenu et de présentation adaptée aux sites docs open-source modernes.

## 3. Objectifs

- Fournir une documentation navigable comme un site docs standard : header, sidebar gauche, groupes de topics, table des matières de page et responsive mobile.
- Utiliser Astro Starlight pour le shell documentaire, la navigation, la recherche Pagefind, les styles de contenu et l'accessibilité de base.
- Stocker le contenu dans `site/src/content/docs/` en `.md` ou `.mdx`, avec frontmatter Starlight.
- Séparer strictement le contenu documentaire des composants d'affichage.
- Utiliser les composants MDX Starlight `Tabs`/`TabItem` pour les exemples d'intégration Browser/TypeScript, React, Vue, Svelte et Angular.
- Synchroniser les groupes d'onglets liés via un `syncKey` afin que le choix de framework soit conservé sur la page.
- Documenter réellement l'API, le navigateur, l'architecture, la performance, la privacy et chaque adaptateur.
- Conserver le build statique GitHub Pages et le préfixe `/gait`.

## 4. Non-objectifs

- Ne pas modifier la landing page, son design ou le composant de démo temps réel, sauf correction nécessaire pour le routing partagé.
- Ne pas créer de système de recherche custom en JavaScript ou de serveur de recherche.
- Ne pas mettre de JavaScript applicatif dans les fichiers Markdown/MDX pour gérer les onglets ; les composants Starlight portent le comportement et le contenu MDX ne fait que les déclarer.
- Ne pas introduire React, shadcn ou une seconde librairie de layout pour la documentation.
- Ne pas ajouter de CMS, d'authentification, d'analytics ou de collecte réseau.

## 5. Scope

### In

- Remplacer l'implémentation actuelle des pages docs par l'intégration Starlight.
- Ajouter/configurer `@astrojs/starlight` et les dépendances strictement nécessaires.
- Créer une arborescence de contenu MDX sous `site/src/content/docs/docs/` : introduction, installation, guides d'utilisation, métriques, intégrations, référence API, architecture, performance, privacy et dépannage. Le double segment `docs` est intentionnel pour conserver l'URL publique `/gait/docs/`.
- Définir la sidebar dans `astro.config.mjs` avec des groupes `Getting started`, `Core`, `Browser`, `Framework adapters`, `Guidance`.
- Activer la recherche Pagefind produite lors du build statique.
- Utiliser les composants Starlight de code, tabs, cards/callouts et la table des matières native.
- Ajouter des exemples multi-frameworks dans les sections où l'intégration est concernée, avec cinq onglets `Browser`, `React`, `Vue`, `Svelte`, `Angular`, le même nom de tab et le même `syncKey` lorsque les exemples représentent la même opération.
- Conserver une page d'accueil docs distincte de la landing, avec un frontmatter `template: splash` uniquement si nécessaire ; les pages de contenu utilisent le layout docs standard.
- Adapter le workflow GitHub Pages au nouvel output sans changer sa cible ni son runtime Node 24.

### Out

- Toute modification des packages `@gaitjs/core`, `@gaitjs/browser` ou des adapters.
- Toute modification du contrat JSON ou des métriques.
- Toute logique de matching, fingerprinting, sanction ou transport.

## 6. Risques et Impacts

- La migration Starlight change les chemins source et peut rendre les anciennes routes invalides. Les routes publiques `/gait/docs/<slug>/` doivent être conservées ou redirigées explicitement.
- Pagefind nécessite un build statique complet ; le workflow doit vérifier que l'index est bien généré et inclus dans `dist/`.
- Les imports MDX vers les composants Starlight doivent être testés par le build Astro, notamment avec les blocs TypeScript et les caractères JSX.
- La personnalisation CSS doit rester limitée aux tokens de marque et aux composants nécessaires afin de ne pas casser les styles Starlight.
- La landing et la documentation partagent le layout HTML et les assets globaux ; les overrides docs doivent être scoped aux classes Starlight ou à un layout docs dédié.
- Les snippets doivent rester synchronisés avec les API réellement exportées par les packages ; toute divergence est un bug documentaire.

## 7. Approche proposée

1. Installer et configurer `@astrojs/starlight` dans `site/astro.config.mjs`, en conservant `site`, `base`, l'intégration React de la landing et les alias workspace.
2. Déplacer le contenu documentaire vers `site/src/content/docs/` et supprimer l'ancien routing manuel `site/src/pages/docs/` après vérification des slugs.
3. Déclarer la sidebar avec des liens explicites et des groupes lisibles, plutôt qu'une navigation fabriquée dans un layout Astro custom.
4. Utiliser le header/sidebar/search/table-of-contents fournis par Starlight et ne personnaliser que le titre, le logo, les liens sociaux et les couleurs nécessaires. La sidebar suit les groupes `Démarrer`, `Utiliser Gait`, `Comprendre les métriques`, `Intégrations`, `Référence`, `Approfondir` et `Contribuer`.
5. Écrire les contenus en Markdown lorsque seuls texte, tableaux, code et callouts sont nécessaires ; utiliser `.mdx` pour les pages qui déclarent `Tabs`/`TabItem`.
6. Pour chaque scénario d'intégration multi-framework, rendre un bloc MDX de cette forme conceptuelle : `Tabs syncKey="framework"` contenant cinq `TabItem` dont le contenu est du code propre au framework. Aucun composant ne génère ou ne transforme le contenu dans le fichier.
7. Ajouter une validation de liens/routes et construire le site pour vérifier les pages, l'index Pagefind, les tabs et le préfixe GitHub Pages.

## 8. Alternatives considérées

- Layout Astro custom + recherche JavaScript : rejeté, car cela recrée manuellement les fonctions standard d'un site docs et augmente le risque de styles cassés.
- Docusaurus/Nextra : rejetés, car le site est déjà Astro et GitHub Pages ; Starlight fournit nativement le shell, la recherche Pagefind et les composants MDX adaptés.
- Composant tabs custom avec script client : rejeté, car Starlight fournit déjà `Tabs`/`TabItem`, y compris la synchronisation entre groupes.

## 9. Plan d'implémentation

1. Ajouter Starlight et sa configuration, sans toucher à la landing.
2. Créer la structure de contenu MDX et migrer le contenu existant.
3. Réécrire les pages framework avec des exemples `Tabs`/`TabItem` exacts et synchronisés.
4. Vérifier les liens, les slugs, les assets et le workflow de build Pages.
5. Supprimer l'ancien layout/docs routing et les styles spécifiques devenus inutiles.
6. Lancer la review architecture/docs/review et corriger les findings bloquants.

## 10. Plan de test

- `pnpm --dir site check`
- `pnpm --dir site build`
- vérifier la présence des pages docs attendues et des fichiers Pagefind dans `site/dist/`
- vérifier les routes `/gait/docs/`, `/gait/docs/quickstart/`, `/gait/docs/api/` et un slug de chaque framework
- vérifier que la landing `/gait/` reste générée et que son bundle de démo reste présent
- vérifier les imports MDX et le rendu des quatre `TabItem` par page concernée
- vérifier que les groupes avec `syncKey` portent les mêmes labels et ne contiennent pas de script local
- vérifier les liens internes et les liens GitHub avec une validation automatisée ou un script de build
- vérifier le build avec `base: '/gait'` et la publication GitHub Pages

## 11. Critères d'acceptation

- **AC-1** — La documentation est servie par Starlight et possède une sidebar gauche persistante avec les groupes `Démarrer`, `Utiliser Gait`, `Comprendre les métriques`, `Intégrations`, `Référence`, `Approfondir` et `Contribuer` visibles sur desktop.
- **AC-2** — Une recherche Pagefind est visible dans le header et fonctionne sur les pages générées après `pnpm --dir site build`.
- **AC-3** — Le contenu documentaire source se trouve sous `site/src/content/docs/` en Markdown/MDX ; aucun contenu de page n'est construit dans un composant JavaScript.
- **AC-4** — Les pages docs affichent une table des matières de page et une navigation mobile fournie par Starlight.
- **AC-5** — Les pages d'intégration utilisent `Tabs`/`TabItem` dans le MDX et proposent Browser/TypeScript, React, Vue, Svelte et Angular avec du code spécifique à chaque intégration.
- **AC-6** — Au moins un scénario multi-section utilise `syncKey` pour conserver le framework choisi entre groupes d'exemples liés ; le choix fonctionne au clavier et le code copié correspond à l'onglet actif.
- **AC-7** — Les snippets compilent conceptuellement avec les exports réels du repository et ne contiennent pas d'API inventée.
- **AC-8** — La landing existante reste fonctionnelle et visuellement hors périmètre de la migration docs.
- **AC-9** — `pnpm --dir site check`, `pnpm --dir site build` et la validation des routes passent sans erreur ; le build produit l'index Pagefind.
- **AC-10** — Aucun JavaScript custom n'est ajouté dans le contenu MDX pour implémenter les tabs ou la recherche.
- **AC-11** — À 375 px, 768 px et 1440 px, la sidebar/menu mobile, la recherche, le sommaire, les tableaux et les blocs de code restent utilisables sans débordement horizontal parasite.
- **AC-12** — La recherche est accessible par bouton et `Ctrl/Cmd + K`, supporte la navigation clavier, Échap et la restitution du focus.
