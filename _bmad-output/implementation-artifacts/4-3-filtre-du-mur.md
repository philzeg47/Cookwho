---
baseline_commit: ca729b2
---

# Story 4.3 : Filtre du mur (exclusion stricte)

Status: review

## Story

As a moteur,
I want exclure strictement toute recette violant une contrainte non-négociable du groupe,
so that la sécurité prime toujours. (FR9 base, NFR3)

## Acceptance Criteria

1. **Given** les contraintes dures du groupe (allergies + régimes des participants couverts) et la **détection** d'une recette (`{ allergenes, ingredientsNonReconnus }` issue de `detect`), **When** `mur(contraintes, detection)` évalue, **Then** la recette est **exclue** si elle contient un **allergène déclaré** par un participant couvert.
2. **Given** un régime **mappable sur un allergène** (« Sans gluten » → GLUTEN, « Sans lactose »/« Sans lait » → LAIT), **When** la recette contient cet allergène, **Then** elle est **exclue** (régime non-négociable = mur).
3. **Given** un **ingrédient non reconnu** (`ingredientsNonReconnus` non vide), **When** le mur évalue, **Then** la recette **n'est PAS exclue automatiquement** mais marquée **« incertaine »** (modèle 3 états archi : sûr / contient / incertain) — l'exclusion dure est réservée aux allergènes/régimes **détectés** ; l'incertitude est **signalée** pour l'avertissement humain (FR16, Epic 5).
4. **Given** un **régime non évaluable** en V1 (végétarien, vegan, pescétarien, halal, casher, sans porc — pas de dico ingrédient→propriété) **ou** une **allergie libre non mappable** sur les 14 codes (ex. « Sarrasin »), **When** le mur évalue, **Then** la recette est marquée **« incertaine »** (le mur ne peut pas garantir → signalé), **jamais** présentée comme sûre à tort.
5. **Given** la fonction est **pure** (`/core`, zéro I/O), **When** elle évalue, **Then** elle est déterministe, sans I/O, n'importe **ni** `/server` **ni** `/app` **ni** Prisma, et renvoie un **verdict discriminé** (jamais d'exception).
6. **Given** l'invariant de sécurité, **When** je lance les property-tests, **Then** un test garantit qu'**aucune recette retenue (`exclu: false`) ne contient un allergène interdit d'aucun participant** (assertion d'invariant — faux négatif = build rouge).
7. **Given** les validations, **When** je lance `npm run test`, `lint` (frontière `/core` verte), `typecheck`, `SKIP_ENV_VALIDATION=1 build`, **Then** tout reste vert ; `mur` et `construireContraintes` sont testés exhaustivement.

## Tasks / Subtasks

- [x] **Tâche 1 — Types & verdict** (AC: 1, 3, 4, 5)
  - [x] Créer `src/core/compatibilite/mur.ts` :
    ```ts
    export type Contraintes = {
      allergenesInterdits: AllergeneUE[];   // allergies déclarées + régimes-allergènes (gluten/lait)
      incertitudes: string[];               // régimes non évaluables + allergies non mappées (le mur ne garantit pas)
    };
    export type RaisonExclusion =
      | { type: "ALLERGIE"; allergene: AllergeneUE }
      | { type: "REGIME"; allergene: AllergeneUE };
    export type VerdictMur =
      | { exclu: true; raisons: RaisonExclusion[] }
      | { exclu: false; incertain: boolean; raisonsIncertitude: string[] };
    ```

