---
baseline_commit: 280a2b1371edee19111c37249b9f25771a589bd6
---

# Story 4.5 : Dégradation élégante (curseur)

Status: review

## Story

As an organisateur,
I want quand même des propositions quand aucun plat ne plaît à tous,
so that je ne suis pas bloqué par les seuls goûts. (FR10)

## Acceptance Criteria

1. **Given** des recettes filtrées par le mur, **When** au moins `min` (3) d'entre elles ont une **pénalité de curseur nulle** (elles plaisent à tout le groupe), **Then** `resoudre` renvoie ce **succès plein** avec `mode: "TOUS_CONTENTS"` (3-10 recettes à pénalité 0).
2. **Given** qu'**aucun** lot de `min` recettes n'a une pénalité nulle (tout plat froisse au moins un goût) **mais** que ≥ `min` recettes passent le mur, **When** `resoudre` s'exécute, **Then** il renvoie un **succès dégradé** `mode: "DEGRADATION"` : **au moins 3** recettes, celles **froissant le moins** (pénalité croissante).
3. **Given** une recette proposée (plein **ou** dégradé), **When** elle est renvoyée, **Then** elle signale ses **ingrédients gênants** (`ingredientsGenants: string[]` = les aliments non-aimés du groupe présents dans la recette) — vide si aucun.
4. **Given** la sécurité, **When** une recette est proposée **en dégradation**, **Then** elle **ne franchit JAMAIS le mur** (allergie/régime) — l'invariant testé couvre les deux modes.
5. **Given** moins de `min` recettes passant le **mur**, **When** `resoudre` s'exécute, **Then** il renvoie toujours `{ ok: false, raison: "PAS_ASSEZ", compatibles }` (la dégradation ne contourne pas le mur ; l'échec explicatif détaillé = story 4.6).
6. **Given** la compatibilité, **When** je change `resoudre`, **Then** la génération serveur (4.4b) et ses tests **continuent de fonctionner** (changement **additif** : `mode` sur le succès, `ingredientsGenants` sur la recette) ; le Result remonte tel quel jusqu'au router.
7. **Given** la pureté `/core` + CI, **When** je lance `npm run test`, `lint`, `typecheck`, `SKIP_ENV_VALIDATION=1 build`, **Then** tout reste vert ; le mode dégradé et l'invariant de sécurité sont testés.

## Tasks / Subtasks

- [x] **Tâche 1 — `genants` (ingrédients gênants)** (AC: 3)
  - [x] Dans `src/core/compatibilite/curseur.ts`, ajouter `genants(ingredients: string[], nonAimes: NonAime[]): string[]` → la liste des `valeur` des non-aimés **présents** dans la recette (match par ligne, même mécanique que `curseur`, via `contientTokens`). Déterministe, dédupliqué, ordre stable.

- [x] **Tâche 2 — `resoudre` : distinguer TOUS_CONTENTS vs DEGRADATION** (AC: 1, 2, 4, 5)
  - [x] Étendre les types (`src/core/compatibilite/resoudre.ts`) :
    - `RecetteRetenue` : ajouter `ingredientsGenants: string[]`.
    - Variante succès : `{ ok: true; mode: "TOUS_CONTENTS" | "DEGRADATION"; recettes: RecetteRetenue[] }`.
  - [x] Logique (après filtre mur + tri pénalité croissante) :
    1. `zeroPenalite` = compatibles à `penalite === 0`.
    2. Si `zeroPenalite.length >= min` → `{ ok: true, mode: "TOUS_CONTENTS", recettes: zeroPenalite.slice(0, max) }`.
    3. Sinon si `compatibles.length >= min` → `{ ok: true, mode: "DEGRADATION", recettes: compatibles.slice(0, max) }` (les moins pénalisées).
    4. Sinon → `{ ok: false, raison: "PAS_ASSEZ", compatibles: compatibles.length }`.
  - [x] Peupler `ingredientsGenants` (via `genants`) sur **chaque** `RecetteRetenue` (plein ou dégradé).
  - [x] **Le filtre mur reste AVANT toute chose** : la dégradation ne touche qu'au curseur, jamais à la sécurité.

- [x] **Tâche 3 — Exports** (AC: 6)
  - [x] Exporter `genants` depuis `src/core/compatibilite/index.ts` + `src/core/index.ts` (à côté de `curseur`).

- [x] **Tâche 4 — Tests (dont invariant en dégradation)** (AC: 1, 2, 3, 4, 5, 7)
  - [x] `curseur.test.ts` : `genants` → liste des non-aimés présents (multi-mots, « ail » ≠ « volaille », dédup).
  - [x] `resoudre.test.ts` :
    - ≥3 recettes pénalité 0 → `mode: "TOUS_CONTENTS"`.
    - aucune pénalité 0 mais ≥3 passent le mur → `mode: "DEGRADATION"`, ≥3 recettes, triées par pénalité ; `ingredientsGenants` non vide sur les froissées.
    - < 3 passent le mur → `PAS_ASSEZ` (inchangé).
    - **INVARIANT** : en mode DEGRADATION, **aucune** recette retenue ne franchit le mur (property-test).
  - [x] Vérifier que `generation.test.ts` / `organisateur.test.ts` **restent verts** (changement additif).

