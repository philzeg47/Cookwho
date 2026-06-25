---
baseline_commit: 898d9703f4036aa98eae67e3156e77e8128950d0
---

# Story 2.5: Purge planifiée des repas expirés

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a responsable des données,
I want que les repas et restrictions expirés soient supprimés automatiquement,
so that on ne conserve pas de données de santé inutilement. (NFR6)

## Acceptance Criteria

1. **Given** des repas dont l'`expiresAt` est **dépassé**, **When** le job de purge planifié s'exécute, **Then** ces repas **et leurs participants** (et, à terme, leurs restrictions) sont **supprimés** de la base.
2. **Given** des repas **non expirés** (`expiresAt` dans le futur), **When** la purge s'exécute, **Then** ils sont **conservés** (suppression strictement bornée à `expiresAt < maintenant`).
3. **Given** la planification, **When** je configure le déploiement, **Then** un **job Vercel Cron** est défini (`vercel.json` : planification + chemin de la route) avec sa **variable d'env** de protection (revue technique).
4. **Given** la route de purge, **When** elle est appelée **sans le secret attendu**, **Then** elle répond **401** et ne supprime rien — **non déclenchable publiquement**.
5. **Given** les validations, **When** je lance `npm run test`, `npm run lint`, `npm run typecheck`, `build`, **Then** tout reste vert ; la logique de purge et la garde d'accès sont testées **sans base réelle** (Prisma mocké).

## Tasks / Subtasks

- [x] **Tâche 1 — Logique de purge (pure, testable)** (AC: 1, 2)
  - [x] `src/server/purge.ts` : `purgerRepasExpires(db, maintenant = new Date())` → `deleteMany({ where: { expiresAt: { lt: maintenant } } })`. Cascade participants (2.2). Restrictions à garantir en 3.2.
- [x] **Tâche 2 — Variable d'env `CRON_SECRET`** (AC: 3, 4)
  - [x] `CRON_SECRET` ajouté à `env.js` (server + runtimeEnv), `.env.example`, `.env`.
- [x] **Tâche 3 — Route protégée de purge** (AC: 1, 4)
  - [x] `src/app/api/cron/purge/route.ts` (`GET`, `force-dynamic`) : 401 si `Authorization` ≠ `Bearer ${CRON_SECRET}` (rien supprimé), sinon purge + `{ purges: count }`. Aucun log sensible.
- [x] **Tâche 4 — Planification Vercel Cron** (AC: 3)
  - [x] `vercel.json` : cron `/api/cron/purge` quotidien `0 3 * * *`. `CRON_SECRET` documenté (`.env.example`).
- [x] **Tâche 5 — Tests** (AC: 1, 2, 4, 5)
  - [x] `purge.test.ts` : borne `lt maintenant` + count. `route.test.ts` : 401 sans/mauvais secret (purge non appelée) + 200 `{ purges }` avec bon secret.
- [x] **Tâche 6 — Validations** (AC: 5)
  - [x] `npm run test` → 65/65 ✅ · `lint` ✅ · `typecheck` ✅ · `SKIP_ENV_VALIDATION=1 build` ✅ (`/api/cron/purge`).

## Dev Notes

### ⚠️ Pièges critiques (lire avant de coder)

1. **La route DOIT être protégée.** Une route de suppression publique = un attaquant peut purger toutes les données. Vérifier le `Bearer ${CRON_SECRET}` **avant** toute opération DB ; 401 sinon. C'est le test de sécurité central.
2. **Borne stricte `expiresAt < maintenant`.** Ne jamais supprimer un repas futur. `deleteMany({ where: { expiresAt: { lt: new Date() } } })`.
3. **Cascade déjà en place pour les participants** (`Participant.repas onDelete: Cascade`, story 2.2) → supprimer le `Repas` suffit. **Restrictions** : le modèle n'existe pas encore (Epic 3) ; quand il sera créé (story 3.2), poser `Restriction.participant onDelete: Cascade` pour que la purge les emporte aussi. (À rappeler dans la story 3.2 — hors périmètre code ici.)
4. **NFR6** : ne logger ni email, ni token, ni contenu. Au plus, le **nombre** de repas purgés.
5. **`env.js` strict** : ajouter `CRON_SECRET` en `server` **et** `runtimeEnv`. Le build CI tourne avec `SKIP_ENV_VALIDATION=1`.
6. **Vercel Cron** : déclenche le `path` en **GET**, en ajoutant automatiquement `Authorization: Bearer ${CRON_SECRET}` **si** la variable `CRON_SECRET` est définie sur le projet Vercel. C'est le mécanisme d'auth standard. (Réf. doc Vercel Cron Jobs — « Securing cron jobs ».)