- [x] **Tâche 2 — `construireContraintes` (déclaration → contraintes)** (AC: 1, 2, 4)
  - [x] `construireContraintes(restrictions: { type: "REGIME"|"ALLERGIE"|"NON_AIME"; valeur: string }[]): Contraintes` :
    - `ALLERGIE` : mapper `valeur` (libellé) → code via l'inverse de `LIBELLES_ALLERGENES` (insensible à la casse). Mappable → `allergenesInterdits` ; **non mappable** (allergie libre hors 14) → `incertitudes` (`"allergie non vérifiable : <valeur>"`).
    - `REGIME` : si mappable sur allergène (`REGIMES_VERS_ALLERGENE`) → ajouter le code à `allergenesInterdits` ; sinon (régime alimentaire) → `incertitudes` (`"régime non évalué : <valeur>"`).
    - `NON_AIME` : **ignoré** ici (c'est le **curseur**, story 4.4 — pas le mur).
    - Dédupliquer `allergenesInterdits`.
  - [x] Constante `REGIMES_VERS_ALLERGENE: Record<string, AllergeneUE>` (clés en minuscules) : `{ "sans gluten": "GLUTEN", "sans lactose": "LAIT", "sans lait": "LAIT" }`.

- [x] **Tâche 3 — `mur` (verdict)** (AC: 1, 2, 3, 5)
  - [x] `mur(contraintes: Contraintes, detection: ResultatDetection): VerdictMur` :
    - `raisons` = allergènes interdits **présents** dans `detection.allergenes` → `{ type: "ALLERGIE"|"REGIME", allergene }` (peu importe la distinction fine ; au minimum `ALLERGIE`).
    - Si `raisons.length > 0` → `{ exclu: true, raisons }`.
    - Sinon → `incertain = detection.ingredientsNonReconnus.length > 0 || contraintes.incertitudes.length > 0` ; `{ exclu: false, incertain, raisonsIncertitude: [...] }` (lister « ingrédient(s) non reconnu(s) » et les `contraintes.incertitudes`).
  - [x] **Aucune exception** : toujours un `VerdictMur`.

- [x] **Tâche 4 — Exports `/core`** (AC: 5)
  - [x] Exporter `mur`, `construireContraintes`, et les types depuis `src/core/compatibilite/index.ts` (nouveau barrel) + `src/core/index.ts`.

- [x] **Tâche 5 — Tests (dont invariant de sécurité)** (AC: 1, 2, 3, 4, 6, 7)
  - [x] `src/core/compatibilite/mur.test.ts` :
    - **Allergie** : contrainte ARACHIDES + détection {ARACHIDES} → `exclu: true`.
    - **Régime-allergène** : « Sans gluten » + détection {GLUTEN} → `exclu: true` ; « Sans gluten » + détection {} → non exclu.
    - **Incertain (ingrédient inconnu)** : détection {allergenes: [], ingredientsNonReconnus: ["xyz"]}, contraintes vides → `exclu: false, incertain: true`.
    - **Incertain (régime non évalué)** : « Végétarien » → `incertitudes` non vide → `incertain: true` ; **jamais** `exclu` de ce seul fait.
    - **Incertain (allergie libre)** : ALLERGIE « Sarrasin » → `incertitudes` ; non exclu (sauf si détecté, ce qu'on ne peut pas).
    - **`NON_AIME` ignoré** par `construireContraintes`.
    - **Sûr** : aucune contrainte violée, aucun inconnu → `exclu: false, incertain: false`.
    - **INVARIANT (AC6)** : sur un échantillon (boucle déterministe de combinaisons contraintes × détections), asserter que **si `exclu: false` alors `detection.allergenes ∩ contraintes.allergenesInterdits === ∅`**.

- [x] **Tâche 6 — Validations** (AC: 7)
  - [x] `npm run test`, `lint`, `typecheck`, `SKIP_ENV_VALIDATION=1 npm run build` → tout vert.

## Dev Notes

### ⚠️ Pièges critiques (lire avant de coder)

1. **`/core` PUR — `mur` ne fait pas d'I/O et ne détecte rien.** Il **reçoit** déjà le résultat de `detect()` (allergènes + ingrédients non reconnus). La composition « recette → normalize → detect → mur » se branchera en **4.4**. Ici : logique de verdict pure. Aucun import `/server`/`/app`/Prisma (règle ESLint).

2. **Décision produit (2026-06-27) — modèle 3 états, PAS « exclu par défaut sur inconnu ».** L'AC de l'epic disait « ingrédient non reconnu exclu par défaut » ; l'**architecture** (3 états sûr/contient/incertain + avertissement humain + disclaimer) **prévaut** : exclusion **dure** seulement sur allergène/régime **détecté** ; inconnu → **« incertain »** signalé (FR16). Ne **pas** exclure automatiquement sur ingrédient non reconnu (sinon le mur exclut quasiment tout — dico maison non exhaustif).

3. **Sécurité = ne jamais présenter sûr à tort.** Tout ce que le mur **ne peut pas garantir** (régime non évaluable, allergie libre non mappable, ingrédient inconnu) ⇒ `incertain: true`. L'invariant testé (AC6) protège le cœur : une recette **retenue** ne contient **jamais** un allergène **interdit détecté**.

4. **Portée régimes (décision 2026-06-27) — régimes-allergènes seulement.** « Sans gluten »/« Sans lactose »/« Sans lait » → mappés sur GLUTEN/LAIT. Les régimes **alimentaires** (végétarien, vegan, pescétarien, halal, casher, sans porc) exigent un **dico ingrédient→propriété** (viande/porc/animal) non construit → story **différée `4-3b-regimes-alimentaires`**. En 4.3, ces régimes → `incertitudes` (signalés, jamais ignorés).

5. **`NON_AIME` n'est PAS le mur.** Les aliments non-aimés + seuil de tolérance = le **curseur** (optimisation des goûts, story 4.4). `construireContraintes` **ignore** les `NON_AIME`. Ne pas les traiter ici.

6. **Mapping libellé→code via `LIBELLES_ALLERGENES` (4.0).** Inverser ce `Record` (code→libellé) pour mapper une `ALLERGIE.valeur` (« Arachides ») vers le code (`ARACHIDES`). Comparaison **insensible à la casse**. Le test anti-dérive de 4.0 garantit que ces libellés == liste participant.

7. **Verdict discriminé, jamais d'exception** (pattern architecture « Result »). `VerdictMur` est une union discriminée sur `exclu`. Le code appelant (4.4 / routers) traduira en UI/erreur.

### État réel du projet (vérifié — acquis 4.0 → 4.2)

- **`/core/allergenes`** : `detect(ingredients) → ResultatDetection { allergenes: AllergeneUE[], ingredientsNonReconnus: string[] }` ; `AllergeneUE`, `ALLERGENES_UE_CODES`, `LIBELLES_ALLERGENES` (libellés == liste participant). **À composer ici** (importer le **type** `ResultatDetection` + `AllergeneUE` + `LIBELLES_ALLERGENES`).
- **`/core/compatibilite/`** : dossier **à créer** (architecture : `mur.ts`, `curseur.ts`, `resoudre.ts`). Cette story crée `mur.ts` (+ barrel).
- **Restrictions participant** (`Restriction`) : `type REGIME|ALLERGIE|NON_AIME`, `valeur`, `seuilTolerance?`. Les valeurs viennent de `REGIMES_COURANTS`/`ALLERGENES_UE` (3.2b) **ou** de saisie libre. `construireContraintes` prend un tableau `{ type, valeur }` (les seuils ne concernent pas le mur).
- **`RecetteBrute`** (4.2) : `{ source, sourceRef, titre, ingredientsTexte }`. La détection sur `ingredientsTexte` (normalize+detect) = composition de **4.4** ; 4.3 reçoit déjà la `ResultatDetection`.
- **Règle ESLint boundaries** sur `src/core/**`. Vitest, tests co-localisés, fonctions pures (aucun mock).

### Périmètre — hors de cette story

- **Régimes alimentaires** (végétarien/vegan/halal/casher/porc/pescétarien) → **story `4-3b-regimes-alimentaires`** (dico ingrédient→propriété). Ici : signalés « incertain ».
- **Curseur / scoring des goûts** (`NON_AIME` + seuils) → story **4.4** (`curseur.ts`).
- **`resoudre()`** (génération 3-10, dégradation, échec explicatif) → stories **4.4/4.5/4.6**.
- **Composition recette→normalize→detect→mur** (pipeline) → **4.4**.
- **Avertissement humain organisateur** (FR16) → **Epic 5** ; 4.3 ne fait que **signaler** l'incertitude dans le verdict.

### Décisions tranchées (2026-06-27)

- **Ingrédient non reconnu → « incertain » signalé** (modèle 3 états archi), **pas** d'exclusion auto. Exclusion dure réservée aux allergènes/régimes **détectés**.
- **Régimes-allergènes seulement** en 4.3 ; régimes alimentaires différés (`4-3b`).
- **Verdict discriminé** (`VerdictMur`), pur, sans exception.

### Testing standards

- **Vitest**, environnement par défaut ; fonctions pures, aucun mock.
- **Invariant de sécurité** (AC6) = property-test : aucune recette `exclu: false` ne contient un allergène interdit (boucle déterministe sur combinaisons).
- Couvrir : exclusion allergie, exclusion régime-allergène, incertitude (inconnu / régime non évalué / allergie libre), `NON_AIME` ignoré, cas sûr.
- Co-localiser dans `src/core/compatibilite/`.

### Definition of Done manuelle (utilisateur, hors agent)

1. `npm run test` vert, dont le property-test d'invariant.
2. Sabotage de contrôle : forcer `mur` à retenir une recette avec allergène interdit → l'invariant doit passer au **rouge** (preuve), puis annuler.
3. `npm run lint` vert (frontière `/core`).

### Project Structure Notes

- **Nouveaux** : `src/core/compatibilite/mur.ts`, `src/core/compatibilite/mur.test.ts`, `src/core/compatibilite/index.ts` (barrel).
- **Modifiés** : `src/core/index.ts` (exports `mur`, `construireContraintes`, types).
- **Aucune** migration, **aucune** dépendance, **aucun** I/O.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 4.3] (mur, exclusion stricte, invariant ; AC « ingrédient non reconnu exclu par défaut » — **arbitré** vers le modèle 3 états, cf. archi)
- [Source: _bmad-output/planning-artifacts/architecture.md#Project Context / NFR] (3 états sûr/contient/incertain + disclaimer + avertissement humain ; `/core/compatibilite` pur ; Result discriminé)
- [Source: _bmad-output/implementation-artifacts/4-1b-detection-allergenes-corpus.md] (`detect`, `ResultatDetection`, question « liste blanche » tranchée ici)
- [Source: _bmad-output/implementation-artifacts/4-0-dictionnaire-ingredient-allergene.md] (`LIBELLES_ALLERGENES`, `AllergeneUE`, taxonomie 14)
- [Source: _bmad-output/implementation-artifacts/3-2b-assistant-restrictions-contenu.md] (`REGIMES_COURANTS`, `ALLERGENES_UE` côté participant)

## Dev Agent Record

### Agent Model Used

claude-opus-4-8 (bmad-dev-story)

### Debug Log References

- Suite complète : **190/190** ✅ (178 → 190, +12 : construireContraintes ×5, mur ×6, invariant ×1). `lint` ✅ (frontière `/core` verte), `typecheck` ✅, `SKIP_ENV_VALIDATION=1 build` ✅.
- Aucun échec ; fonctions pures, aucun mock.

### Completion Notes List

- ✅ **`mur(contraintes, detection) → VerdictMur`** (`/core/compatibilite/mur.ts`, pur) : union discriminée `{ exclu: true, raisons } | { exclu: false, incertain, raisonsIncertitude }` — jamais d'exception.
- ✅ **Exclusion DURE** sur allergène déclaré détecté (intersection `detection.allergenes ∩ allergenesInterdits`).
- ✅ **`construireContraintes`** : ALLERGIE → code via inverse de `LIBELLES_ALLERGENES` (insensible casse) ; régime-allergène (`sans gluten`→GLUTEN, `sans lactose`/`sans lait`→LAIT) → `allergenesInterdits` ; régime alimentaire / allergie libre non mappable → `incertitudes` ; **NON_AIME ignoré** (curseur 4.4).
- ✅ **Modèle 3 états** : ingrédient non reconnu / contrainte non vérifiable → `incertain: true` signalé (jamais exclusion auto, jamais « sûr » à tort). Conforme à la décision produit du 2026-06-27.
- ✅ **Invariant de sécurité (AC6)** : property-test déterministe (codes × codes) → toute recette retenue (`exclu:false`) a `detection.allergenes ∩ allergenesInterdits = ∅`.
- ✅ Exports `mur`/`construireContraintes`/types via `compatibilite/index.ts` + `src/core/index.ts`. **Pur** : importe seulement `../allergenes` (types + `LIBELLES_ALLERGENES`).
- **Hors périmètre** : régimes alimentaires (végétarien/vegan/halal/casher/porc) → story **`4-3b`** (dico ingrédient→propriété) ; curseur/resoudre → 4.4 ; composition recette→detect→mur → 4.4 ; avertissement humain → Epic 5.
- **DoD utilisateur** : `npm run test` (invariant inclus) ; sabotage de contrôle possible (retenir une recette avec allergène interdit → invariant rouge).

### File List

- `src/core/compatibilite/mur.ts` (NOUVEAU — types, `construireContraintes`, `mur`)
- `src/core/compatibilite/mur.test.ts` (NOUVEAU — unités + invariant)
- `src/core/compatibilite/index.ts` (NOUVEAU — barrel)
- `src/core/index.ts` (MODIFIÉ — exports compatibilité)

### Change Log

- 2026-06-27 : Story 4.3 implémentée — `mur()` (exclusion stricte sur allergène/régime-allergène détecté, modèle 3 états : inconnu→« incertain » signalé) + `construireContraintes` (déclaration→contraintes, NON_AIME ignoré) + invariant de sécurité testé. Décisions produit : incertain (pas exclu) sur inconnu ; régimes-allergènes seulement (alimentaires → 4.3b). 190/190, lint (boundaries)/typecheck/build verts. Statut → review.
