---
baseline_commit: e2e8f5b8ac753f713dc0f2f340c358692db757c9
---

# Story 4.3b : Régimes alimentaires (dico ingrédient→propriété)

As a participant au régime alimentaire (végétarien, vegan, pescétarien, sans porc),
I want que le menu respecte mon régime,
so that je peux manger sereinement. (FR9, complète le mur 4.3)

Status: done

## Story

Le mur (4.3) exclut déjà sur allergènes + régimes-allergènes (sans gluten→GLUTEN, sans lactose→LAIT). 4.3b ajoute les **régimes alimentaires de classe d'aliment** via un **dictionnaire ingrédient→propriété** (viande, porc, poisson, fruits de mer, produit animal) : **végétarien, vegan, pescétarien, sans porc**. Halal/Casher sont **différés** (impossible de certifier l'abattage/préparation depuis les seuls ingrédients) → ils restent « incertain » via le mécanisme existant.

## Acceptance Criteria

1. **Given** un participant **sans porc**, **When** une recette contient un ingrédient porcin détecté (porc, jambon, lardons, bacon, chorizo, saucisson…), **Then** le mur **exclut** la recette (raison régime alimentaire « porc »).
2. **Given** un participant **pescétarien**, **When** une recette contient de la **viande terrestre** (bœuf, porc, volaille, agneau…), **Then** le mur **exclut** ; mais une recette au **poisson/fruits de mer** reste autorisée.
3. **Given** un participant **végétarien**, **When** une recette contient **viande OU poisson OU fruits de mer**, **Then** le mur **exclut** ; les produits laitiers/œufs restent autorisés.
4. **Given** un participant **vegan**, **When** une recette contient un **produit animal** (viande, poisson, fruits de mer, lait, fromage, beurre, œuf, miel, gélatine…), **Then** le mur **exclut**.
5. **Given** un régime alimentaire déclaré, **When** une recette contient un ingrédient **non reconnu** par le dictionnaire de propriétés, **Then** elle est marquée **incertain** (jamais présentée conforme à tort, modèle 3 états) — pas exclue, pas « sûre ».
6. **Given** la détection des propriétés, **When** je classe un ingrédient, **Then** j'utilise un **dictionnaire maison** `ingredient→propriétés[]` + le **matcher par tokens** partagé (`/core/texte`, jamais `includes()` : « ail » ⊄ « volaille »). La détection est pure, déterministe, et validée par un **corpus d'or** (gate CI asymétrique, comme 4.1b).
7. **Given** Halal/Casher (différés), **When** ils sont déclarés, **Then** ils restent traités en **incertitude** (« régime non évalué ») via le mécanisme existant — **aucune** exclusion ni prétention de conformité.
8. **Given** l'échec explicatif (4.6), **When** un régime alimentaire bloque des recettes, **Then** `contraintesBloquantes` le **nomme** (type `REGIME_ALIMENTAIRE`, libellé FR de la propriété, compte).
9. **Given** la pureté `/core` + la sécurité, **When** j'intègre tout ça, **Then** `/core` reste PUR ; le mur (allergènes 4.3, curseur, dégradation 4.5, échec 4.6, génération 4.7) **ne régresse pas** ; `npm run test`, `lint`, `typecheck`, `SKIP_ENV_VALIDATION=1 build` restent verts.

## Tasks / Subtasks

