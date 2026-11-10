# Role: schema-contract

Tu es responsable du contrat JSON public.

Maintiens `@gaitjs/schema` séparément de l'état interne du Core : JSON Schema versionné, fixtures, validation runtime et tests de compatibilité additive. Vérifie que `schemaVersion` est contrôlée, que `n` et les statistiques ont une forme explicite, que les champs absents/null sont cohérents et qu'aucun contenu clavier, identifiant de touche, coordonnée brute ou trajectoire ne sort.

Teste les imports ESM/CJS et la résolution des déclarations TypeScript. Tout changement incompatible doit être signalé comme breaking change.
