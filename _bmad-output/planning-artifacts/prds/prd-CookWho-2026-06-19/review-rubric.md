# PRD Quality Review — CookWho

## Verdict global

PRD solide et cohérent pour son enjeu (projet passion, chaîne-amont vers UX/archi/stories). La thèse — traiter le repas comme un problème de groupe, sécurité d'abord (mur) puis plaisir (curseur) — est claire et irrigue toutes les sections. Les principaux risques ne sont pas dans la qualité du document mais dans des questions ouvertes réelles (légal, RGPD) correctement signalées comme à résoudre avant tout usage public. Quelques bornes de performance restent qualitatives.

## Decision-readiness — strong
Décisions posées comme telles (mur infranchissable, échec explicatif, génération forcée, human-in-the-loop). Trade-offs nommés avec ce qui est cédé (FR-12 : couverture partielle assumée ; §10 : vélocité MVP vs risque légal). Les 6 questions ouvertes sont réellement ouvertes, pas rhétoriques. `[NOTE FOR PM]` placés à de vraies tensions (modulaire, légal, source incomplète).

## Substance over theater — strong
Pas de persona theater : 2 UJ seulement, chacun pilote des FR (UJ-2 → FR-5/6/7/8 ; UJ-1 → FR-1/2/3/4/9). Vision spécifique à CookWho, non interchangeable. NFR avec seuils produit (<2 min, zéro faux négatif), pas du boilerplate.

## Strategic coherence — strong
Thèse explicite et priorisation qui en découle (sécurité = pilier, F3/F4 portent le cœur). SM-2 (zéro faux négatif) valide directement la thèse sécurité ; contre-métriques C1/C2 présentes et chargées de sens.

## Done-ness clarity — adequate
Chaque FR porte ≥1 conséquence testable. Deux zones molles :
- §11 « génération en quelques secondes » — adjectif, pas de borne chiffrée.
- FR-9 « respectent au mieux les curseurs » — « au mieux » non mesurable en soi (borné en pratique par FR-10, mais flou).

### Findings
- **medium** Borne perf vague (§11) — « quelques secondes » non chiffré. *Fix :* fixer une cible (ex. < 5 s) ou la marquer explicitement comme question ouverte.
- **low** Formulation « au mieux » (FR-9) — *Fix :* renvoyer explicitement à la logique de FR-10 pour lever l'ambiguïté.

## Scope honesty — strong
Non-objectifs + §6.2 explicites, hypothèses taguées et indexées (§13), NOTE FOR PM aux décisions différées. Densité d'items ouverts raisonnable pour un PRD pré-build de ce niveau ; les blockers réels (légal, RGPD) sont étiquetés « avant usage public », pas « avant MVP entre testeurs » — cohérent avec l'enjeu.

## Downstream usability — strong
Glossaire présent ; noms de domaine homogènes (participant, repas, mur, curseur). IDs contigus et uniques (FR-1→16, UJ-1/2, SM-1→4 + C1/C2). Renvois croisés résolus. Chaque section tient seule.

## Shape fit — strong
Produit grand public multi-parties prenantes → UJ avec protagonistes nommés (Sami, Léa), porteurs. Rigueur allégée cohérente avec un projet passion ; barre de substance tenue.

## Mechanical notes
- Glossaire : pas de dérive notable. « Repas » bien employé (vs « groupe » du brainstorm).
- Assumptions : les 2 tags inline (FR-16, §9) sont tous deux indexés au §13 — roundtrip OK.
- IDs : aucun trou ni doublon détecté.
- Bornes molles : voir Done-ness (§11, FR-9).
