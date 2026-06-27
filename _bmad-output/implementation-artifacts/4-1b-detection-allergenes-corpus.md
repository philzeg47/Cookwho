---
baseline_commit: ff6af85
---

# Story 4.1b : Détection des allergènes (`detect`) + corpus d'or & gate CI

Status: review

## Story

As a moteur de sécurité,
I want détecter les allergènes dans une liste d'ingrédients en texte libre,
so that aucune recette dangereuse ne soit jamais présentée comme sûre. (FR13, NFR3)

## Acceptance Criteria

1. **Given** une liste d'ingrédients en texte libre, **When** `detect(ingredients)` s'exécute (en s'appuyant sur `normalize` de 4.1a), **Then** elle renvoie `{ allergenes: AllergeneUE[], ingredientsNonReconnus: string[] }`, couvrant les **14 allergènes UE** via le dictionnaire de 4.0.
2. **Given** la règle de match, **When** un token d'ingrédient est comparé au dictionnaire, **Then** le match se fait sur **tokens délimités entiers** (séquence contiguë de tokens) — **jamais** en sous-chaîne : `ail` **≠** `volaille`, `lait` **≠** `allaitement`.
3. **Given** les pluriels courants, **When** un ingrédient est au pluriel (« Œufs », « Crevettes »), **Then** il matche la clé au singulier du dictionnaire (« oeuf », « crevette ») via une **tolérance suffixe `s`/`x`** (sens conservateur : on préfère sur-détecter que rater).
4. **Given** « dans le doute, on exclut », **When** une ligne d'ingrédient ne matche **aucune** entrée du dictionnaire, **Then** elle est rangée dans `ingredientsNonReconnus` (forme d'origine) — elle ne sera **jamais** considérée « sûre » par `detect`. *(La décision d'exclusion au mur est la story 4.3.)*
4bis. **Given** la sortie, **When** `detect` renvoie `allergenes`, **Then** la liste est **dédupliquée et ordonnée de façon déterministe** (ordre de `ALLERGENES_UE_CODES`).
5. **Given** la pureté `/core`, **When** `detect` s'exécute, **Then** elle est **pure, déterministe, sans I/O**, n'importe **ni** `/server` **ni** `/app` **ni** Prisma. Le fichier `detect.ts` n'importe **pas** le corpus (seul le test le charge).
6. **Given** un **corpus d'or annoté** (`fixtures/ingredients-annotes.json`) — **écrit avant/avec le code** —, **When** la CI exécute les tests, **Then** une **assertion asymétrique** vérifie pour chaque cas que `allergenesAttendus ⊆ detect(...).allergenes` : **un faux négatif (allergène attendu manquant) fait échouer le build** (gate CI, NFR3). Les faux positifs ne cassent pas le build (sens conservateur).
7. **Given** les validations, **When** je lance `npm run test`, `lint` (frontière `/core` verte), `typecheck`, `SKIP_ENV_VALIDATION=1 build`, **Then** tout reste vert ; le corpus couvre les 14 allergènes, les cas multi-mots, pluriels, dérivés, et les pièges de sous-chaîne (`ail`/`volaille`).

## Tasks / Subtasks

- [x] **Tâche 1 — Corpus d'or annoté (ÉCRIT EN PREMIER)** (AC: 6, 7)
  - [x] Créer `src/core/allergenes/fixtures/ingredients-annotes.json` : tableau de cas `{ "ingredients": string[], "allergenesAttendus": AllergeneUE[], "note"?: string }`.
  - [x] Couvrir : **chacun des 14 allergènes** (au moins un cas), des **dérivés** (mayonnaise→OEUFS, sauce soja→SOJA, tahin→SESAME…), du **multi-mots** (noix de cajou, huile d'arachide), des **pluriels** (Œufs→OEUFS), des **listes mixtes** (recette réaliste), et des **pièges de sous-chaîne attendus VIDES** (ex. `{ "ingredients": ["Cuisse de volaille", "Ail"], "allergenesAttendus": [] }` — ni `lait` via « volaille », et `ail` n'est pas un allergène).
  - [x] Inclure des cas `ingredientsNonReconnus` (ex. « tomate », « carotte ») pour tester le rangement (sans en faire des allergènes).

- [x] **Tâche 2 — `detect()` + index normalisé** (AC: 1, 2, 3, 4, 4bis, 5)
  - [x] Créer `src/core/allergenes/detect.ts` :
    ```ts
    export type ResultatDetection = {
      allergenes: AllergeneUE[];
      ingredientsNonReconnus: string[];
    };
    export function detect(ingredients: string[]): ResultatDetection;
    ```
  - [x] **Index normalisé** (module-level, pur) : précalculer pour chaque entrée du `DICTIONNAIRE_ALLERGENES` ses **tokens de clé normalisés** via `normalize(entree.ingredient).split(" ")` (honore le contrat 4.1a : normaliser les **deux** côtés).
  - [x] Pour chaque ligne d'ingrédient : `normalize` → tokens → tester chaque entrée de l'index : ses tokens de clé forment-ils une **sous-séquence contiguë** des tokens de l'ingrédient, avec **tolérance pluriel** (`tokenIngredient === tokenCle || tokenIngredient === tokenCle + "s" || tokenIngredient === tokenCle + "x"`) ? Si oui → ajouter `entree.allergenes`.
  - [x] Si une ligne ne matche **aucune** entrée → pousser la ligne **d'origine** dans `ingredientsNonReconnus`.
  - [x] `allergenes` final : dédupliqué + trié selon l'ordre de `ALLERGENES_UE_CODES` (déterminisme).
  - [x] **NE PAS** importer le corpus dans `detect.ts`. Pas de `includes()` de sous-chaîne (anti-pattern interdit).

- [x] **Tâche 3 — Tests unitaires `detect`** (AC: 2, 3, 4, 4bis, 7)
  - [x] `src/core/allergenes/detect.test.ts` :
    - **Tokens délimités** : `detect(["Cuisse de volaille"])` → `allergenes: []` (pas de `lait`/`ail`), et « volaille » va dans `ingredientsNonReconnus`. `detect(["Ail"])` → `[]`.
    - **Multi-mots** : `detect(["200 g de noix de cajou"])` → `[FRUITS_A_COQUE]`.
    - **Pluriel** : `detect(["Œufs entiers"])` → `[OEUFS]` ; `detect(["Crevettes roses"])` → `[CRUSTACES]`.
    - **Dérivés** : `detect(["Mayonnaise"])` → `[OEUFS]` ; `detect(["Sauce soja"])` → `[SOJA]`.
    - **Mixte + non reconnus** : `detect(["Tomate", "Arachide", "Basilic"])` → `allergenes: [ARACHIDES]`, `ingredientsNonReconnus: ["Tomate","Basilic"]`.
    - **Déterminisme** : ordre de sortie stable (ordre `ALLERGENES_UE_CODES`) ; pas de doublon.
    - **Pureté** : appel répété → même résultat.

- [x] **Tâche 4 — Test du corpus d'or (gate CI asymétrique)** (AC: 6)
  - [x] `src/core/allergenes/corpus.test.ts` : importer le JSON (`resolveJsonModule`), itérer chaque cas, asserter **`expect(detect(cas.ingredients).allergenes).toEqual(expect.arrayContaining(cas.allergenesAttendus))`** (asymétrique → faux négatif = rouge).
  - [x] Un test de **garde** : le corpus couvre les 14 codes (`union des allergenesAttendus ⊇ ALLERGENES_UE_CODES`) — garantit que le gate teste bien tous les allergènes.

- [x] **Tâche 5 — Exports `/core` + vérif gate CI** (AC: 1, 6)
  - [x] Exporter `detect` + `ResultatDetection` depuis `src/core/allergenes/index.ts` et `src/core/index.ts`.
  - [x] Vérifier que `npm run test` (lancé par la CI) inclut bien `corpus.test.ts` : la co-localisation suffit. Si `.github/workflows/ci.yml` existe, confirmer qu'il exécute `npm run test` ; sinon, le noter (création CI = hors périmètre, infra).

- [x] **Tâche 6 — Validations** (AC: 7)
  - [x] `npm run test`, `lint`, `typecheck`, `SKIP_ENV_VALIDATION=1 npm run build` → tout vert.

## Dev Notes

### ⚠️ Pièges critiques (lire avant de coder)

1. **CORPUS D'OR ÉCRIT EN PREMIER (TDD sécurité).** L'architecture l'exige : « corpus d'or écrit AVANT le code de détection ». Écris d'abord `ingredients-annotes.json` avec les cas attendus, puis `detect` pour les faire passer. Le corpus est le **filet de sécurité** du produit.

2. **Assertion ASYMÉTRIQUE — c'est tout l'enjeu (NFR3).** Le test du corpus vérifie `allergenesAttendus ⊆ detected` (`arrayContaining`). Un **faux négatif** (allergène attendu manquant) = **build rouge**. Un faux positif (allergène en trop) ne casse **pas** le build — le moteur est **conservateur** : mieux vaut sur-exclure que présenter un plat dangereux comme sûr. N'inverse jamais ce sens (pas de `toEqual` strict qui ferait échouer sur un faux positif).

3. **Match sur TOKENS DÉLIMITÉS, jamais `includes()` de sous-chaîne (anti-pattern explicitement interdit).** « ail » ⊂ « volaille » et « lait » ⊂ « allaitement » : un `String.includes` détecterait à tort. Tokenise (`split(" ")`) et teste une **sous-séquence contiguë de tokens**. Une clé multi-mots (« noix de cajou ») = 3 tokens contigus à retrouver dans la ligne.

4. **Normaliser les DEUX côtés (contrat 4.1a).** Les clés du dictionnaire (4.0) contiennent apostrophes/tirets (« huile d'arachide », « celeri-rave ») → applique `normalize` aux clés **et** au texte recette avant de matcher. Précalcule un index des clés normalisées au niveau module (pur, calculé une fois à l'import — pas d'I/O).

5. **Tolérance pluriel limitée et conservatrice.** `oeufs`→`oeuf`, `crevettes`→`crevette` via suffixe `s`/`x`. Ne fais **pas** de stemming linguistique complet (risque). Le sens conservateur (sur-détection) est acceptable côté sécurité. Documente la règle exacte.

6. **`detect.ts` NE CHARGE PAS le corpus.** Le corpus est une fixture de **test** uniquement (`corpus.test.ts` l'importe). `detect.ts` reste pur et ne dépend que de `normalize` + `dictionnaire` + `allergenes-ue`. Sinon tu couples le moteur à ses données de test.

7. **`ingredientsNonReconnus` ≠ « sûr ».** Une ligne sans match d'allergène va dans `ingredientsNonReconnus`. **`detect` ne déclare jamais un ingrédient “sûr”** — il dit seulement « aucun allergène connu trouvé ». La politique « dans le doute on exclut » s'applique au **mur (4.3)**. Voir la **question ouverte** ci-dessous (liste blanche).

8. **Déterminisme.** Trie `allergenes` selon l'ordre de `ALLERGENES_UE_CODES` et déduplique. Indispensable pour des tests stables et un comportement reproductible.

### État réel du projet (vérifié — acquis 4.0 + 4.1a)

- **`src/core/allergenes/`** : `allergenes-ue.ts` (`AllergeneUE`, `ALLERGENES_UE_CODES`, `LIBELLES_ALLERGENES`), `dictionnaire.ts` (`DICTIONNAIRE_ALLERGENES`, `EntreeDictionnaire`), `normalize.ts` (`normalize`), `index.ts` (barrel), tests co-localisés. `src/core/index.ts` réexporte le tout.
- **`normalize`** (4.1a) : minuscules, sans accents, ligatures expansées, séparateurs → espaces, trim ; **idempotente** et prouvée matchable sur toutes les clés du dictionnaire. **C'est la brique à composer ici.**
- **Dictionnaire** (4.0) : ~80 entrées, clés normalisées (mais avec apostrophes/tirets → à `normalize` au runtime), 14 allergènes couverts, provenance tracée. Une entrée multi-allergène (`surimi` → POISSON+CRUSTACES).
- **Règle ESLint boundaries** active sur `src/core/**`. **`resolveJsonModule`** : vérifier qu'il est activé dans `tsconfig.json` (T3 le met par défaut) — nécessaire pour importer le corpus JSON dans le test ; sinon, utiliser un module `.ts` exportant le corpus.
- **Vitest** : tests co-localisés ; `npm run test` est lancé par la CI → le corpus devient un gate de fait.

### Périmètre — hors de cette story

- **Mur / exclusion** (« recette avec ingrédient non reconnu exclue par défaut ») → **story 4.3**. 4.1b **détecte et signale**, il n'exclut rien.
- **Source de recettes + cache** (d'où viendront les vraies listes d'ingrédients) → story 4.2.
- **Curseur / resoudre / dégradation / échec** → stories 4.4+.
- **Création/édition du workflow CI `.github/workflows/ci.yml`** (infra) → hors périmètre ; le gate est réalisé par l'inclusion du corpus dans `npm run test`.

### Question ouverte (à trancher en 4.3 — signalée, non bloquante ici)

- **Liste blanche d'ingrédients sûrs ?** Avec le seul dictionnaire d'allergènes, **tout** ingrédient non-allergène courant (tomate, oignon, carotte…) tombe dans `ingredientsNonReconnus`. Si le mur (4.3) « exclut toute recette à ingrédient non reconnu », il exclurait quasiment **tout** → produit inutilisable. Il faudra probablement, en 4.3, soit une **liste blanche** d'ingrédients sûrs, soit une politique de mur plus nuancée. **4.1b n'introduit pas de liste blanche** (hors périmètre, pas dans l'archi de 4.0) mais expose `ingredientsNonReconnus` pour que 4.3 décide. À confirmer avec le PO en 4.3.

### Décisions tranchées

- **Entrée = `string[]`** (lignes d'ingrédients). `ingredientsNonReconnus` renvoie les **lignes d'origine** (traçabilité / signalement UI ultérieur).
- **Matching = sous-séquence contiguë de tokens + tolérance suffixe `s`/`x`.** Conservateur, simple, déterministe.
- **Sortie triée** selon `ALLERGENES_UE_CODES`.
- **Corpus en JSON** (`fixtures/ingredients-annotes.json`), chargé uniquement par le test.

### Testing standards

- **Vitest**, environnement par défaut ; fonctions pures, aucun mock, aucune DB.
- **Deux niveaux** : `detect.test.ts` (unités : tokens, multi-mots, pluriel, dérivés, non-reconnus, déterminisme) + `corpus.test.ts` (**gate asymétrique** sur le corpus d'or + garde « 14 couverts »).
- Co-localiser dans `src/core/allergenes/`. Le corpus dans `fixtures/`.

### Definition of Done manuelle (utilisateur, hors agent)

1. `npm run test` vert, dont `corpus.test.ts`.
2. Sabotage de contrôle : retirer temporairement une entrée du dictionnaire (ex. `arachide`) → le corpus doit **passer au rouge** (preuve que le gate attrape un faux négatif), puis remettre l'entrée.
3. `npm run lint` vert (frontière `/core` intacte).

### Project Structure Notes

- **Nouveaux** : `src/core/allergenes/detect.ts`, `src/core/allergenes/detect.test.ts`, `src/core/allergenes/corpus.test.ts`, `src/core/allergenes/fixtures/ingredients-annotes.json`.
- **Modifiés** : `src/core/allergenes/index.ts` + `src/core/index.ts` (export `detect`, `ResultatDetection`).
- **Aucune** migration, **aucune** dépendance, **aucun** I/O. Vérifier `resolveJsonModule` (sinon corpus en `.ts`).

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 4.1] (énoncé + AC : `{allergenes, ingredientsNonReconnus}`, tokens délimités, « dans le doute on exclut », corpus d'or + assertion asymétrique)
- [Source: _bmad-output/planning-artifacts/architecture.md#Domain Core (/core)] (`detect`, corpus d'or = gate CI ; corpus écrit AVANT le code) ; [#Enforcement Guidelines] (jamais `includes()` ; match sur tokens ; faux négatif = build rouge)
- [Source: _bmad-output/planning-artifacts/prds/.../addendum.md#Couche allergènes interne] (dictionnaire maison, « dans le doute on exclut », indépendance de la source)
- [Source: _bmad-output/implementation-artifacts/4-0-dictionnaire-ingredient-allergene.md] (`DICTIONNAIRE_ALLERGENES`, taxonomie, convention de clé)
- [Source: _bmad-output/implementation-artifacts/4-1a-normalize-ingredients.md] (`normalize`, contrat « normaliser les deux côtés », idempotence)

## Dev Agent Record

### Agent Model Used

claude-opus-4-8 (bmad-dev-story)

### Debug Log References

- Suite complète : **162/162** ✅ (132 → 162, +30 : detect ×11, corpus ×18 cas + 1 garde « 14 couverts »). `lint` ✅ (frontière `/core` verte), `typecheck` ✅, `SKIP_ENV_VALIDATION=1 build` ✅.
- 1 échec transitoire corrigé : ordre attendu surimi (`[CRUSTACES, POISSON]` — ordre canonique de la taxonomie, pas `[POISSON, CRUSTACES]`).
- ✅ **Test de sabotage (DoD #2) exécuté** : suppression temporaire des 4 entrées ARACHIDES → le corpus passe au **rouge** sur « Beurre de cacahuète » (`['GLUTEN','LAIT'] ⊉ ['ARACHIDES','GLUTEN']`), puis dictionnaire restauré via `git checkout`. Preuve que le gate attrape un faux négatif.

### Completion Notes List

- ✅ **Corpus d'or annoté ÉCRIT EN PREMIER** (`fixtures/ingredients-annotes.json`) : 18 cas couvrant les 14 allergènes + dérivés (mayonnaise, surimi, sauce soja, tahin) + multi-mots + pluriels + 2 pièges sous-chaîne (« volaille » sans LAIT, « ail » non allergène) + cas tout-non-reconnu.
- ✅ **`detect(ingredients)`** (`detect.ts`, pur) : index normalisé précalculé (clés `normalize`-ées → contrat 4.1a « normaliser les deux côtés ») ; match **sous-séquence contiguë de tokens** (jamais `includes()`) + **tolérance pluriel** suffixe `s`/`x` ; `ingredientsNonReconnus` = lignes d'origine sans allergène (jamais déclaré « sûr ») ; sortie **dédupliquée + triée** selon `ALLERGENES_UE_CODES`.
- ✅ **Gate CI asymétrique** (`corpus.test.ts`) : `expect(detect(...).allergenes).toEqual(expect.arrayContaining(attendus))` → **faux négatif = build rouge** ; faux positif toléré (conservateur). + garde « le corpus couvre les 14 codes ».
- ✅ Exports `detect`/`ResultatDetection` via `index.ts` + `src/core/index.ts`. `detect.ts` **ne charge pas** le corpus (fixture de test only).
- ⚠️ **Comportement conservateur connu (à signaler en revue)** : « Beurre de cacahuète » déclenche aussi `LAIT` (token « beurre »), faux positif assumé côté sécurité (sur-exclusion). Non annoté dans le corpus (l'assertion asymétrique ne s'en soucie pas). Un raffinement « plus longue clé gagnante » serait possible plus tard.
- ⚠️ **Question ouverte transmise à 4.3** : sans **liste blanche** d'ingrédients sûrs, tout ingrédient courant (tomate, oignon) est « non reconnu » → le mur « exclut tout non-reconnu » exclurait quasiment tout. 4.1b expose `ingredientsNonReconnus` ; la politique se tranche en 4.3.
- **Hors périmètre** : mur/exclusion (4.3), source+cache (4.2). `.github/workflows/ci.yml` non créé (infra) — le gate vit dans `npm run test`.

### File List

- `src/core/allergenes/fixtures/ingredients-annotes.json` (NOUVEAU — corpus d'or annoté)
- `src/core/allergenes/detect.ts` (NOUVEAU — `detect` + index normalisé)
- `src/core/allergenes/detect.test.ts` (NOUVEAU — unités)
- `src/core/allergenes/corpus.test.ts` (NOUVEAU — gate asymétrique)
- `src/core/allergenes/index.ts` (MODIFIÉ — export `detect`/`ResultatDetection`)
- `src/core/index.ts` (MODIFIÉ — export `detect`/`ResultatDetection`)

### Change Log

- 2026-06-27 : Story 4.1b implémentée — `detect()` (tokens délimités, tolérance pluriel, conservateur) + corpus d'or annoté + gate CI asymétrique (faux négatif = build rouge). Sabotage de contrôle validé. 162/162, lint (boundaries)/typecheck/build verts. Statut → review. **Détection d'allergènes interne opérationnelle (FR13).**
