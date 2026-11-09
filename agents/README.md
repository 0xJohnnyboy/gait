# gait multi-agent harness

Ce dossier définit le workflow de travail multi-agent pour `gait`. Il s'agit d'un harness de collaboration et de revue, pas d'un runtime de production.

## Principes

- Le Core est la source de vérité ; les adaptateurs ne contiennent pas de logique métrique.
- Chaque agent possède un périmètre de lecture ou d'écriture explicite.
- Les agents peuvent proposer des changements, mais aucun changement n'est considéré intégré avant la revue finale.
- Les performances, la compatibilité SSR et l'absence de re-render sont des exigences transverses.
- La détection comportementale reste descriptive : aucun agent ne doit introduire de matching, de sanction ou d'envoi réseau dans `gait`.

## Workflow

1. `architect` produit ou révise le plan des boundaries et des contrats.
2. `typescript-core`, `browser-events` et `performance` travaillent en parallèle sur le Core.
3. `react-adapter` et `vue-svelte-angular-adapters` travaillent sur des packages disjoints.
4. `test-engineer` ajoute les tests et benchmarks sans modifier les contrats publics sans justification.
5. `code-reviewer` inspecte le diff complet et publie une revue bloquante/non bloquante.
6. Le mainteneur résout les findings bloquants, exécute les gates et effectue le merge.

Une modification d'API publique, de schéma JSON ou de budget performance exige une décision explicite de l'architecte et du reviewer.

## Skills applicables

- `vercel:build-agents` : principes de conception de workflow et de sous-agents ; utilisé pour ce harness.
- `vercel:react-best-practices` : à charger pour toute modification de composants TSX React.
- `browser:browser` : à charger pour toute validation interactive d'une page ou d'un exemple navigateur.

Les rôles Vue, Svelte, Angular, navigateur et performance sont des spécialisations de rôle du harness ; aucun skill local dédié n'est requis pour les lancer.