### État réel du projet (vérifié — acquis Epic 2)
- **Modèle `Repas`** : `expiresAt DateTime` (story 2.1, = date du repas + 30 j). `Participant.repas` en `onDelete: Cascade` (story 2.2).
- **Client Prisma** : `db.repas.deleteMany(...)` (généré dans `generated/prisma`). `import { db } from "~/server/db"`.
- **Route handlers** : déjà utilisés (`src/app/api/auth/[...nextauth]/route.ts`, `src/app/api/trpc/[trpc]/route.ts`). Même convention pour `api/cron/purge/route.ts`.
- **Pas de tRPC ici** : la purge n'est pas une procédure organisateur/participant (c'est un job système) → simple **Route Handler** protégé par secret, pas `protectedProcedure` (il n'y a pas de session utilisateur dans un cron).
- **Pattern de test** : mocker `~/env`, `~/server/db`, et (pour la route) `~/server/purge`. Construire une `Request`/`new Request(url, { headers })` pour tester le handler.
- **Conventions** : fonctions camelCase (`purgerRepasExpires`). Aucune donnée de santé en log.

### Référence d'implémentation
```ts
// src/server/purge.ts
import type { PrismaClient } from "../../generated/prisma";
export async function purgerRepasExpires(
  db: Pick<PrismaClient, "repas">,
  maintenant: Date = new Date(),
) {
  return db.repas.deleteMany({ where: { expiresAt: { lt: maintenant } } });
}
```
```ts
// src/app/api/cron/purge/route.ts
import { env } from "~/env";
import { db } from "~/server/db";
import { purgerRepasExpires } from "~/server/purge";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }
  const { count } = await purgerRepasExpires(db);
  return Response.json({ purges: count });
}
```
```json
// vercel.json
{ "crons": [{ "path": "/api/cron/purge", "schedule": "0 3 * * *" }] }
```

### Périmètre — hors de cette story
- **Modèle `Restriction`** et sa cascade → **Epic 3 (story 3.2)** (ici on ne crée pas le modèle ; la cascade participant suffit pour l'instant).
- **Purge manuelle déclenchable par l'organisateur** → non requis (piste de réduction de périmètre, non retenue).
- **Notification avant purge / corbeille** → non requis par l'AC.
- **Rétention configurable** → la durée (30 j) est fixée en 2.1 ; pas d'UI de configuration ici.

### Testing standards
- **Vitest** : `purge.test.ts` et `route.test.ts` en env **node** (pas de DOM). Prisma + env mockés ; aucune base réelle ni réseau.
- Couvrir : (a) borne `lt maintenant`, (b) **401** sans secret (purge non appelée), (c) 200 + count avec secret.

### Definition of Done manuelle (utilisateur, hors agent)
1. Définir `CRON_SECRET` dans `.env` (et sur Vercel en prod).
2. Local : `curl -H "Authorization: Bearer <secret>" http://localhost:3000/api/cron/purge` → `{ "purges": N }` ; sans en-tête → 401.
3. En prod : Vercel exécute le cron quotidiennement ; vérifier les logs d'exécution (sans donnée sensible).

### Project Structure Notes
- Nouveaux : `src/server/purge.ts` (+ test), `src/app/api/cron/purge/route.ts` (+ test), `vercel.json`.
- Modifiés : `src/env.js` + `.env.example` + `.env` (`CRON_SECRET`).
- Aucune nouvelle dépendance, aucune migration (réutilise `Repas.expiresAt` + cascade existante).

### References
- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.5] (énoncé + AC, Vercel Cron + route protégée)
- [Source: _bmad-output/planning-artifacts/architecture.md#Data Architecture] (`expiresAt`, purge RGPD) ; [#Gap Analysis Results] (purge planifiée = Vercel Cron + route protégée)
- [Source: _bmad-output/implementation-artifacts/2-1-creer-un-repas.md] (`Repas.expiresAt` = date + 30 j)
- [Source: _bmad-output/implementation-artifacts/2-2-ajouter-des-participants.md] (`Participant.repas onDelete: Cascade`)

## Dev Agent Record

### Agent Model Used

claude-opus-4-8 (bmad-dev-story)

### Debug Log References

- `npm run test` → **65/65** ✅ (+4 : purge ×1, route ×3) · `lint` ✅ · `typecheck` ✅ · `build` ✅ (`/api/cron/purge`).
- Route testée sans réseau/DB : `~/env`, `~/server/db`, `~/server/purge` mockés ; `Request` construit à la main.

### Completion Notes List

- ✅ **Purge planifiée** : route `GET /api/cron/purge` protégée par `CRON_SECRET` (401 sinon) ; supprime les repas `expiresAt < maintenant` (cascade participants). Aucun log de donnée sensible (NFR6).
- ✅ **Vercel Cron** configuré (`vercel.json`, quotidien 03:00 UTC). Nouvel env `CRON_SECRET`.
- ✅ Logique de purge isolée et pure (`purgerRepasExpires`) → testable sans DB.
- **À garantir en 3.2** : `Restriction.participant onDelete: Cascade` pour que la purge emporte aussi les restrictions.
- **À faire par l'utilisateur (DoD manuelle)** : définir `CRON_SECRET` (`.env` + Vercel) ; tester `curl -H "Authorization: Bearer <secret>" .../api/cron/purge`.

### File List

- `src/server/purge.ts` + `src/server/purge.test.ts` (NOUVEAUX — logique de purge)
- `src/app/api/cron/purge/route.ts` + `route.test.ts` (NOUVEAUX — route protégée)
- `vercel.json` (NOUVEAU — planification cron)
- `src/env.js` + `.env.example` + `.env` (MODIFIÉS — `CRON_SECRET`)

### Review Findings (revue complète, 2026-06-25)

> ✅ Revue **complète** (3 couches). Tous les AC satisfaits.

- [x] [Review][Dismiss] **CSRF/prefetch sur le `GET` destructeur** — écarté : l'auth se fait par secret dans l'en-tête `Authorization` (non forgeable en cross-site, contrairement aux cookies) ; prefetch/crawler → 401 ; Vercel Cron invoque bien en `GET`. Pas de faille.

- [x] [Review][Patch] **Comparaison du secret cron non constante en temps** — `timingSafeEqual` (Buffer) à la place de `!==`. [src/app/api/cron/purge/route.ts]
- [x] [Review][Dismiss] `deleteMany` sans batch/transaction — volume V1 négligeable, pattern standard ; le secret protège déjà l'endpoint.

### Change Log

- 2026-06-22 : Story 2.5 implémentée — purge planifiée des repas expirés (route protégée par secret + Vercel Cron). Tests 65/65, lint/typecheck/build verts. Statut → review.
- 2026-06-25 : Revue complète — comparaison du secret en temps constant ; CSRF du GET écarté (auth par en-tête). Tous AC OK. Statut → done.
