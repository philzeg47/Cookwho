---
baseline_commit: 15f78c83f398a69e7cef4ba550136ac667414e40
---

# Story 2.1: Créer un repas

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As an organisateur,
I want créer un repas avec ses informations (lieu, date, heure),
so that je peux commencer à organiser le déjeuner. (FR1)

## Acceptance Criteria

1. **Given** une session organisateur active, **When** je renseigne lieu, date et heure et que je valide, **Then** un `Repas` est créé en base, **rattaché à mon compte** (`organisateurId` = l'utilisateur de la session), avec un `expiresAt` (garde-fou RGPD).
2. **Given** un repas créé, **When** je reviens sur `/repas`, **Then** il **apparaît dans « Mes repas »** (la liste réelle remplace l'état vide dès qu'il y a au moins un repas).
3. **Given** un repas affiché, **When** je le consulte, **Then** **lieu, date et heure sont réaffichés correctement** (date formatée en français).
4. **Given** la frontière de sécurité, **When** je liste ou crée un repas, **Then** seules **mes** données sont accessibles — un organisateur ne voit jamais les repas d'un autre (filtrage par `organisateurId` issu de la session, jamais d'un id client). La procédure est **protégée** (session requise).
5. **Given** une saisie invalide (lieu vide, date/heure manquante ou mal formée), **When** je valide, **Then** la création est **refusée** avec un message clair (validation Zod à la frontière tRPC) ; aucun `Repas` partiel n'est créé.
6. **Given** les validations, **When** je lance `npm run test`, `npm run lint`, `npm run typecheck`, `build`, **Then** tout reste vert ; les tests d'intégration du router passent **sans base réelle** (Prisma mocké).

## Tasks / Subtasks

- [x] **Tâche 1 — Modèle Prisma `Repas` + migration** (AC: 1)
  - [x] Modèle `Repas` ajouté (`id` cuid, `organisateurId`+relation `User` onDelete Cascade, `lieu`, `date`, `heure`, `createdAt`, `expiresAt`, `@@index([organisateurId])`).
  - [x] Relation inverse `repas Repas[]` sur `User`.
  - [x] `npx prisma generate` OK. `db:push` = **manuel utilisateur** (DB requise, voir DoD).
- [x] **Tâche 2 — Router tRPC `organisateur`** (AC: 1, 4, 5)
  - [x] `src/server/api/routers/organisateur.ts` : `creerRepas` (protected, Zod, `organisateurId` = session, `expiresAt` via helper) + `mesRepas` (protected, filtré sur la session).
  - [x] Branché dans `root.ts` (`organisateur` à côté de `health`).
  - [x] `organisateurId` toujours issu de `ctx.session.user.id`.
- [x] **Tâche 3 — Formulaire de création `/repas/creer`** (AC: 1, 3, 5)
  - [x] `CreerRepasForm` (`'use client'`) : `Input` lieu/date/heure + `Button`, mutation `creerRepas.useMutation`, succès → invalidate `mesRepas` + `router.push("/repas")`, échec → Banner danger.
  - [x] Page `src/app/(organisateur)/repas/creer/page.tsx` (protégée par le layout du groupe).
- [x] **Tâche 4 — Liste réelle dans `/repas`** (AC: 2, 3)
  - [x] `repas/page.tsx` (RSC) : `await api.organisateur.mesRepas()` → `EtatVideRepas` si vide, sinon `RepasListe` + bouton « Créer un repas ».
  - [x] `RepasListe` : carte par repas (lieu, date `fr-FR`, heure).
- [x] **Tâche 5 — Tests** (AC: 4, 5, 6)
  - [x] `organisateur.test.ts` (node, Prisma mocké) : scoping `organisateurId`, `expiresAt` défini, filtrage `mesRepas`, `UNAUTHORIZED` non authentifié, rejet Zod heure invalide.
  - [x] `repas.test.ts` : `computeExpiresAt` (+30 j, immuabilité). `RepasListe.test.tsx` : rendu lieu/date/heure.
- [x] **Tâche 6 — Validations** (AC: 6)
  - [x] `npm run test` → 41/41 ✅ · `npm run lint` ✅ · `npm run typecheck` ✅.
  - [x] `SKIP_ENV_VALIDATION=1 npm run build` ✅ (routes `/repas` + `/repas/creer`).

