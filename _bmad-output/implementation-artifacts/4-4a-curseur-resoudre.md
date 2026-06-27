---
baseline_commit: b171529
---

# Story 4.4a : Curseur & résolution (/core — chemin nominal)

Status: review

## Story

As a moteur,
I want classer les recettes compatibles selon les goûts du groupe et en retenir 3 à 10,
so that l'organisateur reçoit une sélection sûre et optimisée. (FR9, base de FR10/FR11)

## Acceptance Criteria

1. **Given** une recette (ingrédients normalisables) et les **aliments non-aimés** du groupe (`{ valeur, seuilTolerance }[]`), **When** `curseur(ingredients, nonAimes)` s'exécute, **Then** il renvoie une **pénalité** (nombre, **plus bas = mieux**) : chaque non-aimé **présent** dans la recette ajoute un poids **décroissant avec le seuil de tolérance** (strict → forte pénalité ; souple → ~0). Un non-aimé **absent** n'ajoute rien.
2. **Given** le match d'un non-aimé, **When** on teste sa présence, **Then** c'est sur **tokens délimités** (jamais sous-chaîne ; « ail » ≠ « volaille »), avec la même mécanique que `detect` — via un **matcher partagé** (`/core/texte`).
3. **Given** un ensemble de recettes + les contraintes du mur + les non-aimés, **When** `resoudre(recettes, contraintes, nonAimes, options?)` s'exécute, **Then** il **filtre par le mur** (4.3), **classe** les compatibles par pénalité croissante, et renvoie un **Result discriminé** : `{ ok: true, recettes }` avec **3 à 10** recettes si ≥ 3 compatibles ; sinon `{ ok: false, raison: "PAS_ASSEZ", compatibles }` (la **dégradation 4.5** et l'**échec 4.6** raffineront ce cas).
4. **Given** chaque recette retenue, **When** elle est renvoyée, **Then** elle porte son **drapeau d'incertitude** (issu du verdict du mur : `incertain`, `raisonsIncertitude`) — pour l'avertissement humain (FR16, Epic 5) — et sa **pénalité** (pour debug/tri).
5. **Given** « régénérer », **When** `resoudre(..., { exclure: refsDejaVues })` est rappelé, **Then** il renvoie une **autre sélection** (recettes non encore vues), **disjointe** de la précédente, tant que d'autres compatibles existent.
6. **Given** l'invariant de sécurité, **When** je lance les tests, **Then** **aucune recette retenue ne franchit le mur** (property-test : toute recette de `ok.recettes` a un verdict mur `exclu: false`) — faux négatif = build rouge.
7. **Given** la pureté `/core`, **When** ça s'exécute, **Then** tout est **pur, déterministe, sans I/O** ; le **refactor d'extraction du matcher** ne change PAS le comportement de `detect` (corpus d'or **reste vert**). `npm run test`/`lint`/`typecheck`/`build` verts.

## Tasks / Subtasks

- [x] **Tâche 1 — Extraire un matcher de tokens partagé** (AC: 2, 7)
  - [x] Créer `src/core/texte.ts` : `tokeniser(texte: string): string[]` (= `normalize(texte).split(" ").filter(Boolean)`) et `contientTokens(tokensSource: string[], cibleTokens: string[]): boolean` (sous-séquence contiguë + tolérance pluriel bidirectionnelle — **déplacé depuis `detect.ts`**).
  - [x] **Refactorer `detect.ts`** pour utiliser `contientTokens`/`tokeniser` (comportement **identique** : `detect.test.ts` et `corpus.test.ts` doivent rester verts **sans modification**).
  - [x] Test `texte.test.ts` minimal (tokens délimités, multi-mots, pluriel).

- [x] **Tâche 2 — `curseur`** (AC: 1, 2)
  - [x] Créer `src/core/compatibilite/curseur.ts` : `curseur(ingredients: string[], nonAimes: { valeur: string; seuilTolerance: number }[]): number`.
  - [x] Pour chaque non-aimé : `contientTokens(ingredients tokenisés, tokeniser(valeur))` ? Si présent → ajouter `poids(seuilTolerance)`. `poids(s) = SEUIL_TOLERANCE_MAX - s` (strict 0 → fort ; souple max → 0), borné ≥ 0. `SEUIL_TOLERANCE_MAX = 5` (borne serveur Zod, story 4.1b review).
  - [x] Pénalité totale = somme. Déterministe.

- [x] **Tâche 3 — `resoudre` (chemin nominal)** (AC: 3, 4, 5, 6)
  - [x] Créer `src/core/compatibilite/resoudre.ts`. Types :
    ```ts
    export type RecetteEntree = {
      ref: string;
      titre: string;
      ingredients: string[];        // lignes d'ingrédients (texte libre ou normalisé)
      detection: ResultatDetection; // pré-calculée par l'appelant (4.4b)
    };
    export type RecetteRetenue = {
      ref: string; titre: string;
      incertain: boolean; raisonsIncertitude: string[];
      penalite: number;
    };
    export type ResultatResolution =
      | { ok: true; recettes: RecetteRetenue[] }
      | { ok: false; raison: "PAS_ASSEZ"; compatibles: number };
    ```
  - [x] `resoudre(recettes, contraintes, nonAimes, { exclure = [], min = 3, max = 10 } = {})` :
    1. Écarter les `recettes` dont `ref ∈ exclure`.
    2. Pour chacune : `mur(contraintes, detection)`. Garder celles `exclu: false` (porter `incertain`/`raisonsIncertitude`).
    3. Calculer `penalite = curseur(ingredients, nonAimes)`.
    4. Trier par `penalite` croissante (tie-break stable : `ref` pour le déterminisme).
    5. Si `compatibles.length >= min` → `{ ok: true, recettes: compatibles.slice(0, max) }` ; sinon `{ ok: false, raison: "PAS_ASSEZ", compatibles: compatibles.length }`.
  - [x] Pas d'exception ; Result discriminé.

- [x] **Tâche 4 — Exports `/core`** (AC: 7)
  - [x] Exporter `curseur`, `resoudre` + types depuis `src/core/compatibilite/index.ts` et `src/core/index.ts`. Exporter `tokeniser`/`contientTokens` depuis `src/core/index.ts` (utile à 4.4b/tests).

- [x] **Tâche 5 — Tests (dont invariants)** (AC: 1, 3, 5, 6, 7)
  - [x] `curseur.test.ts` : non-aimé absent → 0 ; non-aimé strict présent > non-aimé souple présent ; multi-mots ; « ail » ≠ « volaille ».
  - [x] `resoudre.test.ts` :
    - ≥ 3 compatibles → `ok: true`, **3 ≤ n ≤ 10**, triées par pénalité croissante.
    - < 3 compatibles → `{ ok: false, raison: "PAS_ASSEZ", compatibles }`.
    - recette violant le mur → **jamais** dans `ok.recettes`.
    - `exclure` (régénérer) → sélection **disjointe**.
    - `incertain` propagé depuis le mur.
    - **INVARIANT (AC6)** : sur un échantillon, toute recette retenue a `mur(...).exclu === false`.

- [x] **Tâche 6 — Validations** (AC: 7)
  - [x] `npm run test` (dont `detect`/`corpus` **inchangés et verts**), `lint`, `typecheck`, `SKIP_ENV_VALIDATION=1 build` → tout vert.

## Dev Notes

### ⚠️ Pièges critiques (lire avant de coder)

1. **`/core` PUR — `resoudre` ne fait pas d'I/O.** Il reçoit des recettes **avec leur `detection` déjà calculée** (par 4.4b qui orchestre source→normalize→detect). La composition réseau/DB/cache est **4.4b**. Ici : algorithme pur.

2. **Refactor de `detect` à comportement IDENTIQUE.** L'extraction de `contientTokens`/`tokeniser` vers `/core/texte.ts` doit laisser `detect.test.ts` **et** `corpus.test.ts` **verts sans les modifier**. C'est la preuve que le moteur de sécurité n'a pas régressé. Déplacer la logique telle quelle (sous-séquence contiguë + `racine()` pluriel bidirectionnel).

3. **Curseur = goûts (négociable), PAS sécurité.** Le curseur ne franchit jamais le mur : `resoudre` filtre d'ABORD par `mur`, PUIS classe par curseur. Un non-aimé n'exclut jamais — il pénalise le classement. L'invariant (AC6) garantit qu'aucune recette retenue ne viole le mur, quelle que soit la pénalité.

4. **3–10, sinon « PAS_ASSEZ ».** Le chemin nominal renvoie 3 à 10 recettes. Le cas `< 3` est renvoyé tel quel (`PAS_ASSEZ`) ; **ne pas** implémenter ici la dégradation (proposer quand même ≥3 en froissant le moins — **4.5**) ni l'échec explicatif (**4.6**). Garder le Result extensible.

5. **Déterminisme.** Tri stable (tie-break par `ref`), pénalité déterministe, `exclure` déterministe. Indispensable pour des tests stables et un « régénérer » reproductible.

6. **Poids du seuil.** `poids(seuil) = SEUIL_TOLERANCE_MAX - seuil` (strict → fort, souple → 0). Les tests asservissent l'**ordre** (strict pénalise plus que souple), pas la valeur exacte. `SEUIL_TOLERANCE_MAX = 5` (borne Zod serveur, cohérente 4.1b).

7. **`incertain` vient du mur, pas du curseur.** Chaque recette retenue porte le `incertain`/`raisonsIncertitude` du **verdict du mur** (ingrédient inconnu, régime non évalué…). Le curseur n'y touche pas. Ces infos servent l'avertissement humain (Epic 5).

### État réel du projet (vérifié — acquis 4.0 → 4.3)

- **`/core/allergenes`** : `normalize`, `detect → ResultatDetection`, taxonomie. `detect.ts` contient **actuellement** `tokenCorrespond`/`racine`/`contientSequence` (privés) → **à extraire** vers `/core/texte.ts`.
- **`/core/compatibilite`** : `mur(contraintes, detection) → VerdictMur` + `construireContraintes` (story 4.3). **Réutiliser** `mur` dans `resoudre`.
- **Échelle de seuil** : `seuilTolerance` ∈ [0, 5] (Zod, 4.1b) ; libellés 0-4 (`TOLERANCE_LABELS`, `~/lib/restrictions`). Le `/core` reste indépendant de `~/lib` : définir `SEUIL_TOLERANCE_MAX` localement.
- **`RecetteBrute`** (4.2) : `{ source, sourceRef, titre, ingredientsTexte }`. 4.4b mappera `ingredientsTexte`→`detection` (normalize+detect) et appellera `resoudre`. Ici, `RecetteEntree` reçoit `ingredients` + `detection`.
- **Règle ESLint boundaries** `/core`. Vitest, tests co-localisés, fonctions pures.

### Périmètre — hors de cette story

- **Orchestration serveur** (procédure tRPC `genererRecettes`, composition source/cache → normalize+detect → resoudre, régénérer côté serveur, cible < 5 s) → **story 4.4b**.
- **Dégradation élégante** (≥3 en froissant le moins, ingrédients gênants signalés) → **story 4.5** (raffine le cas `PAS_ASSEZ`).
- **Échec explicatif** (mur impossible, nommer la contrainte bloquante) → **story 4.6**.
- **Génération forcée** (réponses partielles) → **story 4.7** (côté contraintes/serveur).
- **Régimes alimentaires** (végétarien/vegan…) → story **4.3b**.
- **Affichage des recettes** (vue organisateur) → **Epic 5**.

### Décisions tranchées

- **Découpage 4.4a (core) / 4.4b (serveur)** (2026-06-27).
- **Curseur = pénalité décroissante avec le seuil** ; `resoudre` filtre mur d'abord, classe ensuite.
- **`PAS_ASSEZ` renvoyé tel quel** (dégradation/échec = 4.5/4.6).
- **Matcher de tokens partagé** (`/core/texte`) extrait de `detect` (comportement préservé).

### Testing standards

- **Vitest**, environnement par défaut ; fonctions pures, aucun mock.
- **Invariant de sécurité** (AC6) : aucune recette retenue ne viole le mur (property-test).
- **Non-régression `detect`** : `detect.test.ts` + `corpus.test.ts` **inchangés et verts** après le refactor.
- Co-localiser dans `src/core/` (texte) et `src/core/compatibilite/`.

### Definition of Done manuelle (utilisateur, hors agent)

1. `npm run test` vert, dont l'invariant `resoudre` et le **corpus d'or inchangé**.
2. Sabotage de contrôle : forcer `resoudre` à retenir une recette violant le mur → invariant rouge, puis annuler.
3. `npm run lint` vert (frontière `/core`).

### Project Structure Notes

- **Nouveaux** : `src/core/texte.ts` (+ test), `src/core/compatibilite/curseur.ts` (+ test), `src/core/compatibilite/resoudre.ts` (+ test).
- **Modifiés** : `src/core/allergenes/detect.ts` (utilise `/core/texte`), `src/core/compatibilite/index.ts` + `src/core/index.ts` (exports).
- **Aucune** migration, **aucune** dépendance, **aucun** I/O.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 4.4] (resoudre 3-10, curseur, régénérer, < 5 s ; 4.5/4.6/4.7 = stories distinctes)
- [Source: _bmad-output/planning-artifacts/architecture.md#Domain Core] (`curseur`, `resoudre → Result` ; pur ; property-tests d'invariant « aucun plat retenu ne franchit le mur »)
- [Source: _bmad-output/implementation-artifacts/4-3-filtre-du-mur.md] (`mur`, `construireContraintes`, `VerdictMur`, modèle 3 états)
- [Source: _bmad-output/implementation-artifacts/4-1b-detection-allergenes-corpus.md] (matcher tokens/pluriel à extraire ; `detect`/corpus à préserver)
- [Source: _bmad-output/implementation-artifacts/3-2b-assistant-restrictions-contenu.md] (`NON_AIME` + `seuilTolerance`, échelle de tolérance)

## Dev Agent Record

### Agent Model Used

claude-opus-4-8 (bmad-dev-story)

### Debug Log References

- Suite complète : **205/205** ✅ (190 → 205, +15 : texte ×4, curseur ×4, resoudre ×7). `lint` ✅ (frontière `/core` verte), `typecheck` ✅, `SKIP_ENV_VALIDATION=1 build` ✅.
- **Non-régression `detect`** : après extraction du matcher vers `/core/texte`, `detect.test.ts` (11) + `corpus.test.ts` (25) **inchangés et verts**.

### Completion Notes List

- ✅ **Matcher partagé** (`src/core/texte.ts`) : `tokeniser` + `contientTokens` (sous-séquence contiguë + tolérance pluriel bidirectionnelle), extrait de `detect.ts` → `detect` refactoré pour l'utiliser, **comportement identique** (corpus d'or préservé).
- ✅ **`curseur(ingredients, nonAimes) → pénalité`** : match par ligne (comme detect), poids `SEUIL_TOLERANCE_MAX - seuil` (strict→fort, souple→0), somme déterministe. Un non-aimé absent n'ajoute rien.
- ✅ **`resoudre(recettes, contraintes, nonAimes, options?)`** : filtre **mur** (sécurité) → classe par **curseur** (pénalité croissante, tie-break `ref`) → Result discriminé `{ ok:true, recettes }` (3-10) ou `{ ok:false, raison:"PAS_ASSEZ", compatibles }`. `exclure` = régénérer (sélection disjointe). Chaque recette retenue porte `incertain`/`raisonsIncertitude` (du mur) + `penalite`.
- ✅ **Invariant de sécurité** (property-test) : aucune recette retenue ne franchit le mur.
- ✅ Exports `/core` : `curseur`, `resoudre`, `tokeniser`, `contientTokens`, types.
- **Hors périmètre** : orchestration serveur tRPC + <5s → **4.4b** ; dégradation (raffine PAS_ASSEZ) → **4.5** ; échec explicatif → **4.6** ; régimes alimentaires → **4.3b**.
- **DoD utilisateur** : `npm run test` (invariant + corpus inchangé) ; sabotage possible (retenir une recette violant le mur → invariant rouge).

### File List

- `src/core/texte.ts` + `texte.test.ts` (NOUVEAUX — matcher partagé)
- `src/core/allergenes/detect.ts` (MODIFIÉ — utilise `/core/texte`, comportement inchangé)
- `src/core/compatibilite/curseur.ts` + `curseur.test.ts` (NOUVEAUX)
- `src/core/compatibilite/resoudre.ts` + `resoudre.test.ts` (NOUVEAUX)
- `src/core/compatibilite/index.ts` + `src/core/index.ts` (MODIFIÉS — exports)

### Change Log

- 2026-06-27 : Story 4.4a implémentée — matcher de tokens partagé (`/core/texte`, extrait de `detect` sans régression), `curseur` (scoring des goûts non-aimés/seuils), `resoudre` (mur→curseur→3-10, régénérer via `exclure`, Result discriminé, `PAS_ASSEZ` laissé à 4.5/4.6). Invariant de sécurité testé. 205/205, lint (boundaries)/typecheck/build verts. Statut → review.
