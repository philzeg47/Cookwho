---
baseline_commit: e23e29a
---

# Story 4.1a : Normalisation des ingrédients (`normalize`)

Status: review

## Story

As a moteur de sécurité,
I want normaliser une chaîne d'ingrédient en texte libre vers une forme canonique,
so that la détection (4.1b) compare des tokens propres et déterministes au dictionnaire. (FR13, NFR3 — préalable à `detect()`)

## Acceptance Criteria

1. **Given** une chaîne d'ingrédient en texte libre (ex. « Farine de Blé T55 », « Crème fraîche épaisse »), **When** `normalize(brut)` s'exécute, **Then** elle renvoie une chaîne **minuscule, sans accents/diacritiques**, où **toute ponctuation et tout séparateur** (espaces multiples, virgules, apostrophes, tirets, parenthèses, `&`, chiffres collés à de la ponctuation) deviennent des **espaces simples**, sans espace en début/fin.
2. **Given** des **ligatures** françaises, **When** je normalise « Œufs » / « Cœur de bœuf », **Then** `œ`→`oe` et `æ`→`ae` (« oeufs », « coeur de boeuf ») — car NFD ne décompose pas ces ligatures.
3. **Given** la cohérence avec le dictionnaire (4.0), **When** je normalise n'importe quelle **clé** du `DICTIONNAIRE_ALLERGENES`, **Then** `normalize(cle)` est **idempotente et “matchable”** : le résultat ne contient que `[a-z0-9 ]`, et appliquer `normalize` deux fois donne le même résultat (`normalize(normalize(x)) === normalize(x)`).
4. **Given** la fonction est **pure** (`/core`, zéro I/O), **When** je l'appelle, **Then** elle est déterministe, sans état, sans effet de bord, et n'importe **ni** `/server` **ni** `/app` **ni** Prisma.
5. **Given** une entrée **vide ou uniquement de la ponctuation**, **When** je normalise, **Then** je récupère une **chaîne vide** (`""`), sans planter.
6. **Given** le périmètre, **When** je normalise, **Then** je **ne fais aucune détection**, **aucun** stemming/désingularisation (« oeufs » reste « oeufs », pas « oeuf ») ni aucune recherche dans le dictionnaire — ce sont des responsabilités de **4.1b**.
7. **Given** les validations CI, **When** je lance `npm run test`, `lint` (frontière `/core` verte), `typecheck`, `SKIP_ENV_VALIDATION=1 build`, **Then** tout reste vert ; `normalize` est testée exhaustivement (accents, ligatures, ponctuation, casse, vide, idempotence, cohérence avec les clés du dictionnaire).

## Tasks / Subtasks