- [x] **Tâche 5 — Validations** (AC: 7)
  - [x] `npm run test`, `lint`, `typecheck`, `SKIP_ENV_VALIDATION=1 build` → tout vert.

## Dev Notes

### ⚠️ Pièges critiques (lire avant de coder)

1. **La dégradation ne touche QUE le curseur (goûts), jamais le mur (sécurité).** L'ordre dans `resoudre` reste : **filtre mur → tri curseur → sélection**. La dégradation se déclenche seulement quand il y a < `min` recettes à pénalité 0 ; elle propose les moins pénalisées **parmi celles qui passent déjà le mur**. AC4/AC5 : aucune recette dégradée ne franchit le mur ; < 3 passant le mur reste `PAS_ASSEZ`.

2. **Changement ADDITIF — ne pas casser 4.4b.** Ajouter `mode` au succès et `ingredientsGenants` à `RecetteRetenue`. `genererPourRepas` (4.4b) renvoie `resoudre(...)` tel quel → le `mode`/`ingredientsGenants` remontent automatiquement jusqu'au router (aucune modif serveur). Vérifier que `generation.test.ts` et `organisateur.test.ts` passent sans changement (ils lisent `res.recettes`, additif OK).

3. **« TOUS_CONTENTS » = pénalité 0, pas « ≥3 compatibles ».** Aujourd'hui `resoudre` renvoie `{ ok: true }` dès ≥3 compatibles (mur) triées. 4.5 **scinde** : succès plein = ≥3 à pénalité **nulle** (compatibles avec tout le groupe, FR9) ; sinon dégradation. Bien re-tester les cas existants (recettes sans non-aimés → pénalité 0 → TOUS_CONTENTS).

