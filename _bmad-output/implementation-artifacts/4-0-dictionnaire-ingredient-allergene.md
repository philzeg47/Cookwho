---
baseline_commit: 90a6e3ec4b2dd5d5e27a797c7fa7177f9402f83b
---

# Story 4.0 : Dictionnaire ingrédient→allergène (source, schéma & seed)

Status: done

## Story

As a moteur de sécurité,
I want un dictionnaire d'allergènes alimenté et tracé,
so that la détection a une base de vérité fiable et auditable. (FR13, NFR3 — story bloquante)

## Acceptance Criteria

1. **Given** le besoin de couvrir les **14 allergènes réglementaires UE** et leurs dérivés, **When** je constitue le dictionnaire, **Then** une **taxonomie canonique** des 14 allergènes UE existe dans `/core/allergenes/` (codes stables + libellés FR).
2. **Given** le mécanisme « dictionnaire maison » (addendum PRD), **When** je l'implémente, **Then** le dictionnaire est un **module de données versionné dans `/core` (zéro I/O)** — `ingrédient (forme normalisée) → allergène(s)/dérivés` — **pas** une table Prisma (la pureté `/core` l'interdit).
3. **Given** l'auditabilité (NFR3), **When** je regarde une entrée, **Then** chaque entrée porte une **provenance tracée** (ex. « UE 1169/2011 Annexe II » ou « maison ») — champ non vide.
4. **Given** le besoin de couverture, **When** je lance les tests, **Then** un test vérifie que **les 14 allergènes UE sont chacun couverts** par ≥ 1 entrée du dictionnaire, et que la taxonomie compte **exactement 14** codes.
5. **Given** la cohérence produit, **When** je compare au front participant, **Then** un test garantit que les **libellés** de la taxonomie `/core` correspondent à la liste `ALLERGENES_UE` déclarable côté participant (`src/lib/restrictions.ts`) — pas de dérive entre « ce que le participant déclare » et « ce que le moteur détecte ».
6. **Given** le seed dev/CI, **When** je build, **Then** le dictionnaire est **disponible pour le dev et la CI** par le simple versionnement du module (aucun seed DB requis), exporté depuis `src/core/index.ts`.
7. **Given** la frontière `/core` (architecture), **When** je lance `npm run lint`, **Then** la règle de boundaries reste verte : le module n'importe **ni** `/server` **ni** `/app` **ni** Prisma. `npm run test`, `lint`, `typecheck`, `SKIP_ENV_VALIDATION=1 build` → tout vert.

## Tasks / Subtasks

- [x] **Tâche 1 — Taxonomie canonique des 14 allergènes UE** (AC: 1, 5)
  - [x] Créer `src/core/allergenes/allergenes-ue.ts` :
    - `type AllergeneUE` = union de 14 codes `SCREAMING_SNAKE` : `GLUTEN`, `CRUSTACES`, `OEUFS`, `POISSON`, `ARACHIDES`, `SOJA`, `LAIT`, `FRUITS_A_COQUE`, `CELERI`, `MOUTARDE`, `SESAME`, `SULFITES`, `LUPIN`, `MOLLUSQUES`.
    - `ALLERGENES_UE_CODES: readonly AllergeneUE[]` (les 14 codes).
    - `LIBELLES_ALLERGENES: Record<AllergeneUE, string>` → libellés FR **identiques** aux entrées de `ALLERGENES_UE` (`src/lib/restrictions.ts`) : Gluten, Crustacés, Œufs, Poisson, Arachides, Soja, Lait, Fruits à coque, Céleri, Moutarde, Sésame, Sulfites, Lupin, Mollusques.

- [x] **Tâche 2 — Convention de clé normalisée** (AC: 2)
  - [x] Documenter (commentaire en tête de `dictionnaire.ts`) la **forme normalisée** des clés `ingredient` : minuscules, **sans accents/diacritiques**, espaces simples, singulier privilégié. Cette forme est le contrat que `normalize()` (story 4.1) devra produire pour matcher. **4.0 stocke les clés déjà sous cette forme** (ne pas implémenter `normalize()` ici).

- [x] **Tâche 3 — Modèle de données du dictionnaire** (AC: 2, 3)
  - [x] Créer `src/core/allergenes/dictionnaire.ts` :
    ```ts
    export type EntreeDictionnaire = {
      ingredient: string;          // clé normalisée (cf. convention Tâche 2)
      allergenes: AllergeneUE[];   // ≥ 1
      provenance: string;          // non vide — ex. "UE 1169/2011 Annexe II", "maison"
    };
    export const DICTIONNAIRE_ALLERGENES: readonly EntreeDictionnaire[] = [ ... ];
    ```
  - [x] **Module PUR** : aucun import `~/server`, `~/app`, `~/trpc`, Prisma.

