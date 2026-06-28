---
baseline_commit: 9715a82
---

# Story 4.2 : Source de recettes interchangeable + cache

Status: done

## Story

As a moteur,
I want récupérer des recettes via une source remplaçable et mise en cache,
so that le moteur fonctionne même si la source casse. (FR14)

## Acceptance Criteria

1. **Given** l'interface **`SourceDeRecettes`**, **When** une recette est demandée, **Then** une implémentation **`marmitonSource`** la récupère (titre + ingrédients en texte libre) **derrière l'interface** — le code appelant ne dépend jamais de la source concrète.
2. **Given** une récupération réussie, **When** elle aboutit, **Then** le résultat est **mis en cache en Postgres** (`RecetteCache` : source, sourceRef, titre, ingredientsTexte, fetchedAt).
3. **Given** des recettes déjà en cache et **fraîches** (TTL non dépassé), **When** on redemande, **Then** elles sont **resservies depuis le cache sans nouvel appel à la source** (la source n'est pas invoquée).
4. **Given** l'abstraction, **When** on **change de source** (autre implémentation de `SourceDeRecettes`), **Then** **aucun** code moteur/cache n'a besoin d'être modifié (interchangeabilité prouvée par un test avec une source factice).
5. **Given** la résilience, **When** la source échoue (exception réseau) **mais** un cache frais existe, **Then** on **sert le cache** (la panne de source est absorbée) ; si aucun cache, l'erreur remonte proprement (pas de crash silencieux).
6. **Given** la frontière `/core`, **When** j'implémente, **Then** `src/server/sources/` **n'est jamais importé par `/core`** (le moteur ne connaît que des données déjà normalisées, pas la source). La détection d'allergènes reste dans `/core` ; 4.2 ne fait **que** récupérer/cacher du texte brut.
7. **Given** les validations, **When** je lance `npm run test`, `lint`, `typecheck`, `SKIP_ENV_VALIDATION=1 build`, **Then** tout reste vert ; le cache et l'interchangeabilité sont testés **sans réseau ni base réelle** (Prisma mocké, `marmiton-api` mocké).

## Tasks / Subtasks

- [x] **Tâche 1 — Dépendance & modèle Prisma `RecetteCache`** (AC: 2)
  - [x] Installer la dépendance **`marmiton-api`** (scraper non-officiel, côté serveur — sanctionnée par l'architecture). `npm i marmiton-api`.
  - [x] Ajouter à `prisma/schema.prisma` :
    ```prisma
    model RecetteCache {
        id               String   @id @default(cuid())
        source           String
        sourceRef        String
        titre            String
        ingredientsTexte String[]
        fetchedAt        DateTime @default(now())

        @@unique([source, sourceRef])
        @@index([source])
    }
    ```
  - [x] `npx prisma generate` (types). Migration (`db push`/`migrate`) = DoD manuelle.

- [x] **Tâche 2 — Interface `SourceDeRecettes` + types** (AC: 1, 4, 6)
  - [x] Créer `src/server/sources/SourceDeRecettes.ts` :
    ```ts
    export type RecetteBrute = {
      source: string;          // ex. "marmiton"
      sourceRef: string;       // identifiant stable côté source (URL/slug)
      titre: string;
      ingredientsTexte: string[]; // lignes d'ingrédients en TEXTE LIBRE (non normalisé)
    };
    export type CriteresRecherche = { requete?: string; limite?: number };
    export interface SourceDeRecettes {
      readonly nom: string;
      chercher(criteres: CriteresRecherche): Promise<RecetteBrute[]>;
    }
    ```
  - [x] **Aucune normalisation ici** : `ingredientsTexte` reste du texte brut (le `normalize`/`detect` de `/core` s'applique plus tard, story 4.4).

- [x] **Tâche 3 — Cache Postgres + orchestrateur fetch-through** (AC: 2, 3, 5)
  - [x] Créer `src/server/sources/cache.ts` (fonctions prenant `db` en paramètre, façon `purge.ts`) :
    - `const TTL_CACHE_JOURS = 30;`
    - `lireCache(db, source: string, { maintenant }): Promise<RecetteBrute[]>` → recettes `RecetteCache` de cette source **non expirées** (`fetchedAt > maintenant - TTL`).
    - `ecrireCache(db, recettes: RecetteBrute[]): Promise<void>` → **upsert** par `(source, sourceRef)`, `fetchedAt = maintenant`.
    - `recupererRecettes(db, source: SourceDeRecettes, criteres, { rafraichir = false, maintenant = new Date() }): Promise<RecetteBrute[]>` :
      1. Si `!rafraichir` → `lireCache` ; **si ≥ 1 recette fraîche → la retourner SANS appeler la source** (AC3).
      2. Sinon (cache vide/expiré ou `rafraichir`) → `source.chercher(criteres)` → `ecrireCache` → retourner.
      3. **Résilience (AC5)** : si `source.chercher` lève → tenter `lireCache` ; si du cache (même expiré) existe, le servir ; sinon propager l'erreur.

- [x] **Tâche 4 — `marmitonSource` (adapter)** (AC: 1)
  - [x] Créer `src/server/sources/marmitonSource.ts` : `export const marmitonSource: SourceDeRecettes = { nom: "marmiton", async chercher(criteres) { ... } }`.
  - [x] À l'intérieur : appeler `marmiton-api` (recherche → détails), **mapper** vers `RecetteBrute[]` (`source: "marmiton"`, `sourceRef` = URL/slug, `titre`, `ingredientsTexte` = lignes brutes). **Isoler** l'appel réseau pour qu'il soit mockable au test.
  - [x] ⚠️ **Vérifier l'API réelle du package installé** (les scrapers non-officiels changent) et adapter le mapping. Ne pas exposer la forme `marmiton-api` au-delà de cet adapter.

- [x] **Tâche 5 — Tests (sans réseau ni base réelle)** (AC: 3, 4, 5, 7)
  - [x] `cache.test.ts` (Prisma mocké + **source factice**) :
    - **miss** : cache vide → `recupererRecettes` appelle `source.chercher` **une fois** + `upsert` ; renvoie les recettes.
    - **hit** : cache frais → renvoie le cache **sans** appeler `source.chercher` (assert source non appelée).
    - **résilience** : `source.chercher` rejette + cache (même expiré) présent → renvoie le cache ; cache absent → l'erreur remonte.
    - **TTL** : recette `fetchedAt` au-delà du TTL → considérée expirée.
  - [x] **Interchangeabilité** : deux sources factices (`nom` différents) passent par le **même** `recupererRecettes` sans modification — assert que ça marche pour les deux.
  - [x] `marmitonSource.test.ts` : `vi.mock("marmiton-api", ...)` → l'adapter mappe la réponse mockée vers `RecetteBrute[]` (titre, ingrédients, sourceRef) ; aucun appel réseau réel.

- [x] **Tâche 6 — Validations** (AC: 7)
  - [x] `npm run test`, `lint`, `typecheck`, `SKIP_ENV_VALIDATION=1 npm run build` → tout vert.

## Dev Notes

### ⚠️ Pièges critiques (lire avant de coder)

1. **Le moteur ne connaît QUE l'interface (FR14, frontière source).** Tout code consommateur (cache, future génération 4.4) dépend de `SourceDeRecettes`, **jamais** de `marmitonSource` directement (sauf le point de composition qui injecte l'impl). C'est ce qui rend la source « jetable ». Le test d'interchangeabilité le prouve.

2. **`/core` n'importe JAMAIS `/server/sources`.** La règle ESLint de boundaries protège `/core`. Inversement, `sources/` peut utiliser Prisma/réseau (c'est de la périphérie). **Ne pas** appeler `/core` depuis `sources/` non plus : 4.2 ne normalise/détecte rien — il livre du **texte brut**. La normalisation + détection (`normalize`/`detect`) se branchera en **4.4**.

3. **`marmiton-api` = nouvelle dépendance autorisée** (architecture). C'est un scraper non-officiel, **côté serveur uniquement**, licence zone grise (gate pré-public, hors V1 testeurs). **Isoler** toute sa surface dans `marmitonSource.ts`. **Vérifier l'API exacte** du package installé (méthodes/forme de retour) et adapter le mapping — ne pas présumer ; un commentaire `[VÉRIFIER]` au point d'appel est bienvenu.

4. **Cache = résilience, pas seulement perf (AC5).** Si la source casse, un cache frais sauve la génération. Implémenter le fallback : `chercher` échoue → servir le cache (même légèrement périmé vaut mieux que rien) ; n'échouer que si le cache est vide.

5. **`ingredientsTexte` = `String[]` Postgres.** Prisma supporte `String[]`. Stocker les lignes d'ingrédients **brutes** (telles que scrapées). Ne pas concaténer ni normaliser.

6. **Upsert idempotent par `(source, sourceRef)`.** `@@unique([source, sourceRef])` + `db.recetteCache.upsert`. Re-cacher une recette met à jour `titre`/`ingredientsTexte`/`fetchedAt` sans doublon.

7. **Fonctions prenant `db` en paramètre** (façon `src/server/purge.ts`) → testables avec un `db` mocké, sans base réelle. Pas d'accès direct au singleton `~/server/db` dans les fonctions pures-ish de cache.

### État réel du projet (vérifié)

- **`prisma/schema.prisma`** : `User/Account/Session`, `Repas`, `Participant`, `Restriction`, `VerificationToken`. **Pas encore** de `RecetteCache` → à ajouter. Client Prisma généré dans `generated/prisma` (importé via `~/server/db`).
- **Pattern serveur testable** : `src/server/purge.ts` → `purgerRepasExpires(db, maintenant = new Date())`, testé avec `db` mocké (`deleteMany` mock) dans `purge.test.ts`. **Mirror ce pattern** pour le cache.
- **`src/server/`** : pas de dossier `sources/` encore → à créer (`src/server/sources/`). Architecture : `SourceDeRecettes.ts` + `marmitonSource.ts` + `cache.ts`.
- **tRPC / génération** : aucune procédure de génération encore (Epic 4.4). 4.2 ne touche **pas** aux routers ; il fournit la couche source/cache que 4.4 consommera.
- **`env.js`** : `marmiton-api` ne requiert pas de clé. **Pas** de nouvelle variable d'env nécessaire.
- **Tests** : Vitest ; pour le router/serveur, environnement node + mocks (`~/server/db`, `~/env`). Mock de module npm via `vi.mock("marmiton-api", ...)`.

### Périmètre — hors de cette story

- **Génération de recettes** (appeler la source, normaliser, `detect`, filtrer par le mur) → stories **4.3/4.4**. 4.2 livre **uniquement** récupération + cache de texte brut.
- **Normalisation / détection d'allergènes** sur les recettes → 4.4 (compose `/core` `normalize`+`detect` sur `ingredientsTexte`).
- **Procédure tRPC organisateur** exposant les recettes → Epic 5 / 4.4.
- **Liste blanche d'ingrédients sûrs** (question ouverte 4.1b) → 4.3.
- **Open Food Facts** comme source d'allergènes → différé (hors-ligne).

### Décisions tranchées

- **Source réelle `marmiton-api` maintenant** (décision produit du 2026-06-27) — pas de source de démo. Le cache absorbe la fragilité ; l'interface garde la source jetable.
- **Cache au niveau recette** (`source`+`sourceRef`), TTL 30 j (cohérent avec le TTL des repas). `recupererRecettes` = fetch-through avec fallback de résilience.
- **`chercher` renvoie des recettes complètes** (titre + ingrédients) : c'est l'appel coûteux ; le cache évite de le refaire.

### Testing standards

- **Vitest**, environnement node pour cache/source. **Aucun réseau, aucune base réelle** : `db` mocké (upsert/findMany), `marmiton-api` mocké via `vi.mock`.
- Tester : miss/hit (la source n'est PAS appelée sur hit), résilience (source échoue → cache servi), TTL d'expiration, **interchangeabilité** (2 sources factices), mapping de l'adapter.
- Co-localiser `*.test.ts` dans `src/server/sources/`.

### Definition of Done manuelle (utilisateur, hors agent)

1. `npx prisma db push` (créer la table `RecetteCache`).
2. (Optionnel, réseau) appeler `marmitonSource.chercher({ requete: "curry", limite: 5 })` via un petit script → vérifier titres + ingrédients ; relancer → resservi du cache (pas de second appel réseau).
3. `npm run test` / `lint` verts.

### Project Structure Notes

- **Nouveaux** : `src/server/sources/SourceDeRecettes.ts`, `src/server/sources/cache.ts` (+ `cache.test.ts`), `src/server/sources/marmitonSource.ts` (+ `marmitonSource.test.ts`).
- **Modifiés** : `prisma/schema.prisma` (`RecetteCache`), `package.json` (dép. `marmiton-api`).
- **Migration** Prisma à appliquer (DoD). **Aucun** import depuis `/core`.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 4.2] (interface `SourceDeRecettes`, `marmitonSource`, cache Postgres, changer de source sans toucher au moteur)
- [Source: _bmad-output/planning-artifacts/architecture.md#Domain Core / Frontière source] (`SourceDeRecettes` + `marmitonSource` + cache ; le moteur ne connaît que l'interface ; données normalisées AVANT `/core`)
- [Source: _bmad-output/planning-artifacts/architecture.md#Data Architecture] (`RecetteCache` : id, source, sourceRef, titre, ingredientsTexte, fetchedAt ; cache Postgres persistant, résilience)
- [Source: _bmad-output/planning-artifacts/prds/.../addendum.md#Source de recettes] (`marmiton-api` scraper, texte libre, abstraction + cache, source jetable)
- [Source: src/server/purge.ts] (pattern fonction serveur testable avec `db` injecté)

## Dev Agent Record

### Agent Model Used

claude-opus-4-8 (bmad-dev-story)

### Debug Log References

- Suite complète : **178/178** ✅ (168 → 178, +10 : cache ×7, marmitonSource ×3). `lint` ✅, `typecheck` ✅, `SKIP_ENV_VALIDATION=1 build` ✅.
- **`marmiton-api` v3.0.0 installé** ; API réelle inspectée : `searchRecipes(qs): Promise<Recipe[]>` (recettes **complètes avec `ingredients`** en un seul appel) + `MarmitonQueryBuilder().withTitleContaining(...).build()`. Le package livre des `.d.ts` mais **ne les expose pas** via `package.json#types` → déclaration ambient minimale `src/types/marmiton-api.d.ts`.
- Tests 100% hors-ligne : `db` mocké (findMany/upsert), `marmiton-api` mocké via `vi.mock`.

### Completion Notes List

- ✅ **Interface `SourceDeRecettes`** + types (`RecetteBrute` texte brut, `CriteresRecherche`). Le moteur ne dépendra que de l'interface.
- ✅ **Modèle Prisma `RecetteCache`** (source, sourceRef, titre, `ingredientsTexte String[]`, fetchedAt ; `@@unique([source, sourceRef])` + index). `prisma generate` OK.
- ✅ **Cache + orchestrateur** (`cache.ts`, `db` injecté façon `purge.ts`) : `lireCache` (frais via TTL 30 j), `ecrireCache` (upsert idempotent), `recupererRecettes` fetch-through — **hit = pas d'appel source** ; **résilience** : source en panne + cache présent → resert le cache, sinon propage.
- ✅ **`marmitonSource`** (adapter) : toute la surface `marmiton-api` isolée ; mappe `Recipe → RecetteBrute` (url→sourceRef, name→titre, ingredients→ingredientsTexte). Aucune normalisation (texte brut).
- ✅ **Interchangeabilité prouvée** : 2 sources factices (`nom` différents) via le **même** `recupererRecettes` sans modif.
- **Frontière respectée** : `/server/sources` n'importe pas `/core` et n'est pas importé par `/core` ; aucune détection ici (le `normalize`/`detect` se branche en 4.4).
- **À faire par l'utilisateur (DoD)** : `npx prisma db push` (table `RecetteCache`) ; (optionnel) appel réseau réel de `marmitonSource.chercher` pour vérifier titres+ingrédients puis re-service depuis le cache.

### File List

- `prisma/schema.prisma` (MODIFIÉ — modèle `RecetteCache`)
- `package.json` / `package-lock.json` (MODIFIÉ — dép. `marmiton-api`)
- `src/types/marmiton-api.d.ts` (NOUVEAU — déclaration ambient minimale)
- `src/server/sources/SourceDeRecettes.ts` (NOUVEAU — interface + types)
- `src/server/sources/cache.ts` + `cache.test.ts` (NOUVEAUX — cache + orchestrateur)
- `src/server/sources/marmitonSource.ts` + `marmitonSource.test.ts` (NOUVEAUX — adapter)

### Change Log

- 2026-06-27 : Story 4.2 implémentée — interface `SourceDeRecettes` + cache Postgres `RecetteCache` (fetch-through + résilience) + adapter `marmitonSource` (marmiton-api v3, surface isolée). Interchangeabilité et résilience testées hors-ligne. 178/178, lint/typecheck/build verts. Statut → review. **Couche source de recettes (FR14) opérationnelle.**