## Dev Notes

### ⚠️ Pièges critiques (lire avant de coder)

1. **Premier schéma métier = première migration.** Le code et les tests (Prisma mocké) avancent **sans** DB, mais `db:push`/`migrate` et la vérification fonctionnelle exigent une **Postgres accessible** (`DATABASE_URL`). C'est une étape **manuelle utilisateur** (DoD).
2. **`organisateurId` vient TOUJOURS de `ctx.session.user.id`** — jamais d'un champ client (anti-pattern proscrit par l'architecture : pas de route polyvalente décidant des droits par `if`). `mesRepas` filtre sur la session.
3. **Frontière orga/participant** : ce router est `organisateur` (procédures **protégées**). Ne rien y mettre qui exposerait des recettes (Epic 4/5). Le futur `participantRouter` sera séparé.
4. **Client Prisma généré dans `generated/prisma`** (pas `@prisma/client`) — `import { db } from "~/server/db"` ; les types `Repas` viennent de `generated/prisma`. Après modif du schéma : **`npx prisma generate`** sinon le type `db.repas` n'existe pas et le typecheck casse.
5. **`appRouter` n'est plus vide** (procédure `health` ajoutée en revue Epic 1) — ajouter `organisateur` à côté, ne pas retirer `health`.

### État réel du projet (vérifié)
- **Next 15.x App Router**, React 19, **tRPC v11**, **Prisma 6** (client `generated/prisma`), Auth.js v5, Tailwind v4, Vitest + RTL/jsdom.
- **`protectedProcedure`** existe déjà (`src/server/api/trpc.ts`) : vérifie `ctx.session?.user`, lève `UNAUTHORIZED` sinon, et type `ctx.session.user` non-null. **Réutiliser tel quel.**
- **Contexte tRPC** (`createTRPCContext`) expose `{ db, session, headers }`.
- **Appel RSC** : `import { api } from "~/trpc/server"` → `await api.organisateur.mesRepas()`. **Appel client** : `import { api } from "~/trpc/react"` → `api.organisateur.creerRepas.useMutation()`.
- **Modèle `User` = l'organisateur** (décision Epic 1, PrismaAdapter). La relation `repas Repas[]` s'ajoute à `User`.
- **Segment `(organisateur)` déjà protégé** par `layout.tsx` (garde `auth()` → `/connexion`). `/repas/creer` en hérite — la route `/repas/creer` (lien mort en 1.4) devient réelle ici.
- **Composants dispo** : `Input`, `Button`, `Banner`, `Chip`, `SafeBadge` (`~/components/ui/*`).

### `expiresAt` — politique de TTL (défaut retenu, à confirmer)
- L'architecture impose un `expiresAt` sur `Repas` (purge RGPD planifiée — story 2.5) mais **ne fixe pas la durée** (« pas de rétention définie en V1 ; garde-fou gratuit »).
- **Défaut retenu pour cette story : `expiresAt = date du repas + 30 jours`.** Centraliser le calcul dans un petit helper (`src/lib/repas.ts` : `computeExpiresAt(date)`), pur et **testable**.
- (Question ouverte posée en fin de création — la valeur est ajustable sans refonte.)

### Modélisation date/heure (suivre l'architecture)
- L'architecture liste `date` ET `heure` séparément → `date DateTime` (le jour) + `heure String` (`"HH:mm"`). Le formulaire envoie `date` (input date) et `heure` (input time « HH:mm »).
- Re-affichage (AC3) : `new Intl.DateTimeFormat("fr-FR", { dateStyle: "long" }).format(repas.date)` + `repas.heure`.
- Zod : `date: z.coerce.date()` (parse la string ISO du `<input type=date>`), `heure: z.string().regex(/^\d{2}:\d{2}$/)`.