- [x] **Tâche 1 — Taxonomie des propriétés** (AC: 1-4, 6)
  - [x] Nouveau module `src/core/regimes/proprietes.ts` :
    - `ProprieteAlimentaire = "VIANDE" | "PORC" | "POISSON" | "FRUITS_DE_MER" | "PRODUIT_ANIMAL"`.
    - `LIBELLES_PROPRIETES: Record<ProprieteAlimentaire, string>` (FR : « viande », « porc », « poisson », « fruits de mer », « produit animal »).
    - `REGIMES_VERS_PROPRIETES: Record<string, ProprieteAlimentaire[]>` (libellé minuscule → propriétés interdites) :
      - `"sans porc": ["PORC"]`
      - `"pescetarien"/"pescétarien": ["VIANDE"]`
      - `"vegetarien"/"végétarien": ["VIANDE", "POISSON", "FRUITS_DE_MER"]`
      - `"vegan": ["VIANDE", "POISSON", "FRUITS_DE_MER", "PRODUIT_ANIMAL"]`
    - Note : un ingrédient porcin porte **`PORC` ET `VIANDE`** (ainsi « sans porc » exclut le porc, « pescétarien/végétarien/vegan » l'excluent aussi via VIANDE).

- [x] **Tâche 2 — Dictionnaire propriétés + détection + corpus** (AC: 1-6) — **corpus-first**
  - [x] `DICTIONNAIRE_PROPRIETES` (`proprietes.ts`) : entrées `{ ingredient, proprietes }` couvrant viandes (bœuf, porc, jambon, lardons, bacon, chorizo, saucisson, merguez, poulet, dinde, canard, agneau, veau, gibier, gélatine…), poissons (saumon, thon, cabillaud, colin, sardine…), fruits de mer (crevette, moule, huître, calmar, gambas…), produits animaux (lait, beurre, crème, fromage, yaourt, œuf, miel, gélatine…). Curaté, normalisé via `normalize`.
  - [x] `detecterProprietes(ingredients: string[]): ResultatProprietes` où `ResultatProprietes = { proprietes: ProprieteAlimentaire[]; ingredientsNonReconnus: string[] }` — match par **ligne** via `contientTokens`/`tokeniser` (`../texte`), même mécanique que `detect` (allergènes). Dédupliqué, déterministe.
  - [x] **Fixtures corpus d'or** `src/core/regimes/fixtures/ingredients-regimes.json` + `regimes.corpus.test.ts` : gate **asymétrique** (`arrayContaining`) — chaque cas annoté doit voir ses propriétés détectées (un faux négatif = build rouge). Couvrir les pièges (« volaille » ≠ « ail », « surimi » = poisson/fruits de mer, « lait de coco » ≠ produit animal — décision : lait de coco N'EST PAS un produit animal).

