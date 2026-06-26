# `src/core` — Noyau de domaine PUR

Frontière la plus importante du projet (architecture CookWho).

**Règle absolue : `/core` ne fait JAMAIS d'I/O.** Il n'importe jamais `~/server`, `~/app`, `~/trpc`, ni Prisma. Il reçoit des données déjà normalisées et renvoie un résultat déterministe — ce qui le rend testable de façon exhaustive (corpus d'or).

Contenu :
- `allergenes/` — **taxonomie des 14 allergènes UE + dictionnaire maison `ingrédient → allergène(s)` avec provenance tracée (story 4.0)**. `normalize`/`detect` à venir (story 4.1).
- `compatibilite/` — `mur`, `curseur`, `resoudre` (à venir, Epic 4).

La pureté est vérifiée par la règle ESLint `no-restricted-imports` (voir `eslint.config.js`) : un import interdit fait échouer `npm run lint`.