### Test du router sans DB (pattern à réutiliser ensuite)
```ts
import { appRouter } from "~/server/api/root";
const mockDb = { repas: { create: vi.fn().mockResolvedValue(repasFactice), findMany: vi.fn().mockResolvedValue([]) } };
const ctx = { db: mockDb, session: { user: { id: "orga-1" } }, headers: new Headers() };
const caller = appRouter.createCaller(ctx as never);
await caller.organisateur.creerRepas({ lieu: "Chez Léa", date: new Date("2026-07-01"), heure: "12:30" });
expect(mockDb.repas.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ organisateurId: "orga-1" }) }));
```
- Pour le cas non authentifié : `ctx.session = null` → `creerRepas` doit rejeter (`UNAUTHORIZED`). (Le rappel mémoire next-auth/Vitest ne s'applique pas ici : on n'importe pas `~/server/auth`, on injecte une session factice dans le contexte.)

### Accessibilité / UX
- Formulaire : labels associés (via `Input`), champs ≥ 44px, focus visible (déjà géré par les composants 1.2), microcopy FR.
- Liste : cartes lisibles, date en clair. Pas de sens porté par la seule couleur (NFR8).

### Périmètre — hors de cette story
- **Ajouter des participants / `accessToken` / invitations** → stories 2.2 / 2.3.
- **Suivi des réponses** → 2.4. **Purge planifiée (cron)** → 2.5 (on pose `expiresAt`, on ne purge pas ici).
- **Édition / suppression d'un repas** → non demandé par l'AC (hors périmètre).
- **Modèles `Participant` / `Restriction`** → introduits par les stories qui en ont besoin (2.2 / Epic 3).

### Testing standards
- **Vitest** : test d'intégration du router en env node (Prisma mocké) ; test du helper `computeExpiresAt` ; test RTL de `RepasListe`.
- Co-localiser les tests. Ne pas dépendre d'une DB réelle dans la CI.

### Definition of Done manuelle (utilisateur, hors agent)
1. Provisionner une **Postgres** (Neon/Supabase ou locale) et renseigner `DATABASE_URL` dans `.env`.
2. `npm run db:push` pour créer la table `Repas`.
3. `npm run dev` → se connecter → `/repas/creer` → créer un repas → vérifier qu'il apparaît dans `/repas` avec lieu/date/heure corrects.

### Project Structure Notes
- Nouveaux : `prisma` (modèle `Repas`), `src/server/api/routers/organisateur.ts` (+ test), `src/lib/repas.ts` (+ test), `src/app/(organisateur)/repas/creer/page.tsx`, `src/components/organisateur/RepasListe.tsx` (+ test).
- Modifiés : `prisma/schema.prisma` (modèle + relation `User.repas`), `src/server/api/root.ts` (router), `src/app/(organisateur)/repas/page.tsx` (liste réelle).
- Aucune nouvelle dépendance npm.