- [x] **Tâche 4 — Peupler le dictionnaire maison (≥14 couverts + dérivés)** (AC: 3, 4)
  - [x] Remplir `DICTIONNAIRE_ALLERGENES` avec des entrées maison couvrant **chacun** des 14 allergènes via leurs ingrédients/dérivés courants (français). Exemples indicatifs (à compléter raisonnablement, pas exhaustivement) :
    - GLUTEN : `ble`, `farine de ble`, `seigle`, `orge`, `avoine`, `pates`, `pain`, `chapelure`, `semoule`
    - CRUSTACES : `crevette`, `gambas`, `crabe`, `homard`, `langoustine`, `ecrevisse`
    - OEUFS : `oeuf`, `jaune d'oeuf`, `blanc d'oeuf`, `mayonnaise`
    - POISSON : `poisson`, `saumon`, `thon`, `cabillaud`, `anchois`, `sauce nuoc-mam`
    - ARACHIDES : `arachide`, `cacahuete`, `huile d'arachide`, `beurre de cacahuete`
    - SOJA : `soja`, `sauce soja`, `tofu`, `edamame`, `lecithine de soja`
    - LAIT : `lait`, `beurre`, `creme`, `fromage`, `yaourt`, `caseine`, `lactose`
    - FRUITS_A_COQUE : `amande`, `noisette`, `noix`, `noix de cajou`, `pistache`, `noix de pecan`, `noix de macadamia`
    - CELERI : `celeri`, `celeri-rave`, `sel de celeri`
    - MOUTARDE : `moutarde`, `graines de moutarde`
    - SESAME : `sesame`, `graines de sesame`, `tahin`, `huile de sesame`
    - SULFITES : `sulfites`, `anhydride sulfureux`, `vin`, `vinaigre de vin`
    - LUPIN : `lupin`, `farine de lupin`
    - MOLLUSQUES : `moule`, `huitre`, `calamar`, `poulpe`, `seiche`, `coquille saint-jacques`, `escargot`
  - [x] Chaque entrée a une `provenance` non vide. Convention : « UE 1169/2011 Annexe II » pour le rattachement réglementaire de l'allergène ; « maison » pour les dérivés/heuristiques ajoutés à la main.

- [x] **Tâche 5 — Exports `/core`** (AC: 6)
  - [x] Exporter la taxonomie + le dictionnaire depuis `src/core/index.ts` (remplacer/compléter le placeholder). `src/core/allergenes/index.ts` (barrel) optionnel.
  - [x] Mettre à jour `src/core/README.md` : `allergenes/` n'est plus « à venir » (taxonomie + dictionnaire livrés ; `normalize`/`detect` en 4.1).

