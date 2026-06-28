---
baseline_commit: 280a2b1371edee19111c37249b9f25771a589bd6
---

# Story 4.6 : Échec explicatif (mur impossible)

Status: review

## Story

As an organisateur,
I want comprendre *pourquoi* aucune recette ne convient quand le mur élimine tout,
so that je sais quelle contrainte assouplir ou quel participant recontacter. (FR11)

## Acceptance Criteria

1. **Given** que moins de `min` (3) recettes passent le **mur**, **When** `resoudre` renvoie `PAS_ASSEZ`, **Then** il **nomme la/les contrainte(s) bloquante(s)** : `contraintesBloquantes: ContrainteBloquante[]` (chaque entrée = `{ type, allergene, libelle, recettesBloquees }`).
2. **Given** plusieurs contraintes en cause, **When** l'échec est renvoyé, **Then** les contraintes sont **triées par impact décroissant** (`recettesBloquees` desc, tie-break `libelle`) — la plus bloquante en premier.
3. **Given** une contrainte qui vient d'une **allergie** vs d'un **régime**, **When** elle est nommée, **Then** son `type` (`"ALLERGIE"` | `"REGIME"`) et son `libelle` (FR, via `LIBELLES_ALLERGENES`) sont corrects.
4. **Given** un échec dû à un **pool trop petit** (peu de recettes en entrée, **aucune** éliminée par le mur), **When** `resoudre` renvoie `PAS_ASSEZ`, **Then** `contraintesBloquantes` est **vide** (l'UI distingue « pas assez de recettes disponibles » de « telle contrainte bloque »).
5. **Given** la sécurité, **When** j'ajoute ce diagnostic, **Then** **rien** ne change au filtrage : le mur exclut toujours pareil, le succès (`TOUS_CONTENTS`/`DEGRADATION`) est **inchangé** ; seul le **détail de l'échec** est enrichi.
6. **Given** la compatibilité, **When** je change la variante d'échec, **Then** je mets à jour les tests/assertions qui comparaient l'**ancienne forme** de `PAS_ASSEZ` (notamment `resoudre.test.ts`, et `generation.test.ts`/`organisateur.test.ts` si concernés) ; le Result remonte tel quel jusqu'au router (aucune logique serveur nouvelle).
7. **Given** la pureté `/core` + CI, **When** je lance `npm run test`, `lint`, `typecheck`, `SKIP_ENV_VALIDATION=1 build`, **Then** tout reste vert ; le diagnostic et le cas « pool trop petit » sont testés.

## Tasks / Subtasks

- [x] **Tâche 1 — Type `ContrainteBloquante`** (AC: 1, 3)
  - [x] Dans `src/core/compatibilite/resoudre.ts`, importer `AllergeneUE` et `LIBELLES_ALLERGENES` depuis `../allergenes`.
  - [x] Définir `ContrainteBloquante = { type: "ALLERGIE" | "REGIME"; allergene: AllergeneUE; libelle: string; recettesBloquees: number }`.
  - [x] Enrichir la variante d'échec : `{ ok: false; raison: "PAS_ASSEZ"; compatibles: number; contraintesBloquantes: ContrainteBloquante[] }`.

- [x] **Tâche 2 — Agréger les exclusions du mur** (AC: 1, 2, 4)
  - [x] Dans la boucle de `resoudre`, quand `verdict.exclu` est vrai, **capturer** `verdict.raisons` (type + allergène) avant de `continue`.
  - [x] Compter, par **code allergène**, le nombre de recettes bloquées (`recettesBloquees`) en conservant `type` (provenance) + `libelle = LIBELLES_ALLERGENES[allergene]`. Une recette bloquée par 2 contraintes compte pour chacune.
  - [x] **Ne compter que les exclusions du mur** : les recettes écartées par `exclure` (régénérer) ne sont PAS des contraintes bloquantes.
  - [x] Sur `PAS_ASSEZ`, construire `contraintesBloquantes` triée par `recettesBloquees` desc, puis `libelle` (stable). Pool trop petit sans exclusion → liste vide (AC4).

- [x] **Tâche 3 — Exports** (AC: 6)
  - [x] Exporter le type `ContrainteBloquante` depuis `src/core/compatibilite/index.ts` + `src/core/index.ts`.

- [x] **Tâche 4 — Tests** (AC: 1, 2, 3, 4, 7)
  - [x] `resoudre.test.ts` :
    - **Mettre à jour** le test « renvoie PAS_ASSEZ » : l'égalité exacte doit inclure `contraintesBloquantes: []` (cas pool trop petit, aucune exclusion → AC4).
    - Échec dû à une **allergie** détectée sur la majorité des recettes → `contraintesBloquantes` nomme l'allergène (type `ALLERGIE`, libellé FR, `recettesBloquees` correct).
    - **Tri par impact** : deux contraintes d'impacts différents → la plus bloquante en premier.
    - **Provenance** : un régime-allergène (sans gluten→GLUTEN) bloquant → `type: "REGIME"`.
  - [x] Vérifier/mettre à jour `generation.test.ts` / `organisateur.test.ts` si une assertion comparait l'ancienne forme `PAS_ASSEZ`.

- [x] **Tâche 5 — Validations** (AC: 7)
  - [x] `npm run test`, `lint`, `typecheck`, `SKIP_ENV_VALIDATION=1 build` → tout vert.

## Dev Notes

### ⚠️ Pièges critiques (lire avant de coder)

1. **Ce diagnostic ne change RIEN au filtrage (AC5).** On ne touche pas à l'ordre `filtre mur → tri curseur → sélection`, ni aux deux succès `TOUS_CONTENTS`/`DEGRADATION` (story 4.5). On enrichit **uniquement** la branche `PAS_ASSEZ`. Re-vérifier que les tests de succès et l'invariant de sécurité restent verts.

2. **N'agréger que les exclusions DU MUR.** Le `continue` sur `exclus.has(r.ref)` (régénérer) arrive **avant** le mur : ces recettes ne sont pas « bloquées par une contrainte », ne pas les compter. Seules les recettes où `verdict.exclu === true` alimentent `contraintesBloquantes`.

3. **Cas « pool trop petit » = liste vide (AC4).** Si peu de recettes passent mais qu'**aucune** n'a été exclue par le mur (ex. la source n'a renvoyé que 2 recettes saines), `contraintesBloquantes` doit être **vide**. C'est la distinction clé pour l'UI : « pas assez de recettes disponibles » vs « l'allergène X bloque tout ». Ne pas inventer de contrainte dans ce cas.

4. **Changement de forme = casse d'assertions exactes.** Le test actuel fait `expect(res).toEqual({ ok: false, raison: "PAS_ASSEZ", compatibles: 2 })`. Avec le nouveau champ, il faut ajouter `contraintesBloquantes: []`. Chercher toute autre assertion `toEqual`/`toMatchObject` sur la forme d'échec (y compris serveur) et l'adapter — sinon rouge.

5. **Compter par code, garder un seul `type`/`libelle` par code.** Un même code allergène a une provenance fixe (`codesAllergie` de `construireContraintes`), donc un seul `type`. Agréger dans une `Map<AllergeneUE, {type, recettesBloquees}>` puis matérialiser `libelle` via `LIBELLES_ALLERGENES`.

6. **Périmètre = diagnostic d'échec uniquement.** Pas de génération forcée (4.7), pas d'UI (Epic 5), pas de régimes alimentaires (4.3b). `resoudre` reste pur `/core`.

### État réel du projet (vérifié — acquis 4.4a/4.5)

- **`resoudre`** (`src/core/compatibilite/resoudre.ts`) : ordre `exclure → mur → curseur → tri → sélection`. Renvoie `{ ok: true; mode: "TOUS_CONTENTS"|"DEGRADATION"; recettes }` (4.5) | `{ ok: false; raison: "PAS_ASSEZ"; compatibles: number }`. **C'est cette dernière variante que 4.6 enrichit.**
- **`mur`** (`mur.ts`) : verdict discriminé. La branche `{ exclu: true; raisons: RaisonExclusion[] }` fournit `raisons` = `{ type: "ALLERGIE"|"REGIME"; allergene: AllergeneUE }[]` — **exactement** ce qu'il faut agréger. `construireContraintes` étiquette la provenance (`allergiesCodes`) → `type` correct (patch revue).
- **`LIBELLES_ALLERGENES`** (`../allergenes`) : `Record<AllergeneUE, string>` (libellés FR) — déjà importé par `mur.ts`, l'importer aussi dans `resoudre.ts`.
- **4.4b / serveur** : `genererPourRepas` renvoie `resoudre(...)` tel quel ; la procédure tRPC aussi. **Aucune logique serveur nouvelle** (le champ remonte automatiquement). Vérifier seulement les assertions de test.
- Règle ESLint `/core` (pas d'import `~/server`…). Vitest, fonctions pures.

### Périmètre — hors de cette story

- **Génération forcée** (générer malgré des réponses partielles, lister les non-couverts) → **story 4.7**.
- **Affichage** du message d'échec et des contraintes bloquantes → **Epic 5** (4.6 fournit la donnée structurée).
- **Régimes alimentaires** (végétarien/vegan/halal/casher) → **story 4.3b**.
- Toute reformulation « humaine » / i18n du message → côté présentation (Epic 5).

### Décisions tranchées

- **Une raison d'échec** (`PAS_ASSEZ`) enrichie d'un **diagnostic structuré** (`contraintesBloquantes`), plutôt qu'une nouvelle `raison`. Plus simple, additif, et `contraintesBloquantes: []` couvre le cas « pool trop petit ».
- **Comptage par code allergène** (type + libellé + nb de recettes bloquées), trié par impact décroissant.
- **Exclusions `exclure` non comptées** : seules les exclusions du mur sont des contraintes bloquantes.

### Testing standards

- **Vitest**, environnement par défaut, fonctions pures, déterministe.
- Couvrir : pool trop petit → liste vide ; allergène bloquant nommé + compte ; tri par impact ; provenance régime → `type: "REGIME"`.
- Non-régression : succès `TOUS_CONTENTS`/`DEGRADATION` et invariant de sécurité inchangés ; `generation`/`organisateur` verts.

### Definition of Done manuelle (utilisateur, hors agent)

1. `npm run test` vert (diagnostic + pool vide + non-régression).
2. `npm run lint` vert (frontière `/core`).
3. (Optionnel) Inspecter un `PAS_ASSEZ` réel : vérifier que la contrainte la plus bloquante est bien en tête.

### Project Structure Notes

- **Modifiés** : `src/core/compatibilite/resoudre.ts` (type + agrégation), `resoudre.test.ts` (assertion mise à jour + tests diagnostic), `index.ts` + `src/core/index.ts` (export `ContrainteBloquante`).
- **À vérifier** (probablement inchangés) : `src/server/generation.test.ts`, `organisateur.test.ts` — adapter si une assertion comparait la forme `PAS_ASSEZ`.
- **Aucune** migration, **aucune** dépendance, **aucun** I/O.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 4.6] (échec explicatif : nommer la/les contrainte(s) bloquante(s))
- [Source: _bmad-output/planning-artifacts/architecture.md#Domain Core] (`resoudre → Result` : 3-10 | dégradation | échec explicatif)
- [Source: _bmad-output/planning-artifacts/ux-designs/.../EXPERIENCE.md#State Patterns] (état d'échec : expliquer quelle contrainte bloque, sans jamais contourner le mur)
- [Source: _bmad-output/implementation-artifacts/4-4a-curseur-resoudre.md] (`resoudre`, `ResultatResolution`, variante `PAS_ASSEZ`)
- [Source: _bmad-output/implementation-artifacts/4-5-degradation-elegante.md] (`mode`, succès scindé — à ne PAS régresser)
- [Source: src/core/compatibilite/mur.ts] (`VerdictMur.exclu.raisons`, `RaisonExclusion`, provenance `allergiesCodes`)

## Dev Agent Record

### Agent Model Used

claude-opus-4-8 (bmad-dev-story)

### Debug Log References

- Suite complète : **226/226** ✅ (223 → 226, +3 : allergène nommé, tri par impact, provenance régime ; + assertion `PAS_ASSEZ` mise à jour). `lint` ✅, `typecheck` ✅, `SKIP_ENV_VALIDATION=1 build` ✅.
- **Serveur intact** : `generation.test.ts`/`organisateur.test.ts` n'asserten­t que `res.ok`/`res.recettes` — **aucune** comparaison exacte de la forme `PAS_ASSEZ`, donc aucune modif serveur. Seul `resoudre.test.ts` portait une égalité exacte (mise à jour avec `contraintesBloquantes: []`).
- Tests `/core` purs, déterministes.

### Completion Notes List

- ✅ **`ContrainteBloquante`** (`resoudre.ts`) : `{ type, allergene, libelle, recettesBloquees }`. Variante d'échec enrichie : `{ ok:false, raison:"PAS_ASSEZ", compatibles, contraintesBloquantes }`.
- ✅ **Agrégation au mur** : à chaque `verdict.exclu`, les `raisons` (type + allergène) sont comptées par code dans une `Map` (une recette compte une fois par contrainte). Trié par `recettesBloquees` desc puis `libelle`.
- ✅ **Seules les exclusions DU MUR comptent** : les recettes écartées par `exclure` (régénérer) ne sont pas des contraintes bloquantes.
- ✅ **Pool trop petit → liste vide** (AC4) : si aucune recette n'a été exclue par le mur, `contraintesBloquantes: []` → l'UI distingue « pas assez de recettes » de « telle contrainte bloque ».
- ✅ **Provenance correcte** : un régime-allergène (sans gluten→GLUTEN) est étiqueté `type: "REGIME"` ; une allergie déclarée `type: "ALLERGIE"` (via `allergiesCodes` du mur).
- ✅ **Zéro changement au filtrage** (AC5) : ordre `mur → curseur → sélection` inchangé ; succès `TOUS_CONTENTS`/`DEGRADATION` et invariant de sécurité intacts. Additif, le Result remonte tel quel via 4.4b.
- **Hors périmètre** : génération forcée (4.7), affichage (Epic 5), régimes alimentaires (4.3b).
- **DoD utilisateur** : `npm run test` vert ; `npm run lint` vert ; (option) inspecter un `PAS_ASSEZ` réel — la contrainte la plus bloquante est en tête.

### File List

- `src/core/compatibilite/resoudre.ts` (MODIFIÉ — `ContrainteBloquante`, agrégation des blocages) + `resoudre.test.ts` (assertion MAJ + 3 tests)
- `src/core/compatibilite/index.ts` + `src/core/index.ts` (MODIFIÉS — export `ContrainteBloquante`)

### Change Log

- 2026-06-28 : Story 4.6 implémentée — échec explicatif. `resoudre` enrichit la variante `PAS_ASSEZ` d'un diagnostic structuré `contraintesBloquantes` (type/allergène/libellé/nb de recettes bloquées, trié par impact), agrégé depuis les `raisons` du mur. Pool trop petit → liste vide. Changement additif (zéro modif serveur), filtrage et invariant inchangés. 226/226, lint/typecheck/build verts. Statut → review. **L'organisateur sait quelle contrainte bloque (FR11).**