4. **`ingredientsGenants` ≠ pénalité.** La pénalité est un score ; `ingredientsGenants` est la **liste lisible** des aliments non-aimés présents (pour l'UI « ingrédients gênants signalés », Epic 5). Le signalement de **qui** est gêné (quel participant) est une finesse d'Epic 5 ; ici on liste les valeurs d'ingrédients.

5. **Déterminisme.** `genants` dédupliqué + ordre stable (ordre des `nonAimes` ou tri). Tri des compatibles déjà stable (pénalité puis `ref`). `slice` déterministe.

6. **Périmètre = curseur/dégradation uniquement.** Pas d'échec explicatif (4.6), pas de génération forcée (4.7), pas d'UI (Epic 5). `resoudre` reste pur `/core`.

### État réel du projet (vérifié — acquis 4.4a/4.4b + revue)

- **`resoudre`** (`src/core/compatibilite/resoudre.ts`) : filtre `mur` → tri `curseur` (pénalité croissante, tie-break `ref`) → `{ ok: true; recettes }` (3-10) | `{ ok: false; raison: "PAS_ASSEZ"; compatibles }`. `RecetteRetenue` porte déjà `ref, titre, ingredients, incertain, raisonsIncertitude, penalite` (le champ `ingredients` a été ajouté à la revue 4.4b).
- **`curseur`** (`curseur.ts`) : `curseur(ingredients, nonAimes) → pénalité` (poids `SEUIL_TOLERANCE_MAX(4) - seuil`, match par ligne via `contientTokens`). `SEUIL_TOLERANCE_MAX = 4` (corrigé en revue). **Réutiliser le même match** pour `genants`.
- **`/core/texte`** : `tokeniser`, `contientTokens` (matcher partagé).
- **4.4b** : `genererPourRepas` renvoie `resoudre(...)` ; la procédure tRPC le renvoie tel quel. **Aucune modif serveur attendue** (additif).
- **Invariant de sécurité** : déjà testé en 4.4a (`resoudre.test.ts`) ; étendre au mode DEGRADATION.
- Règle ESLint `/core`. Vitest, fonctions pures.

### Périmètre — hors de cette story

- **Échec explicatif** (mur impossible → nommer la contrainte bloquante) → **story 4.6** (raffine `PAS_ASSEZ`).
- **Génération forcée** (réponses partielles, non-couverts) → **story 4.7**.
- **Affichage** des recettes, du mode dégradé et des ingrédients gênants → **Epic 5** (4.5 fournit la donnée).
- **Régimes alimentaires** → story **4.3b**.

### Décisions tranchées

- **TOUS_CONTENTS** = ≥ `min` recettes à pénalité **0** ; **DEGRADATION** = sinon (≥ `min` passent le mur). `PAS_ASSEZ` = < `min` passent le **mur**.
- **Changement additif** (`mode`, `ingredientsGenants`) ; zéro modif serveur.
- **`ingredientsGenants`** = liste des valeurs de non-aimés présents (le « qui » → Epic 5).

### Testing standards

- **Vitest**, environnement par défaut, fonctions pures.
- **Invariant de sécurité en dégradation** (AC4) : aucune recette retenue (mode DEGRADATION) ne franchit le mur (property-test).
- Couvrir TOUS_CONTENTS / DEGRADATION / PAS_ASSEZ ; `genants` (présence/dédup/tokens) ; non-régression `generation`/`organisateur`.

### Definition of Done manuelle (utilisateur, hors agent)

1. `npm run test` vert (modes + invariant + non-régression serveur).
2. Sabotage de contrôle : forcer une recette dégradée à violer le mur → invariant rouge, puis annuler.
3. `npm run lint` vert (frontière `/core`).

### Project Structure Notes

- **Modifiés** : `src/core/compatibilite/curseur.ts` (+ `genants`), `resoudre.ts` (`mode`, `ingredientsGenants`), `index.ts` + `src/core/index.ts` (export `genants`) ; tests `curseur.test.ts`, `resoudre.test.ts`.
- **Inchangés** (vérifier verts) : `src/server/generation.ts` / `generation.test.ts`, `organisateur.ts` / `organisateur.test.ts`.
- **Aucune** migration, **aucune** dépendance, **aucun** I/O.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 4.5] (≥3 recettes froissant le moins, ingrédients gênants signalés, mur jamais franchi)
- [Source: _bmad-output/planning-artifacts/architecture.md#Domain Core] (`resoudre → Result` : 3-10, dégradation, échec explicatif ; property-tests d'invariant)
- [Source: _bmad-output/planning-artifacts/ux-designs/.../EXPERIENCE.md#State Patterns] (dégradation : ≥3, ingrédients gênants signalés, le mur reste garanti)
- [Source: _bmad-output/implementation-artifacts/4-4a-curseur-resoudre.md] (`resoudre`, `curseur`, `RecetteRetenue`, `ResultatResolution`, invariant)
- [Source: _bmad-output/implementation-artifacts/4-4b-generation-serveur.md] (`genererPourRepas` renvoie le Result tel quel)

## Dev Agent Record

### Agent Model Used

claude-opus-4-8 (bmad-dev-story)

### Debug Log References

- Suite complète : **223/223** ✅ (216 → 223, +7 : `genants` ×4, modes `resoudre` ×2, invariant dégradation ×1). `lint` ✅, `typecheck` ✅, `SKIP_ENV_VALIDATION=1 build` ✅.
- **Changement strictement additif validé** : `generation.test.ts` et `organisateur.test.ts` passent **sans aucune modification** (le `mode`/`ingredientsGenants` remontent automatiquement via `genererPourRepas`).
- Tests `/core` purs, déterministes (aucun I/O).

### Completion Notes List

- ✅ **`genants(ingredients, nonAimes)`** (`curseur.ts`) : liste des aliments non-aimés **présents** (mêmes tokens que `curseur`, match par ligne), dédupliquée par valeur, ordre stable. Déterministe.
- ✅ **`resoudre` scinde le succès** : `mode: "TOUS_CONTENTS"` si ≥ `min` recettes à pénalité 0 (plaisent à tout le groupe, FR9) ; sinon `mode: "DEGRADATION"` (les moins pénalisées, FR10). `PAS_ASSEZ` réservé à < `min` recettes passant le **mur**.
- ✅ **`RecetteRetenue.ingredientsGenants`** peuplé sur chaque recette (plein ou dégradé) → la donnée « ingrédients gênants signalés » est prête pour l'UI (Epic 5).
- ✅ **Sécurité préservée** : ordre inchangé `filtre mur → tri curseur → sélection`. La dégradation ne touche **que** les goûts. Invariant property-testé **en mode DEGRADATION** (AC4) : aucune recette retenue ne franchit le mur.
- ✅ **Additif, zéro modif serveur** : le Result enrichi remonte tel quel jusqu'au router (4.4b).
- **Hors périmètre** : échec explicatif (4.6), génération forcée (4.7), affichage (Epic 5), régimes alimentaires (4.3b).
- **DoD utilisateur** : `npm run test` vert ; sabotage de contrôle (forcer une recette dégradée à violer le mur → invariant rouge, puis annuler) ; `npm run lint` vert.

### File List

- `src/core/compatibilite/curseur.ts` (MODIFIÉ — `genants`) + `curseur.test.ts` (tests)
- `src/core/compatibilite/resoudre.ts` (MODIFIÉ — `mode`, `ingredientsGenants`) + `resoudre.test.ts` (tests)
- `src/core/compatibilite/index.ts` + `src/core/index.ts` (MODIFIÉS — exports `genants`, `ModeResolution`)

### Change Log

- 2026-06-28 : Story 4.5 implémentée — dégradation élégante. `genants` (ingrédients gênants présents) + `resoudre` distingue `TOUS_CONTENTS` (≥3 à pénalité 0) de `DEGRADATION` (les moins pénalisées, ingrédients gênants signalés) ; `PAS_ASSEZ` réservé au manque côté mur. Changement additif (zéro modif serveur), invariant de sécurité étendu au mode dégradé. 223/223, lint/typecheck/build verts. Statut → review. **L'organisateur n'est plus bloqué par les seuls goûts (FR10).**