- [x] **Tâche 6 — Tests (gate de couverture)** (AC: 4, 5, 7)
  - [x] `src/core/allergenes/dictionnaire.test.ts` :
    - `ALLERGENES_UE_CODES.length === 14` et pas de doublon.
    - **Chaque** code UE apparaît dans `allergenes` d'au moins une entrée (couverture des 14).
    - Chaque entrée : `allergenes.length >= 1`, `provenance` non vide (trim), `ingredient` non vide.
    - Pas de clé `ingredient` en double.
    - (Sécurité de forme) chaque clé respecte la convention normalisée : `=== ingredient.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase()` (pas d'accent, minuscules).
  - [x] `src/core/allergenes/allergenes-ue.test.ts` (ou dans le même fichier) : l'ensemble des `LIBELLES_ALLERGENES` (valeurs) **égale** l'ensemble de `ALLERGENES_UE` de `~/lib/restrictions` (AC5 — pas de dérive front/moteur). *(Import autorisé : `~/lib` n'est pas dans les patterns interdits du `/core`.)*

- [x] **Tâche 7 — Validations** (AC: 7)
  - [x] `npm run test`, `lint` (boundaries `/core` vertes), `typecheck`, `SKIP_ENV_VALIDATION=1 npm run build` → tout vert.

## Dev Notes

### ⚠️ Pièges critiques (lire avant de coder)

1. **`/core` est PUR — zéro I/O (frontière la plus importante).** Le dictionnaire est un **module de données TypeScript versionné**, pas une table Prisma. La règle ESLint `no-restricted-imports` (sur `src/core/**`) fait échouer le lint si tu importes `~/server`, `~/app`, `~/trpc` ou Prisma. Ne **rien** importer de la périphérie dans `dictionnaire.ts`/`allergenes-ue.ts`.

2. **Provenance = exigence d'auditabilité (NFR3), pas décoratif.** Chaque entrée trace d'où vient le mapping. Convention : « UE 1169/2011 Annexe II » (les 14 allergènes sont réglementaires) pour l'ancrage, « maison » pour les dérivés ajoutés à la main. Le test exige `provenance` non vide.

3. **Clés déjà normalisées — mais `normalize()` est en 4.1.** Stocke les `ingredient` sous la forme cible (minuscules, sans accents) pour que le `normalize()` de la story 4.1 produise des clés qui matchent. Ne **pas** implémenter `normalize()`/`detect()` ici (périmètre 4.1). Documente la convention en tête de fichier.

4. **« Dans le doute on exclut » = 4.1, pas 4.0.** Cette story ne fait **aucune détection** ni gestion d'ingrédient inconnu. Elle livre **les données** + la taxonomie + le gate de couverture. La logique `detect()` (tokens délimités, ingrédient inconnu → potentiellement allergène) est la story 4.1.

5. **Anti-pattern `includes()` — à NE PAS introduire ici (mais le savoir).** L'architecture interdit `includes()` pour la détection (« ail » ⊄ « volaille ») : le match se fera sur **tokens délimités** en 4.1. En 4.0, on ne fait que définir les clés ; veille juste à ce que les clés soient des ingrédients/dérivés propres (pas des fragments).

6. **Cohérence front/moteur (AC5).** Le participant déclare ses allergies depuis `ALLERGENES_UE` (`src/lib/restrictions.ts`, 14 libellés). Le moteur détecte vers la **même** taxonomie. Le test d'égalité des libellés empêche la dérive — si quelqu'un ajoute un 15ᵉ allergène d'un côté, la CI casse. (La **liaison** déclaration↔détection au moment du « mur » est la story 4.3 ; ici on garantit juste l'alignement des libellés.)

### État réel du projet (vérifié)

- **`src/core/`** existe : `index.ts` (placeholder `CORE_PLACEHOLDER`), `core.test.ts`, `README.md`. Dossier `allergenes/` **à créer**.
- **Règle ESLint boundaries** active (`eslint.config.js`) sur `src/core/**` : interdit `~/server`, `~/app`, `~/trpc`, `@prisma/client`, `**/server/**`, `**/app/**`. (`~/lib` **autorisé**.)
- **`src/lib/restrictions.ts`** : `ALLERGENES_UE` = 14 libellés FR (`["Gluten","Crustacés","Œufs","Poisson","Arachides","Soja","Lait","Fruits à coque","Céleri","Moutarde","Sésame","Sulfites","Lupin","Mollusques"]`) — la **liste déclarable** côté participant. C'est la référence de l'AC5.
- **Vitest** : tests co-localisés `*.test.ts`. Le `/core` est prioritaire en couverture (corpus d'or = gate CI, architecture). Aucun mock nécessaire (module pur, aucune dépendance).
- **Convention de langue** : termes métier FR (`allergenes`, `provenance`), code générique EN. Codes d'allergènes en `SCREAMING_SNAKE`.

### Périmètre — hors de cette story

- **`normalize()` + `detect()`** (texte libre → `{allergenes, ingredientsNonReconnus}`, tokens délimités, « dans le doute on exclut », corpus d'or annoté + gate CI asymétrique) → **story 4.1** (découpée 4.1a/4.1b/4.1c).
- **Mur / curseur / resoudre** → stories 4.3+.
- **Source de recettes + cache** → story 4.2.
- **Enrichissement Open Food Facts** → **différé**, hors-ligne, post-V1 (architecture). 4.0 = **dictionnaire maison** uniquement.
- **Liaison déclaration participant ↔ allergène détecté** (au moment du mur) → story 4.3.

### Décisions tranchées (réponses aux questions ouvertes de l'AC)

- **Provenance : maison.** Conforme à l'addendum PRD (« dictionnaire maison »). Open Food Facts = enrichissement hors-ligne différé, **pas** une dépendance runtime. Chaque entrée garde un champ `provenance` qui permettra un enrichissement tracé ultérieur.
- **Stockage : module `/core` versionné, pas Prisma.** Imposé par la pureté `/core` (zéro I/O) + le rôle de gate CI du corpus. Le « seed » est le versionnement du module (aucune migration, aucun seed DB).

### Testing standards

- **Vitest**, environnement par défaut (module pur ; pas besoin de `@vitest-environment node` ni de mocks).
- **Tests = gate de couverture** : les 14 allergènes couverts, taxonomie = 14, provenance non vide, clés normalisées, cohérence avec `ALLERGENES_UE`.
- Co-localiser dans `src/core/allergenes/`.

### Definition of Done manuelle (utilisateur, hors agent)

1. `npm run test` vert, dont le test « 14 allergènes UE couverts ».
2. Ouvrir `src/core/allergenes/dictionnaire.ts` → entrées lisibles, provenance présente, clés sans accents.
3. `npm run lint` vert (la frontière `/core` n'est pas violée).

### Project Structure Notes

- **Nouveaux** : `src/core/allergenes/allergenes-ue.ts`, `src/core/allergenes/dictionnaire.ts`, `src/core/allergenes/dictionnaire.test.ts` (+ éventuel `allergenes-ue.test.ts`), `src/core/allergenes/index.ts` (barrel, optionnel).
- **Modifiés** : `src/core/index.ts` (exports), `src/core/README.md` (statut `allergenes/`).
- **Aucune** migration Prisma, **aucune** nouvelle dépendance, **aucun** I/O.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 4.0] (énoncé + AC : ≥14 UE, provenance tracée, seed, test de couverture, provenance à trancher)
- [Source: _bmad-output/planning-artifacts/prds/.../addendum.md#Couche allergènes interne] (dictionnaire **maison**, ≥14 UE, « dans le doute on exclut », indépendance de la source)
- [Source: _bmad-output/planning-artifacts/architecture.md#Domain Core (/core)] (`allergenes/` : normalize, dictionnaire, detect ; pur sans I/O ; corpus d'or = gate CI)
- [Source: _bmad-output/planning-artifacts/architecture.md#Enforcement Guidelines] (jamais `includes()` pour détecter ; match sur tokens ; /core n'importe pas /server,/app)
- [Source: src/core/README.md] (frontière `/core` PUR, règle ESLint) ; [Source: src/lib/restrictions.ts] (`ALLERGENES_UE` — 14 libellés participant)

## Dev Agent Record

### Agent Model Used

claude-opus-4-8 (bmad-dev-story)

### Debug Log References

- Suite complète : **124/124** ✅ (116 → 124, +8 : taxonomie ×3, dictionnaire ×5). `lint` ✅ (**frontière `/core` verte** — aucun import périphérie), `typecheck` ✅, `SKIP_ENV_VALIDATION=1 build` ✅.
- Aucun échec ; aucun mock nécessaire (modules purs).

### Completion Notes List

- ✅ **Taxonomie canonique** (`src/core/allergenes/allergenes-ue.ts`) : `type AllergeneUE` (14 codes `SCREAMING_SNAKE`), `ALLERGENES_UE_CODES` (ordre Annexe II), `LIBELLES_ALLERGENES` (libellés FR).
- ✅ **Dictionnaire maison** (`dictionnaire.ts`) : `EntreeDictionnaire { ingredient, allergenes[], provenance }` ; ~80 entrées couvrant **les 14 allergènes** + dérivés courants (FR). Clés **déjà normalisées** (minuscules, sans accents — contrat pour `normalize()` de 4.1). Provenance tracée : « UE 1169/2011 Annexe II » (réglementaire) / « maison » (dérivés/heuristiques). Une entrée multi-allergène (`surimi` → POISSON + CRUSTACES).
- ✅ **Module 100 % PUR** : `/core/allergenes` n'importe que `./allergenes-ue` (type). Exports via `src/core/index.ts` + barrel `allergenes/index.ts`. Placeholder `CORE_PLACEHOLDER` conservé (test socle inchangé).
- ✅ **Tests = gate de couverture** : 14 codes (sans doublon), chaque allergène couvert ≥1 entrée, provenance/ingrédient non vides, clés sous forme normalisée, pas de clé en double, **test anti-dérive** : les libellés `/core` === la liste `ALLERGENES_UE` déclarable côté participant (importée dans le test uniquement — autorisé par la règle de boundaries).
- **Décisions tranchées** : dictionnaire **maison** (OFF = enrichissement hors-ligne différé) ; **module `/core` versionné, pas Prisma** (pureté `/core` + gate CI). Aucune migration, aucun seed DB, aucune dépendance.
- **Hors périmètre (4.1)** : `normalize()` + `detect()` (tokens délimités, « dans le doute on exclut »), corpus d'or annoté + gate CI asymétrique.
- **À faire par l'utilisateur (DoD)** : `npm run test` (dont « 14 allergènes couverts »), ouvrir `dictionnaire.ts` (entrées lisibles, provenance, clés sans accents), `npm run lint` vert.

### File List

- `src/core/allergenes/allergenes-ue.ts` (NOUVEAU — taxonomie 14 UE)
- `src/core/allergenes/dictionnaire.ts` (NOUVEAU — dictionnaire maison + type)
- `src/core/allergenes/dictionnaire.test.ts` (NOUVEAU — gate de couverture + anti-dérive)
- `src/core/allergenes/index.ts` (NOUVEAU — barrel)
- `src/core/index.ts` (MODIFIÉ — exports allergènes, placeholder conservé)
- `src/core/README.md` (MODIFIÉ — statut `allergenes/`)

### Change Log

- 2026-06-26 : Story 4.0 implémentée — taxonomie des 14 allergènes UE + dictionnaire maison `ingrédient → allergène(s)` avec provenance tracée, dans `/core` (pur, zéro I/O). Tests = gate de couverture (14 couverts) + anti-dérive avec la liste participant. 124/124, lint (boundaries)/typecheck/build verts. Statut → review.
