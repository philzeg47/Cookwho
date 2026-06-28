---
baseline_commit: 0fcd910
---

# Story 4.4b : Génération serveur (procédure tRPC + pipeline + régénérer)

Status: done

## Story

As an organisateur,
I want lancer la génération et obtenir une liste de plats sûrs et adaptés,
so that je choisis un plat qui plaît au groupe. (FR9, NFR2)

## Acceptance Criteria

1. **Given** une session organisateur et un repas **lui appartenant**, **When** j'appelle `organisateur.genererRecettes({ repasId })`, **Then** la procédure (protégée) charge les restrictions des participants **ayant répondu**, récupère des recettes (source/cache 4.2), exécute le pipeline `normalize+detect → mur → resoudre` (`/core`) et renvoie le **Result** (3-10 recettes, ou `PAS_ASSEZ`).
2. **Given** un repas **non possédé** (ou inexistant), **When** j'appelle la procédure, **Then** `NOT_FOUND` (frontière de sécurité : `organisateurId` vient **toujours** de la session, jamais du client).
3. **Given** chaque recette retenue, **When** elle est renvoyée, **Then** elle porte `titre`, ses **ingrédients**, et son **drapeau d'incertitude** (`incertain`/`raisonsIncertitude`) pour l'avertissement allergie (FR16, Epic 5) — et **jamais** exposée à un participant (NFR5 : procédure dans `organisateurRouter` uniquement).
4. **Given** « régénérer », **When** j'appelle `genererRecettes({ repasId, exclure })` avec les `ref` déjà vues, **Then** je reçois une **autre sélection** (disjointe) tant que d'autres compatibles existent.
5. **Given** la résilience & la perf (NFR2 < 5 s cible), **When** la source a déjà été mise en cache, **Then** la 2ᵉ génération **resert le cache sans nouvel appel réseau** (4.2) ; si la source casse mais qu'un cache existe, on génère quand même.
6. **Given** les validations, **When** je lance `npm run test`, `lint`, `typecheck`, `SKIP_ENV_VALIDATION=1 build`, **Then** tout reste vert ; le pipeline est testé **sans réseau ni base réelle** (Prisma mocké, source factice).

## Tasks / Subtasks

- [x] **Tâche 1 — Orchestrateur `genererPourRepas` (testable)** (AC: 1, 2, 4, 5)
  - [x] Créer `src/server/generation.ts` : `genererPourRepas(db, source, { repasId, organisateurId, exclure?, requete?, limite? }) : Promise<ResultatResolution>` (fonctions prenant `db`+`source` en paramètres, façon `purge.ts` / `cache.ts`).
  - [x] Étapes :
    1. **Ownership** : `db.repas.findFirst({ where: { id: repasId, organisateurId }, include: { participants: { include: { restrictions: true } } } })` → `NOT_FOUND` si absent.
    2. **Participants couverts** = ceux dont `statut === "REPONDU"` ; agréger leurs `restrictions`.
    3. `construireContraintes(restrictions ALLERGIE+REGIME)` ; `nonAimes` = restrictions `NON_AIME` `{ valeur, seuilTolerance }` (seuil `?? SEUIL_TOLERANCE_DEFAUT`/défaut neutre).
    4. **Recettes** : `recupererRecettes(db, source, { requete, limite }, { … })` (4.2).
    5. **Pipeline** : mapper chaque `RecetteBrute` → `RecetteEntree { ref: sourceRef, titre, ingredients: ingredientsTexte, detection: detect(ingredientsTexte) }`.
    6. `resoudre(entrees, contraintes, nonAimes, { exclure })` → renvoyer le Result.