- [x] **Tâche 1 — Fonction `normalize`** (AC: 1, 2, 4, 5)
  - [x] Créer `src/core/allergenes/normalize.ts` : `export function normalize(brut: string): string`.
  - [x] Étapes, dans l'ordre :
    1. `toLowerCase()`.
    2. **Expansion des ligatures** : `œ`→`oe`, `æ`→`ae` (remplacement explicite avant NFD).
    3. **Décomposition + suppression des diacritiques** : `.normalize("NFD").replace(/\p{Diacritic}/gu, "")`.
    4. **Séparateurs → espace** : `.replace(/[^a-z0-9]+/g, " ")` (tout ce qui n'est pas alphanumérique ASCII devient un espace ; gère ponctuation, apostrophes, tirets, `&`, espaces multiples, etc.).
    5. `.trim()`.
  - [x] **Module PUR** : aucun import périphérie.

- [x] **Tâche 2 — Exports `/core`** (AC: 4)
  - [x] Exporter `normalize` depuis `src/core/allergenes/index.ts` et `src/core/index.ts` (à côté de la taxonomie/dictionnaire de 4.0).

- [x] **Tâche 3 — Tests** (AC: 1, 2, 3, 5, 6, 7)
  - [x] `src/core/allergenes/normalize.test.ts` :
    - Accents/casse : `"Farine de Blé T55"` → `"farine de ble t55"` ; `"Crème fraîche"` → `"creme fraiche"`.
    - Ligatures : `"Œufs"` → `"oeufs"` ; `"Cœur de bœuf"` → `"coeur de boeuf"`.
    - Ponctuation/séparateurs : `"huile d'arachide"` → `"huile d arachide"` ; `"Céleri-rave"` → `"celeri rave"` ; `"Sel & poivre"` → `"sel poivre"` ; `"Noix de cajou (grillées)"` → `"noix de cajou grillees"`.
    - Espaces : `"  Lait   entier  "` → `"lait entier"`.
    - Vide / ponctuation seule : `""` → `""` ; `"-, () &"` → `""`.
    - **Idempotence** : `normalize(normalize(x)) === normalize(x)` sur un échantillon.
    - **Non-stemming** (AC6) : `"Œufs"` → `"oeufs"` (le `s` final est conservé).
    - **Cohérence dictionnaire (AC3)** : pour **chaque** clé de `DICTIONNAIRE_ALLERGENES`, `normalize(cle)` ne contient que `[a-z0-9 ]` et `normalize(normalize(cle)) === normalize(cle)`. *(Import du dictionnaire `~/core/...` autorisé ; ne pas importer `~/lib`/`~/server`.)*

- [x] **Tâche 4 — Validations** (AC: 7)
  - [x] `npm run test`, `lint`, `typecheck`, `SKIP_ENV_VALIDATION=1 npm run build` → tout vert.

## Dev Notes

### ⚠️ Pièges critiques (lire avant de coder)

1. **`/core` PUR — zéro I/O.** `normalize.ts` ne fait que transformer une string. Aucun import `~/server`, `~/app`, `~/trpc`, Prisma (règle ESLint sur `src/core/**`). `~/lib` est techniquement autorisé mais **inutile ici** — n'importe rien d'extérieur au `/core`.

2. **Ligatures AVANT NFD.** `œ`/`æ` ne sont **pas** des diacritiques décomposés par NFD : `"œ".normalize("NFD")` reste `"œ"`. Il faut donc les remplacer explicitement (`œ→oe`, `æ→ae`) **avant** l'étape NFD, sinon « œuf » ne deviendra jamais « oeuf » et ne matchera pas la clé `oeuf` du dictionnaire (4.0).

3. **Périmètre = normalisation SEULE.** Pas de détection, pas de tokenisation-matching, pas de stemming. La règle « tokens délimités (`ail` ≠ `volaille`) » et « dans le doute on exclut » sont **4.1b**. Ici on produit juste une chaîne canonique. La désingularisation (« oeufs »→« oeuf ») est **interdite** (AC6) : trop risqué linguistiquement, et c'est 4.1b qui gérera la tolérance au pluriel au moment du match.

4. **Cohérence avec les clés du dictionnaire (4.0).** Les clés sont déjà « minuscules sans accents » mais contiennent des **apostrophes** (`huile d'arachide`, `jaune d'oeuf`) et **tirets** (`celeri-rave`, `coquille saint-jacques`). `normalize` transforme ces séparateurs en espaces. **Conséquence pour 4.1b** : `detect()` devra normaliser **les deux côtés** (texte recette ET clés du dictionnaire) avec ce même `normalize` avant de matcher. Ne **pas** modifier les clés de 4.0 dans cette story ; l'AC3 vérifie seulement que `normalize` les rend matchables (`[a-z0-9 ]`, idempotent).

5. **Idempotence = filet de sécurité.** `normalize(normalize(x)) === normalize(x)` garantit qu'on peut normaliser des données déjà normalisées sans dérive — utile quand 4.1b normalisera les clés du dictionnaire.

6. **Unicode property escapes.** `\p{Diacritic}` nécessite le flag `u` (`/.../gu`). Le projet est en TS moderne (ES2020+), supporté. Cohérent avec le test de 4.0 (`dictionnaire.test.ts`) qui utilise déjà `\p{Diacritic}`.

### État réel du projet (vérifié — acquis 4.0)

- **`src/core/allergenes/`** existe : `allergenes-ue.ts` (taxonomie 14), `dictionnaire.ts` (`DICTIONNAIRE_ALLERGENES`, clés normalisées sans accents), `dictionnaire.test.ts`, `index.ts` (barrel). `src/core/index.ts` réexporte le tout (placeholder `CORE_PLACEHOLDER` conservé).
- **Convention de clé** (4.0, en tête de `dictionnaire.ts`) : minuscules, sans accents, espaces simples — `normalize` doit produire **exactement** cette forme (modulo apostrophes/tirets → espaces).
- **Règle ESLint boundaries** active sur `src/core/**` (interdit `~/server`, `~/app`, `~/trpc`, `@prisma/client`).
- **Vitest** : tests co-localisés `*.test.ts`, environnement par défaut (fonction pure, aucun mock).
- **Pattern déjà utilisé** : `dictionnaire.test.ts` contient une fonction locale `normaliser()` qui fait `NFD + strip diacritics + lowercase` — `normalize` de cette story est la version **canonique et complète** (ligatures + séparateurs) ; à terme le test de 4.0 pourra réutiliser `normalize` (hors périmètre ici, ne pas y toucher).

### Périmètre — hors de cette story

- **`detect()`** (texte libre → `{allergenes, ingredientsNonReconnus}`, **tokens délimités**, « dans le doute on exclut », tolérance pluriel, multi-mots) → **story 4.1b**.
- **Corpus d'or annoté + gate CI asymétrique** (faux négatif = build rouge) → **story 4.1b**.
- **Mur / curseur / resoudre** → stories 4.3+.

### Décisions tranchées

- **Sortie = `string`** (chaîne normalisée), pas `string[]`. La tokenisation/segmentation pour le matching multi-mots est une décision de `detect()` (4.1b) qui opérera sur cette chaîne avec des frontières de mots. Garder `normalize` minimal et composable.
- **Pas de stemming/pluriel** dans `normalize` (cf. AC6, piège 3).

### Testing standards

- **Vitest**, environnement par défaut ; fonction pure → aucun mock, aucune DB.
- Tests exhaustifs des classes d'entrée (accents, ligatures, ponctuation, casse, espaces, vide) + **idempotence** + **cohérence avec les clés du dictionnaire** (gate léger anti-dérive normalize↔clés).
- Co-localiser dans `src/core/allergenes/`.

### Definition of Done manuelle (utilisateur, hors agent)

1. `npm run test` vert (dont les cas ligatures et idempotence).
2. Ouvrir `normalize.ts` → 5 étapes lisibles, aucun import extérieur.
3. `npm run lint` vert (frontière `/core` intacte).

### Project Structure Notes

- **Nouveaux** : `src/core/allergenes/normalize.ts`, `src/core/allergenes/normalize.test.ts`.
- **Modifiés** : `src/core/allergenes/index.ts` + `src/core/index.ts` (export `normalize`).
- **Aucune** migration, **aucune** dépendance, **aucun** I/O.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 4.1] (énoncé + AC : detect après normalize, tokens délimités, « dans le doute on exclut », corpus d'or ; note de découpage 4.1a/b/c)
- [Source: _bmad-output/planning-artifacts/architecture.md#Domain Core (/core)] (`normalize`, dictionnaire, detect — purs sans I/O ; corpus d'or = gate CI)
- [Source: _bmad-output/planning-artifacts/architecture.md#Enforcement Guidelines] (jamais `includes()` ; match sur tokens — pour 4.1b ; /core n'importe pas /server,/app)
- [Source: _bmad-output/implementation-artifacts/4-0-dictionnaire-ingredient-allergene.md] (convention de clé normalisée, `DICTIONNAIRE_ALLERGENES`, frontière `/core`)

## Dev Agent Record

### Agent Model Used

claude-opus-4-8 (bmad-dev-story)

### Debug Log References

- Suite complète : **132/132** ✅ (124 → 132, +8). `lint` ✅ (frontière `/core` verte), `typecheck` ✅, `SKIP_ENV_VALIDATION=1 build` ✅.
- Aucun échec ; fonction pure, aucun mock.

### Completion Notes List

- ✅ **`normalize(brut)`** (`src/core/allergenes/normalize.ts`) : 5 étapes dans l'ordre — `toLowerCase` → expansion ligatures (`œ→oe`, `æ→ae`) **avant** NFD → `NFD` + suppression diacritiques → `[^a-z0-9]+ → " "` → `trim`. Module PUR, aucun import extérieur.
- ✅ **Ligature avant NFD** : `"œuf"` → `"oeuf"` (NFD seul laisserait `œ` intact, cassant le match avec la clé `oeuf` de 4.0). Couvre aussi `æ`.
- ✅ **Idempotence** vérifiée (`normalize(normalize(x)) === normalize(x)`), y compris sur **toutes les clés du dictionnaire** (gate anti-dérive : chaque clé → `[a-z0-9 ]`).
- ✅ **Pas de stemming/pluriel** (AC6) : `"oeufs"`/`"crevettes"` conservés au pluriel — la tolérance pluriel est laissée à `detect()` (4.1b).
- ✅ Exports `normalize` via `src/core/allergenes/index.ts` + `src/core/index.ts`.
- **Contrat pour 4.1b** : `detect()` devra `normalize` **les deux côtés** (texte recette + clés du dictionnaire). Les clés de 4.0 (apostrophes/tirets) deviennent espaces une fois normalisées — non modifiées en base.
- **Hors périmètre** : `detect()` + corpus d'or + gate CI → story 4.1b.
- **DoD utilisateur** : `npm run test` vert (ligatures, idempotence) ; `npm run lint` vert.

### File List

- `src/core/allergenes/normalize.ts` (NOUVEAU)
- `src/core/allergenes/normalize.test.ts` (NOUVEAU)
- `src/core/allergenes/index.ts` (MODIFIÉ — export `normalize`)
- `src/core/index.ts` (MODIFIÉ — export `normalize`)

### Change Log

- 2026-06-27 : Story 4.1a implémentée — `normalize()` (forme canonique : minuscules, sans accents, ligatures expansées, séparateurs → espace), pure dans `/core`. Tests : accents/ligatures/ponctuation/vide/idempotence + cohérence avec les clés du dictionnaire. 132/132, lint (boundaries)/typecheck/build verts. Statut → review.