- [x] **Tâche 3 — Contraintes : mapper les régimes alimentaires** (AC: 1-5, 7)
  - [x] `mur.ts` : `Contraintes` gagne `proprietesInterdites: ProprieteAlimentaire[]` et `regimesAlimentaires: boolean` (vrai si ≥1 régime alimentaire des 4 est déclaré → pilote l'incertitude AC5).
  - [x] `construireContraintes` : pour un `REGIME`, tester `REGIMES_VERS_PROPRIETES` AVANT le fallback incertitude. Mapping trouvé → ajouter les propriétés + `regimesAlimentaires = true`. `REGIMES_VERS_ALLERGENE` (gluten/lait) **inchangé**. Halal/Casher/inconnu → `incertitudes` (« régime non évalué », inchangé, AC7).

- [x] **Tâche 4 — Mur : exclure sur propriété + incertitude régime** (AC: 1-5, 8)
  - [x] `RaisonExclusion` : ajouter la variante propriété → `{ type: "ALLERGIE"|"REGIME"; allergene: AllergeneUE } | { type: "REGIME_ALIMENTAIRE"; propriete: ProprieteAlimentaire; libelle: string }`.
  - [x] `mur(contraintes, detection, proprietes?)` : 2ᵉ détection optionnelle `proprietes: ResultatProprietes` (défaut `{ proprietes: [], ingredientsNonReconnus: [] }` → **rétro-compatible**). Exclure si `proprietesInterdites ∩ proprietes.proprietes` non vide (raisons `REGIME_ALIMENTAIRE`). Incertitude **en plus** : si `regimesAlimentaires` et `proprietes.ingredientsNonReconnus` non vide → ajouter une raison d'incertitude (« ingrédient(s) non classé(s) pour le régime : … »).
  - [x] **Ordre/priorité** : une recette est `exclu` si **allergène OU propriété** interdits ; l'incertitude ne s'applique que si non exclue (inchangé).

- [x] **Tâche 5 — Propager au pipeline (resoudre / 4.6 / génération)** (AC: 5, 8, 9)
  - [x] `resoudre.ts` : `RecetteEntree` gagne `detectionProprietes?: ResultatProprietes` (optionnel, défaut vide → rétro-compatible). `resoudre` passe `r.detectionProprietes` à `mur`.
  - [x] **Généraliser `ContrainteBloquante`** : `allergene: AllergeneUE` → `cle: string` (code allergène **ou** propriété) + `type: "ALLERGIE"|"REGIME"|"REGIME_ALIMENTAIRE"` + `libelle` + `recettesBloquees`. Agréger les raisons `REGIME_ALIMENTAIRE` comme les autres. **Mettre à jour les tests 4.6** (la forme change : `allergene`→`cle`).
  - [x] `src/server/generation.ts` : calculer `detecterProprietes(r.ingredientsTexte)` par recette et le passer dans `detectionProprietes` de chaque `RecetteEntree`.

- [x] **Tâche 6 — Exports** (AC: 9)
  - [x] `src/core/regimes/index.ts` (barrel) + ré-exports dans `src/core/index.ts` : `ProprieteAlimentaire`, `LIBELLES_PROPRIETES`, `DICTIONNAIRE_PROPRIETES`, `REGIMES_VERS_PROPRIETES`, `detecterProprietes`, `ResultatProprietes`.

- [x] **Tâche 7 — Tests + validations** (AC: tous)
  - [x] `proprietes.test.ts` (détection unitaire) + `regimes.corpus.test.ts` (gate d'or).
  - [x] `mur.test.ts` : exclusion sans porc / pescétarien (poisson OK) / végétarien / vegan ; incertitude sur ingrédient non classé + régime déclaré ; halal/casher → incertitude (pas d'exclusion).
  - [x] `resoudre.test.ts` : `contraintesBloquantes` nomme un régime alimentaire (`REGIME_ALIMENTAIRE`, libellé) ; forme `cle` mise à jour.
  - [x] `generation.test.ts` : bout-en-bout, un participant végétarien exclut une recette à la viande.
  - [x] **Non-régression** : tout l'existant (allergènes, curseur, dégradation, échec, forcée) reste vert.
  - [x] `npm run test`, `lint`, `typecheck`, `SKIP_ENV_VALIDATION=1 build` → tout vert.

### Review Findings

> Revue de code adversariale du 2026-06-28 (3 couches), story 4.3b, diff depuis `e2e8f5b`. Verdict : **9/9 ACs satisfaits**, pureté `/core` OK, modèle 3 états (sûr/incertain/exclu) testé. Findings réels : 5 patches (2 direction non-sûre, 1 correction, 2 UX/sur-exclusion) · 1 note.

- [x] [Review][Patch] **[Med — direction non-sûre]** Neutralisation lait végétal **par ligne** → produit laitier réel d'une même ligne supprimé. **Corrigé** : `indexDeTokens` (nouveau, `texte.ts`) + **retrait du span** de la locution végétale avant détection ; un vrai laitier sur la même ligne reste détecté (+ test). [src/core/regimes/proprietes.ts, src/core/texte.ts]
- [x] [Review][Patch] **[Med — direction non-sûre]** `saucisse` → `[PORC, VIANDE]` (conservateur, « sans porc » l'exclut) ; `merguez` reste VIANDE. + test. [src/core/regimes/proprietes.ts]
- [x] [Review][Patch] **[Med — correction]** Collision `blocages` POISSON allergène/propriété → **clé Map namespacée par type** (`${type}:${cle}`), code brut conservé dans `cle`. + test (les 2 contraintes nommées). [src/core/compatibilite/resoudre.ts]
- [x] [Review][Patch] **[Low — sur-exclusion]** `lieu` nu retiré → `lieu noir`/`lieu jaune` ; plus de faux match sur « au lieu de ». + test. [src/core/regimes/proprietes.ts]
- [x] [Review][Patch] **[Low — sur-exclusion]** Laits végétaux ajoutés (cajou/chanvre/épeautre) à `LAITS_VEGETAUX`. + test. [src/core/regimes/proprietes.ts]
- [x] [Review][Note] Le gate corpus est asymétrique (faux négatif = rouge) ; les protections anti-faux-positifs (« ail » ⊄ « volaille », lait de coco) vivent en tests unitaires, pas dans le corpus data-driven. Conforme au design (« faux positifs ne cassent pas le build »). Curation continue possible.

## Dev Notes

### ⚠️ Pièges critiques (lire avant de coder)

1. **Modèle 3 états — ne JAMAIS prétendre conforme à tort (AC5/AC7).** Pour un régime alimentaire, un ingrédient non reconnu par le dico de propriétés → **incertain**, pas « sûr ». Halal/Casher → toujours incertitude (jamais d'exclusion ni de prétention). C'est la règle de sécurité du mur, étendue aux régimes.

2. **`PORC` porte AUSSI `VIANDE`.** Un ingrédient porcin doit avoir les deux propriétés, sinon « pescétarien/végétarien/vegan » laisseraient passer le porc (ils interdisent VIANDE, pas PORC). Vérifier dans le dico + un test.

3. **Deux détections séparées, deux `ingredientsNonReconnus`.** La détection **allergènes** (4.1b) reste inchangée avec SON `ingredientsNonReconnus` (incertitude allergie). La détection **propriétés** a le SIEN (incertitude régime). Ne PAS fusionner : un ingrédient connu du dico allergènes mais inconnu du dico propriétés doit déclencher l'incertitude **régime** (et vice-versa). Le mur reçoit les deux.

4. **Rétro-compatibilité du mur et de resoudre.** `mur(contraintes, detection, proprietes?)` : 3ᵉ param optionnel défaut vide ; `RecetteEntree.detectionProprietes?` optionnel défaut vide. Ainsi tous les tests/appels existants sans régime alimentaire restent verts. `proprietesInterdites: []` + `regimesAlimentaires: false` → comportement identique à aujourd'hui.

5. **`ContrainteBloquante` change de forme (4.6).** `allergene: AllergeneUE` → `cle: string` (généralise allergène **et** propriété) + `type` élargi. Les tests 4.6 qui asserten­t `allergene: "ARACHIDES"` deviennent `cle: "ARACHIDES"`. Chercher toute assertion et l'adapter. C'est un changement de forme assumé (comme 4.7 a élargi le retour serveur).

6. **Corpus-first (sécurité).** Écrire les fixtures annotées AVANT/avec le dico, gate asymétrique `arrayContaining` (faux négatif = rouge). Décisions de bord à trancher dans le corpus : « lait de coco »/« lait d'amande » **≠** produit animal ; « surimi » = poisson ; « bouillon de volaille » = viande ; gélatine = produit animal (et viande ? non — gélatine = PRODUIT_ANIMAL, pas VIANDE, sauf si tu veux l'exclure aussi pour végétarien → la mettre VIANDE+PRODUIT_ANIMAL pour que végétarien la rejette). **Décision retenue : gélatine = VIANDE + PRODUIT_ANIMAL** (origine animale carnée) → rejetée par végétarien ET vegan.

7. **Périmètre = ces 4 régimes.** Halal/Casher différés (tracer dans `deferred-work.md`). Pas d'UI (Epic 5). `/core` pur ; nouveau sous-domaine `core/regimes/` (miroir de `core/allergenes/`).

### État réel du projet (vérifié)

- **Régimes déclarables** (`src/lib/restrictions.ts`, `REGIMES_COURANTS`) : Végétarien, Vegan, Pescétarien, Sans gluten, Sans lactose, Sans porc, Halal, Casher. 4.3 mappe déjà sans gluten/sans lactose sur allergènes. 4.3b ajoute Végétarien/Vegan/Pescétarien/Sans porc ; Halal/Casher différés.
- **`mur.ts`** : `construireContraintes` boucle sur les restrictions ; `REGIME` → `REGIMES_VERS_ALLERGENE` sinon incertitude. `Contraintes = { allergenesInterdits, allergiesCodes?, incertitudes }`. `mur(contraintes, detection)` exclut sur `allergenesInterdits ∩ detection.allergenes` (raisons), sinon incertitude si `incertitudes` ou `ingredientsNonReconnus`. `RaisonExclusion = { type: "ALLERGIE"|"REGIME"; allergene }`.
- **`detect`** (`core/allergenes/detect.ts`) : modèle à copier pour `detecterProprietes` (même usage de `../texte`). `ResultatDetection = { allergenes, ingredientsNonReconnus }`.
- **`/core/texte`** : `tokeniser`, `contientTokens` (matcher partagé, gère pluriels). `normalize` (allergenes) pour normaliser les clés du dico.
- **`resoudre.ts`** : `RecetteEntree.detection: ResultatDetection` ; `ContrainteBloquante { type, allergene, libelle, recettesBloquees }` (4.6) — à généraliser. Agrégation des `raisons` du mur par code.
- **`generation.ts`** : construit `detection: detect(r.ingredientsTexte)` par recette → ajouter `detecterProprietes`.
- **ESLint** `/core` (pas d'import serveur). Vitest, fonctions pures, gate corpus (modèle `core/allergenes/corpus.test.ts`).

### Périmètre — hors de cette story

- **Halal / Casher** (évaluation par propriétés) → **différés** (`deferred-work.md`) : exigent porc/alcool/fruits de mer + un modèle d'incertitude de certification ; restent « incertain » pour l'instant (AC7).
- **Affichage** (badge régime, raisons d'exclusion régime) → **Epic 5**.
- **Saisie** des régimes → déjà faite (Epic 3, `REGIMES_COURANTS`).

### Décisions tranchées

- **4 régimes** : végétarien, vegan, pescétarien, sans porc. Halal/Casher différés.
- **`PORC ⊂ VIANDE`** (un porcin porte les deux propriétés).
- **Gélatine = VIANDE + PRODUIT_ANIMAL** ; **laits végétaux ≠ produit animal**.
- **Deux détections** (allergènes / propriétés) avec incertitudes distinctes.
- **`ContrainteBloquante` généralisée** (`cle` + `type` élargi) ; mur et resoudre **rétro-compatibles** (params propriétés optionnels).
- **Corpus-first** + gate asymétrique (sécurité).

### Testing standards

- **Vitest**, fonctions pures, déterministe. Gate corpus **asymétrique** (`arrayContaining`).
- Couvrir les 4 régimes (exclusion correcte + pescétarien laisse passer le poisson) ; incertitude (ingrédient non classé + régime déclaré) ; halal/casher = incertitude ; bout-en-bout (génération).
- **Non-régression complète** : allergènes, régimes-allergènes (4.3), curseur, dégradation (4.5), échec (4.6), forcée (4.7).

### Definition of Done manuelle (utilisateur, hors agent)

1. `npm run test` vert (régimes + corpus + non-régression).
2. Sabotage de contrôle : retirer une entrée viande du dico → un cas du corpus passe au rouge ; restaurer.
3. `npm run lint` vert (frontière `/core`).

### Project Structure Notes

- **Nouveaux** : `src/core/regimes/proprietes.ts`, `index.ts`, `fixtures/ingredients-regimes.json`, `proprietes.test.ts`, `regimes.corpus.test.ts`.
- **Modifiés** : `src/core/compatibilite/mur.ts` (Contraintes + RaisonExclusion + mur), `resoudre.ts` (RecetteEntree + ContrainteBloquante), `src/core/index.ts` (exports), `src/server/generation.ts` (détection propriétés), + tests `mur.test.ts`, `resoudre.test.ts`, `generation.test.ts`.
- **Aucune** migration, **aucune** dépendance. `/core` pur.

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#Domain Core] (dico ingrédient→propriété pour les régimes alimentaires)
- [Source: _bmad-output/planning-artifacts/epics.md#FR9] (mur respecté — régimes inclus)
- [Source: _bmad-output/implementation-artifacts/4-3-filtre-du-mur.md] (mur, construireContraintes, RaisonExclusion, modèle 3 états)
- [Source: _bmad-output/implementation-artifacts/4-1b-detection-allergenes-corpus.md] (modèle dico + détection + corpus d'or asymétrique à répliquer)
- [Source: _bmad-output/implementation-artifacts/4-6-echec-explicatif.md] (`ContrainteBloquante` — à généraliser)
- [Source: src/core/allergenes/detect.ts] (modèle de `detecterProprietes`)
- [Source: src/lib/restrictions.ts] (`REGIMES_COURANTS` — régimes déclarables)

## Dev Agent Record

### Agent Model Used

claude-opus-4-8 (bmad-dev-story)

### Debug Log References

- Suite complète : **259/259** ✅ (231 → 259, +28 : module régimes ×22 [détection ×6, corpus ×16], mur régimes ×4, resoudre régime bloquant ×1, génération bout-en-bout ×1 + tests existants adaptés). `lint` ✅, `typecheck` ✅, `SKIP_ENV_VALIDATION=1 build` ✅.
- **5 ruptures attendues corrigées** : 2 tests mur « régime non évalué » (Végétarien/Vegan désormais évalués → bascule sur Halal/Casher, toujours différés) ; 3 assertions 4.6 (`allergene`→`cle`).
- Tests `/core` purs, déterministes, gate corpus asymétrique.

### Completion Notes List

- ✅ **Nouveau sous-domaine `core/regimes/`** : `ProprieteAlimentaire` (VIANDE/PORC/POISSON/FRUITS_DE_MER/PRODUIT_ANIMAL) + `LIBELLES_PROPRIETES` + `REGIMES_VERS_PROPRIETES` + `DICTIONNAIRE_PROPRIETES` (curaté) + `detecterProprietes` (matcher tokens partagé). Corpus d'or (gate asymétrique).
- ✅ **4 régimes évalués** : sans porc → PORC ; pescétarien → VIANDE (poisson OK) ; végétarien → VIANDE+POISSON+FRUITS_DE_MER ; vegan → +PRODUIT_ANIMAL. `PORC ⊂ VIANDE` (un porcin porte les deux).
- ✅ **Mur étendu** : `Contraintes` += `proprietesInterdites`/`regimesAlimentaires` (optionnels → **rétro-compatible**) ; `construireContraintes` mappe les 4 régimes (Halal/Casher/inconnu → incertitude) ; `mur(contraintes, detection, proprietes?)` exclut sur propriété (`RaisonExclusion` type `REGIME_ALIMENTAIRE`) + **incertitude 3 états** si régime déclaré + ingrédient non classé.
- ✅ **Lait végétal géré** (décision 4.3b) : « lait de coco/amande/soja… » N'EST PAS un produit animal (neutralisation ciblée de la contribution laitière générique, sans effacer fromage/œuf d'une même ligne).
- ✅ **Pipeline propagé** : `RecetteEntree.detectionProprietes?` (optionnel) ; `resoudre` passe les propriétés au mur ; `generation.ts` calcule `detecterProprietes` par recette. Bout-en-bout testé (végétarien exclut le bœuf).
- ✅ **Échec explicatif (4.6) généralisé** : `ContrainteBloquante` `allergene`→`cle` (allergène **ou** propriété) + type `REGIME_ALIMENTAIRE` → nomme aussi un blocage régime (« viande »).
- ✅ **Non-régression** : tout l'existant (allergènes, régimes-allergènes, curseur, dégradation, échec, forcée) vert.
- **Hors périmètre** : Halal/Casher par propriétés (différés, `deferred-work.md`) ; affichage (Epic 5). Substituts de viande (« steak de soja ») = sur-détection conservatrice acceptée (note de revue possible).
- **DoD utilisateur** : `npm run test`/`lint` verts ; sabotage (retirer une entrée viande → cas corpus rouge).

### File List

- `src/core/regimes/proprietes.ts` + `index.ts` + `fixtures/ingredients-regimes.json` + `proprietes.test.ts` + `regimes.corpus.test.ts` (NOUVEAUX)
- `src/core/compatibilite/mur.ts` (MODIFIÉ — Contraintes/RaisonExclusion/construireContraintes/mur) + `mur.test.ts`
- `src/core/compatibilite/resoudre.ts` (MODIFIÉ — RecetteEntree.detectionProprietes, ContrainteBloquante `cle`, agrégation) + `resoudre.test.ts`
- `src/core/index.ts` (MODIFIÉ — exports régimes)
- `src/server/generation.ts` (MODIFIÉ — détection propriétés par recette) + `generation.test.ts`

### Change Log

- 2026-06-28 : Story 4.3b implémentée — régimes alimentaires (dico ingrédient→propriété). Nouveau sous-domaine `core/regimes/` (5 propriétés + dico + détection + corpus d'or) ; mur étendu (exclusion sur propriété + incertitude 3 états, rétro-compatible) ; 4 régimes (végétarien/vegan/pescétarien/sans porc) évalués, Halal/Casher différés ; `ContrainteBloquante` généralisée (`cle`). Bout-en-bout + non-régression OK. 259/259, lint/typecheck/build verts. Statut → review.
- 2026-06-28 : Revue de code (3 couches). 9/9 ACs, pureté/3-états OK. 5 patches appliqués : neutralisation lait végétal par retrait de span (+`indexDeTokens`), `saucisse`→porc, clé `blocages` namespacée (collision POISSON), `lieu` nu retiré, laits végétaux étendus. Tests 264/264, lint/typecheck/build verts. Statut → done. **Epic 4 (moteur de sécurité & compatibilité) COMPLET.**