- [x] **Tâche 2 — Procédure tRPC `genererRecettes`** (AC: 1, 2, 3)
  - [x] Ajouter à `src/server/api/routers/organisateur.ts` : `genererRecettes` = `protectedProcedure.input(z.object({ repasId: z.string(), exclure: z.array(z.string()).optional() })).mutation(...)`.
  - [x] Appeler `genererPourRepas(ctx.db, marmitonSource, { repasId, organisateurId: ctx.session.user.id, exclure })`. Pas de logique métier dans le router (elle vit dans `generation.ts`/`/core`).
  - [x] **NFR5** : procédure dans `organisateurRouter` uniquement ; `participantRouter` n'expose **jamais** de recette.

- [x] **Tâche 3 — Tests (sans réseau ni base réelle)** (AC: 1, 2, 4, 5, 6)
  - [x] `src/server/generation.test.ts` (Prisma mocké + **source factice** implémentant `SourceDeRecettes`) :
    - Repas possédé + participants REPONDU → pipeline → `resoudre` → 3-10 (assert recettes sûres).
    - Repas non possédé (`findFirst` → null) → `NOT_FOUND`.
    - **N'utilise que les restrictions des REPONDU** (un participant EN_ATTENTE n'influe pas).
    - Une recette contenant un allergène déclaré → **absente** du résultat (sécurité de bout en bout).
    - `exclure` (régénérer) → sélection disjointe.
    - `incertain` propagé (ingrédient non reconnu / régime non évalué).
  - [x] `organisateur.test.ts` : mocker `~/server/sources/marmitonSource` (source factice) pour éviter tout réseau ; vérifier que `genererRecettes` délègue et renvoie le Result, et refuse un repas non possédé.

- [x] **Tâche 4 — Validations** (AC: 6)
  - [x] `npm run test`, `lint`, `typecheck`, `SKIP_ENV_VALIDATION=1 npm run build` → tout vert.

### Review Findings