### References
- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.1] (énoncé + AC)
- [Source: _bmad-output/planning-artifacts/architecture.md#Data Architecture] (modèle `Repas`, `expiresAt`, Zod aux frontières)
- [Source: _bmad-output/planning-artifacts/architecture.md#Authentication & Security] (frontière orga/participant, jamais d'id client)
- [Source: _bmad-output/planning-artifacts/architecture.md#Naming Patterns] (`organisateurRouter`, `creerRepas`, modèles PascalCase, champs camelCase)
- [Source: _bmad-output/implementation-artifacts/1-4-espace-mes-repas.md] (`/repas`, `(organisateur)` protégé, `EtatVideRepas`, lien `/repas/creer`)
- [Source: _bmad-output/implementation-artifacts/1-3-connexion-organisateur-par-lien-magique.md] (`User` = organisateur, session.user.id)

## Dev Agent Record

### Agent Model Used

claude-opus-4-8 (bmad-dev-story)

### Debug Log References

- `npx prisma generate` OK (modèle `Repas` typé dans `generated/prisma`).
- `npm run test` → **41/41** ✅ (+7 : router ×4, helper ×2, RepasListe ×1) · `lint` ✅ · `typecheck` ✅ · `build` ✅ (routes `/repas` + `/repas/creer` dynamiques).
- Test du router : `~/server/auth` et `~/server/db` mockés (évite le runtime next-auth + l'I/O), contexte injecté à la main → pattern réutilisable pour les futurs routers.

### Completion Notes List

- ✅ Premier **schéma métier** : modèle `Repas` (rattaché à `User`/organisateur, `expiresAt` = date + 30 j via `computeExpiresAt`).
- ✅ **Router `organisateur`** (protégé) : `creerRepas` (Zod, scoping session) + `mesRepas` (filtré session) ; frontière de sécurité respectée (jamais d'id client).
- ✅ **Création** via `/repas/creer` (form client tRPC) ; **liste réelle** sur `/repas` (RSC) remplaçant l'état vide.
- ✅ `expiresAt` = **date du repas + 30 jours** (politique validée).
- **À faire par l'utilisateur (DoD manuelle)** : `DATABASE_URL` Postgres réelle + `npm run db:push`, puis test bout-en-bout création → liste.
- **Hors périmètre** : participants/`accessToken`/invitations (2.2/2.3), suivi réponses (2.4), purge cron (2.5), édition/suppression.

### File List

- `prisma/schema.prisma` (MODIFIÉ — modèle `Repas` + relation `User.repas`)
- `src/lib/repas.ts` + `src/lib/repas.test.ts` (NOUVEAUX — `computeExpiresAt`)
- `src/server/api/routers/organisateur.ts` + `organisateur.test.ts` (NOUVEAUX — router protégé)
- `src/server/api/root.ts` (MODIFIÉ — branchement `organisateur`)
- `src/app/(organisateur)/repas/creer/page.tsx` (NOUVEAU — page de création)
- `src/components/organisateur/CreerRepasForm.tsx` (NOUVEAU — formulaire client tRPC)
- `src/components/organisateur/RepasListe.tsx` + `RepasListe.test.tsx` (NOUVEAUX — liste)
- `src/app/(organisateur)/repas/page.tsx` (MODIFIÉ — liste réelle `mesRepas`)

### Review Findings (revue de code, 2026-06-22)

- [x] [Review][Decision→Patch] Dates passées refusées — `z.coerce.date().refine(d >= aujourd'hui)` + message clair. [src/server/api/routers/organisateur.ts]
- [x] [Review][Patch] **Bug de fuseau horaire corrigé** — date construite à midi (`${date}T12:00:00`) + affichage `timeZone: "Europe/Paris"`. Plus de décalage de jour sur serveur UTC. [src/components/organisateur/CreerRepasForm.tsx, RepasListe.tsx]
- [x] [Review][Patch] `lieu` durci — `z.string().trim().min(1).max(200)`. [src/server/api/routers/organisateur.ts]
- [x] [Review][Patch] Regex `heure` bornée — `/^([01]\d|2[0-3]):[0-5]\d$/`. [src/server/api/routers/organisateur.ts]
- [x] [Review][Patch] `error.tsx` ajouté au segment organisateur (Banner danger + Réessayer). [src/app/(organisateur)/error.tsx]
- [x] [Review][Patch] Garde double-soumission — `if (creerRepas.isPending) return;`. [src/components/organisateur/CreerRepasForm.tsx]
- [x] [Review][Patch] `RepasListe` typé via `inferRouterOutputs<AppRouter>` (source de vérité = tRPC). [src/components/organisateur/RepasListe.tsx]
- [x] [Review][Patch] Tests AC5 ajoutés — lieu espaces refusé + date passée refusée. [src/server/api/routers/organisateur.test.ts]
- [x] [Review][Defer] Aucun historique de migration Prisma (`db push` seul, dossier `prisma/migrations/` absent) — initialiser `prisma migrate dev --name init` **quand la DB sera provisionnée** (nécessite une connexion). [prisma/] — deferred, nécessite la DB utilisateur
- [x] [Review][Defer] Filtrage des repas expirés à l'affichage (`mesRepas`) — à trancher avec la purge planifiée. [src/server/api/routers/organisateur.ts] — deferred, story 2.5

### Change Log

- 2026-06-22 : Story 2.1 implémentée — modèle `Repas` + router `organisateur` (creerRepas/mesRepas), page de création et liste réelle. Tests 41/41, lint/typecheck/build verts. Statut → review.
- 2026-06-22 : Revue de code — 8 findings traités (bug fuseau horaire, refus dates passées, durcissement lieu/heure, error.tsx, anti double-soumission, type tRPC, tests AC5). 2 déférés (migration Prisma → DB requise ; filtrage expirés → 2.5). Tests 43/43. Statut → done.