> Revue de code adversariale du 2026-06-27 (3 couches), **périmètre combiné moteur de génération (4.2 → 4.4b)**, diff depuis `9715a82`. Verdict : **invariant de sécurité TIENT** (aucune recette violant le mur n'est jamais retenue, prouvé par 3 layers) ; **27/27 ACs satisfaits** ; pureté `/core` + frontière source + NFR5 OK. Findings = correction/qualité. 6 patches · 3 reports · 5 écartés.

- [x] [Review][Patch] **[Med]** Échelle du seuil incohérente : `curseur` utilise `SEUIL_TOLERANCE_MAX = 5` mais l'UI/Zod plafonne à **4** → un non-aimé « Souple » donne une pénalité 1 au lieu de 0. [src/core/compatibilite/curseur.ts] — ✅ `MAX=4` + test « souple → 0 »
- [x] [Review][Patch] **[Med]** `mur` étiquette **toujours** `"ALLERGIE"`, même pour un régime → message faux (FR16). [src/core/compatibilite/mur.ts] — ✅ provenance `allergiesCodes` dans `construireContraintes` ; `mur` étiquette ALLERGIE/REGIME + test
- [x] [Review][Patch] **[Med]** `marmitonSource` : `url`/`name` non gardés → collision de cache. [src/server/sources/marmitonSource.ts] — ✅ filtre des items falsy + test
- [x] [Review][Patch] **[Med]** Lecture de cache non bornée (`findMany` sans `take`). [src/server/sources/cache.ts] — ✅ `take: limite` + `orderBy: fetchedAt desc` (lecture + repli)
- [x] [Review][Patch] **[Low]** `RecetteRetenue` sans `ingredients` (AC3 + Epic 5). [src/core/compatibilite/resoudre.ts] — ✅ champ ajouté + peuplé
- [x] [Review][Patch] **[Low]** `exclure` non plafonné. [src/server/api/routers/organisateur.ts] — ✅ `.max(200)`
- [x] [Review][Defer] **[Med→quand la recherche par requête arrivera]** Cache **clé sur `source` seul** (pas `requete`) : après la 1ʳᵉ requête peuplée, toute autre `requete` resert les recettes de la 1ʳᵉ. Non exercé aujourd'hui (la génération utilise une requête vide = pool large par source). Quand la recherche par mots-clés sera branchée : ajouter une colonne `requete` à `RecetteCache` + clé unique. [cache.ts, schema.prisma]
- [x] [Review][Defer] **[Low→4.5]** `resoudre` ne distingue pas « pool épuisé après régénérer » de « trop peu dès le départ » (les deux → `PAS_ASSEZ`). La dégradation (4.5) raffinera. [resoudre.ts]
- [x] [Review][Defer] **[Low]** `resoudre` ne revalide pas la cohérence `detection` ↔ `ingredients` d'une `RecetteEntree` fournie (sûr dans le pipeline actuel car dérivés du même texte ; risque pour un futur appelant). Documenter l'invariant ou dériver `detection` dans `resoudre`. [resoudre.ts]

## Dev Notes

### ⚠️ Pièges critiques (lire avant de coder)

1. **Logique métier dans `/core` + orchestrateur, PAS dans le router.** Le router `genererRecettes` est **mince** : il appelle `genererPourRepas`. Toute la composition (ownership, agrégation, pipeline, resoudre) vit dans `generation.ts` (testable, `db`+`source` injectés). Anti-pattern proscrit : logique métier dans le router.

2. **Frontière de sécurité (NFR5) — recettes RÉSERVÉES à l'organisateur.** `genererRecettes` est dans `organisateurRouter` (protégé). `organisateurId` vient **toujours** de `ctx.session.user.id`. Le `participantRouter` ne référence **aucune** recette. Ne jamais renvoyer de recette vers une vue participant.

3. **Pipeline = composition, normaliser AVANT `/core`.** Pour chaque recette : `detect(ingredientsTexte)` (qui `normalize` en interne). Le `/core` reste pur ; l'orchestrateur fait l'I/O (DB, source) puis appelle `/core`. Ne pas mettre d'I/O dans `/core`.

4. **Seulement les participants `REPONDU`** alimentent les contraintes en 4.4b (chemin nominal). La **génération forcée** avec réponses partielles + avertissement des non-couverts = **story 4.7**. Ici : ignorer les `EN_ATTENTE` silencieusement (4.7 ajoutera le signalement).

5. **Sécurité de bout en bout = invariant déjà garanti par `resoudre`** (4.4a). Le test « recette avec allergène déclaré → absente » vérifie la chaîne complète (detect→mur→resoudre) côté serveur.

6. **Perf < 5 s via cache (NFR2).** `recupererRecettes` (4.2) sert le cache sur la 2ᵉ génération sans rappel réseau. Le 1ᵉʳ appel (scrape marmiton) peut être lent — c'est attendu ; le cache absorbe. `detect`+`resoudre` sont en mémoire (rapides). Choisir une `limite` de recherche suffisante pour avoir ≥3 après filtrage (ex. 30-50) — **décision dev**, paramétrable.

7. **Tests SANS réseau.** `generation.test.ts` injecte une **source factice** (`SourceDeRecettes`) et un `db` mocké. Pour `organisateur.test.ts`, **mocker** `~/server/sources/marmitonSource` (sinon l'import déclenche `marmiton-api`) — aucun appel réseau réel en CI.

### État réel du projet (vérifié — acquis Epic 3 + 4.0→4.4a)

- **`/core`** expose : `construireContraintes`, `mur`, `curseur`, `resoudre` (+ types `ResultatResolution`, `RecetteEntree`, `RecetteRetenue`, `NonAime`), `detect`, `SEUIL_TOLERANCE_MAX`. **Réutiliser tel quel.**
- **`/server/sources`** (4.2) : `SourceDeRecettes`, `RecetteBrute` (`{ source, sourceRef, titre, ingredientsTexte }`), `recupererRecettes(db, source, criteres, options)` (fetch-through + résilience), `marmitonSource`. `RecetteCache` en base.
- **`organisateurRouter`** (`src/server/api/routers/organisateur.ts`) : `protectedProcedure`, `organisateurId = ctx.session.user.id`. `repasDetail` fait déjà `findFirst({ where: { id, organisateurId }, include: { participants } })` — **mirror** ce pattern + `restrictions`.
- **`Participant`** : `statut EN_ATTENTE|REPONDU`, relation `restrictions Restriction[]` (`type`, `valeur`, `seuilTolerance?`).
- **Pattern test router** : mock `~/server/auth`/`~/server/db`/`~/env`/`~/server/email` ; `appRouter.createCaller({ session, db, headers })`. Ajouter un mock de `~/server/sources/marmitonSource`.
- **Pattern orchestrateur testable** : `src/server/purge.ts` (`db` injecté), `src/server/sources/cache.ts` (`db`+`source` injectés) — **mirror**.

### Périmètre — hors de cette story

- **Dégradation élégante** (quand `PAS_ASSEZ` : proposer quand même ≥3 en froissant le moins, signaler les ingrédients gênants) → **story 4.5**.
- **Échec explicatif** (mur impossible, nommer la contrainte bloquante) → **story 4.6**.
- **Génération forcée** (réponses partielles, signaler les non-couverts) → **story 4.7**.
- **Régimes alimentaires** (végétarien/vegan…) → **story 4.3b**.
- **Affichage des recettes & avertissement allergie** (vue organisateur) → **Epic 5** (4.4b renvoie les données, l'UI les consomme).
- **Persistance de la sélection générée** : non requise — génération à la demande (le cache des recettes suffit). Différable si l'UX l'exige.

### Décisions tranchées

- **Orchestrateur `generation.ts`** (db+source injectés) ; router mince.
- **Source réelle = `marmitonSource`** (4.2) ; tests via source factice (zéro réseau).
- **Seulement `REPONDU`** en 4.4b ; forcée = 4.7.
- **Pas de persistance de sélection** en V1 (génération à la demande + cache recettes).

### Testing standards

- **Vitest** node ; **aucun réseau, aucune base réelle** (`db` mocké, source factice, `marmitonSource` mocké côté router).
- Couvrir : ownership (`NOT_FOUND`), pipeline bout-en-bout (recette dangereuse exclue), REPONDU-only, régénérer (`exclure`), incertitude propagée.
- Co-localiser ; réutiliser le pattern de mock des routers existants.

### Definition of Done manuelle (utilisateur, hors agent)

1. `npx prisma db push` déjà fait (RecetteCache, 4.2) ; DB + un repas avec ≥1 participant REPONDU.
2. Appeler `genererRecettes({ repasId })` (via UI Epic 5 ou script) → liste 3-10 (ou PAS_ASSEZ) ; relancer → resservi du cache (pas de 2ᵉ scrape).
3. `npm run test`/`lint` verts.

### Project Structure Notes

- **Nouveaux** : `src/server/generation.ts` + `generation.test.ts`.
- **Modifiés** : `src/server/api/routers/organisateur.ts` (`genererRecettes`) + `organisateur.test.ts`.
- **Aucune** migration (RecetteCache existe), **aucune** dépendance nouvelle.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 4.4] (resoudre 3-10, régénérer, < 5 s via cache ; 4.5/4.6/4.7 distinctes)
- [Source: _bmad-output/planning-artifacts/architecture.md#Data Flow / Process Patterns] (`source → cache → normalisation → /core → router organisateur → UI` ; token jamais côté participant ; logique hors UI/routers)
- [Source: _bmad-output/implementation-artifacts/4-4a-curseur-resoudre.md] (`resoudre`, `RecetteEntree`, `RecetteRetenue`, `ResultatResolution`, `NonAime`)
- [Source: _bmad-output/implementation-artifacts/4-2-source-de-recettes-interchangeable-cache.md] (`SourceDeRecettes`, `recupererRecettes`, `marmitonSource`, `RecetteBrute`)
- [Source: _bmad-output/implementation-artifacts/4-3-filtre-du-mur.md] (`construireContraintes`, `mur`, modèle 3 états)
- [Source: src/server/api/routers/organisateur.ts] (pattern `protectedProcedure`, ownership, `organisateurId` de session)

## Dev Agent Record

### Agent Model Used

claude-opus-4-8 (bmad-dev-story)

### Debug Log References

- Suite complète : **213/213** ✅ (205 → 213, +8 : generation ×6, organisateur genererRecettes ×2). `lint` ✅, `typecheck` ✅, `SKIP_ENV_VALIDATION=1 build` ✅.
- **Typecheck** : passer le vrai `PrismaClient` (`ctx.db`) à mon type structurel `DbGeneration` échouait (méthodes Prisma génériques non assignables à une signature lâche — contravariance des paramètres). Résolu par un **cast de frontière unique** au router (`ctx.db as unknown as DbGeneration`) ; le client fournit ces méthodes à l'exécution.
- Tests 100% hors-ligne : `db` mocké, source factice ; `~/server/sources/marmitonSource` mocké dans `organisateur.test.ts`.

### Completion Notes List

- ✅ **Orchestrateur `genererPourRepas(db, source, opts)`** (`src/server/generation.ts`, db+source injectés) : ownership (`findFirst` where id+organisateurId → `NOT_FOUND`), restrictions des **REPONDU** uniquement → `construireContraintes` + `nonAimes` (seuil `?? défaut`), `recupererRecettes` (cache 4.2), pipeline `detect` par recette, `resoudre` → Result.
- ✅ **Procédure tRPC `organisateur.genererRecettes({ repasId, exclure? })`** : protégée, `organisateurId` de session, **mince** (délègue à l'orchestrateur). `participantRouter` n'expose toujours **aucune** recette (NFR5).
- ✅ **Sécurité de bout en bout testée** : une recette contenant un allergène déclaré est **absente** du résultat (chaîne detect→mur→resoudre côté serveur).
- ✅ **REPONDU-only** : un participant EN_ATTENTE n'influe pas sur les contraintes (testé).
- ✅ **Régénérer** (`exclure`) → sélection disjointe ; **incertitude** propagée (ingrédient non reconnu).
- ✅ **Perf/résilience via cache 4.2** : 2ᵉ génération resservie du cache sans rappel réseau (fetch-through + repli).
- **Hors périmètre** : dégradation (PAS_ASSEZ) → 4.5 ; échec explicatif → 4.6 ; forcée (réponses partielles) → 4.7 ; affichage + avertissement allergie → Epic 5.
- **DoD utilisateur** : `npx prisma db push` (RecetteCache déjà en 4.2) ; appeler `genererRecettes` via UI Epic 5 / script ; relancer → resservi du cache.

### File List

- `src/server/generation.ts` + `generation.test.ts` (NOUVEAUX — orchestrateur)
- `src/server/api/routers/organisateur.ts` (MODIFIÉ — procédure `genererRecettes`)
- `src/server/api/routers/organisateur.test.ts` (MODIFIÉ — tests + mock marmitonSource)

### Change Log

- 2026-06-27 : Story 4.4b implémentée — orchestrateur `genererPourRepas` (ownership, REPONDU-only, source/cache → detect → mur → resoudre) + procédure tRPC `genererRecettes` (protégée, déléguante). Sécurité bout-en-bout + régénérer + incertitude testés hors-ligne. 213/213, lint/typecheck/build verts. Statut → review. **Génération de recettes (FR9) appelable de bout en bout.**
- 2026-06-28 : Revue de code combinée moteur génération (4.2→4.4b, 3 couches). Invariant de sécurité confirmé (aucune recette violant le mur retenue), 27/27 ACs satisfaits. 6 patches appliqués (échelle seuil, étiquette ALLERGIE/REGIME, garde url marmiton, borne lecture cache, `ingredients` dans RecetteRetenue, plafond `exclure`). 3 reports tracés (`deferred-work.md`). Tests 216/216. Statut → done. **Moteur de génération Epic 4 (4.2→4.4b) terminé.**
