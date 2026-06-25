---
baseline_commit: 898d9703f4036aa98eae67e3156e77e8128950d0
---

# Story 2.2: Ajouter des participants

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As an organisateur,
I want ajouter mes convives à un repas,
so that chacun pourra renseigner ses contraintes. (FR2)

## Acceptance Criteria

1. **Given** un repas qui m'appartient, **When** j'ajoute un participant avec au moins un **prénom** (email **optionnel**), **Then** un `Participant` est enregistré, **rattaché au repas**, avec le statut **« en attente »** (`EN_ATTENTE`).
2. **Given** la page d'un repas, **When** j'ajoute plusieurs participants, **Then** je peux en ajouter **autant que voulu** ; ils s'affichent dans la liste des participants du repas.
3. **Given** un participant **sans email**, **When** je l'ajoute, **Then** il est **accepté** (l'email n'est pas requis) ; un email fourni doit être valide.
4. **Given** la frontière de sécurité, **When** j'ajoute un participant à un repas, **Then** l'opération **vérifie que le repas m'appartient** (l'`organisateurId` du repas = la session) — impossible d'ajouter un participant au repas d'autrui ; procédure **protégée**.
5. **Given** chaque participant créé, **When** il est enregistré, **Then** un **`accessToken` cryptographique non-devinable (256 bits)** unique lui est attribué (base de l'URL `/p/{token}` — sa **diffusion** est la story 2.3). NFR4.
6. **Given** les validations, **When** je lance `npm run test`, `npm run lint`, `npm run typecheck`, `build`, **Then** tout reste vert ; les tests d'intégration du router passent **sans base réelle** (Prisma mocké).

## Tasks / Subtasks

- [x] **Tâche 1 — Modèle Prisma `Participant` + enum** (AC: 1, 3, 5)
  - [x] `enum StatutParticipant { EN_ATTENTE REPONDU }` + modèle `Participant` (repasId+relation Cascade, prenom, email?, accessToken `@unique`, statut `@default(EN_ATTENTE)`, timestamps, `@@index([repasId])`).
  - [x] Relation inverse `participants Participant[]` sur `Repas`. `npx prisma generate` OK. (`db:push` manuel.)
- [x] **Tâche 2 — Générateur de token participant** (AC: 5)
  - [x] `src/lib/tokens.ts` : `genererAccessToken()` = `randomBytes(32).toString("base64url")` (256 bits, URL-safe). Tests : format + unicité (100 tokens distincts).
- [x] **Tâche 3 — Router : ajouter & lister les participants** (AC: 1, 2, 3, 4)
  - [x] `ajouterParticipant` (protected) : vérif appartenance (`findFirst` scopé → `NOT_FOUND` sinon), création avec `accessToken`, email optionnel (transform `""`→undefined).
  - [x] `repasDetail` (protected) : repas scopé organisateur + `include participants`, `NOT_FOUND` sinon.
- [x] **Tâche 4 — Page détail `/repas/[id]`** (AC: 1, 2)
  - [x] `repas/[id]/page.tsx` (RSC) : entête repas + `AjouterParticipantForm` + `ParticipantsListe` ; `NOT_FOUND` → `notFound()`.
  - [x] `AjouterParticipantForm` (client) : prénom + email + mutation, succès → invalidate `repasDetail` + reset, anti double-soumission, Banner danger sur échec.
  - [x] `ParticipantsListe` : ligne par participant (prénom, email, badge statut icône+texte), typé via `inferRouterOutputs`.
- [x] **Tâche 5 — Lien depuis « Mes repas »** (AC: 2)
  - [x] `RepasListe` : chaque carte est un `<Link href="/repas/{id}">` (focus ring conforme).
- [x] **Tâche 6 — Tests** (AC: 3, 4, 5, 6)
  - [x] `organisateur.test.ts` : repas non possédé → `NOT_FOUND` sans création ; création avec `accessToken` ; email absent accepté ; `repasDetail` filtré session.
  - [x] `tokens.test.ts` (format/unicité) ; `ParticipantsListe.test.tsx` (prénom + statut + état vide).
- [x] **Tâche 7 — Validations** (AC: 6)
  - [x] `npm run test` → 51/51 ✅ · `lint` ✅ · `typecheck` ✅ · `SKIP_ENV_VALIDATION=1 build` ✅.

## Dev Notes

### ⚠️ Pièges critiques (lire avant de coder)

1. **Vérification d'appartenance OBLIGATOIRE.** Le `repasId` arrive du client : avant toute écriture/lecture, vérifier `repas.organisateurId === ctx.session.user.id` via un `findFirst` scopé. Sans ça, un organisateur pourrait ajouter des participants au repas d'un autre (faille d'autorisation). C'est l'application de l'anti-pattern proscrit par l'architecture (« jamais d'id client de confiance »).
2. **`accessToken` = 256 bits non-devinable (NFR4).** `crypto.randomBytes(32)` (32 octets = 256 bits), encodé `base64url` (URL-safe, pas de `+/=`). **Ne PAS** utiliser `Math.random`, `cuid` ou un uuid v4 (122 bits) pour le token d'accès participant. Champ `@unique`.
3. **Token généré DÈS la création du participant (story 2.2)** pour que le modèle soit complet et que la story 2.3 (URL `/p/{token}`, envoi email, copie) n'ait **pas besoin d'une nouvelle migration**. 2.2 = génération + persistance ; 2.3 = diffusion.
4. **Pas encore de route participant.** Le modèle porte `accessToken`, mais la route `/p/[token]` et le `participantRouter` (Epic 3) n'existent pas ici — **ne rien exposer côté participant** dans cette story. Frontière orga/participant intacte.
5. **`npx prisma generate` après modif du schéma** sinon `db.participant` / `StatutParticipant` ne sont pas typés (typecheck rouge).

### État réel du projet (vérifié — acquis story 2.1)
- **Modèle `Repas`** en place (`organisateurId`, relation `User`). Ajouter la relation `participants Participant[]` dessus.
- **Router `organisateur`** existant (`creerRepas`, `mesRepas`) — y **ajouter** `ajouterParticipant` + `repasDetail`, ne pas créer un nouveau router. `protectedProcedure` réutilisé.
- **tRPC** : RSC via `import { api } from "~/trpc/server"` ; client via `~/trpc/react` (`useMutation`, `useUtils().organisateur.X.invalidate()`).
- **`error.tsx`** du segment `(organisateur)` existe (story 2.1) — gère un échec runtime ; pour un repas introuvable, préférer `notFound()` (de `next/navigation`) → 404 propre, ou laisser remonter le `NOT_FOUND` tRPC.
- **Composants** : `Input`, `Button`, `Banner`, `Chip` (variantes allergie/regime/non-aime — pour un statut « en attente », utiliser un `Chip` neutre ou un petit badge texte ; **ne pas** détourner une variante de sécurité). `RepasListe` (à rendre cliquable).
- **Pattern de test** : mocker `~/server/auth` + `~/server/db`, injecter le contexte (`session`, `db` mocké), `appRouter.createCaller(ctx)`. Cf. `organisateur.test.ts` de 2.1.
- **Conventions** : modèles PascalCase, champs camelCase, enums `SCREAMING_SNAKE` (`EN_ATTENTE`, `REPONDU`), procédures `verbeNom` FR (`ajouterParticipant`).
- **Route group** `(organisateur)` protégé par la garde du layout (1.4) → `/repas/[id]` en hérite.

### Validation email optionnel (piège Zod)
- Un `<input type="email">` vide renvoie `""`. `z.string().email()` rejette `""`. Pour rendre l'email **optionnel** : `z.string().trim().email().optional().or(z.literal("")).transform((v) => (v ? v : undefined))` — accepte absent **ou** chaîne vide, valide si fourni. Stocker `undefined` (→ `null` en base) quand vide.

### Accessibilité / UX
- Formulaire : prénom requis (label associé), email optionnel clairement indiqué. Cibles ≥ 44px (composants 1.2).
- Statut « en attente » : **icône + texte** (NFR8), jamais la couleur seule.
- Microcopy FR chaleureuse (EXPERIENCE.md).

### Périmètre — hors de cette story
- **URL `/p/{token}`, envoi d'email d'invitation, copie du lien** → **story 2.3** (le token existe déjà ici).
- **Affichage/suivi du statut « a répondu »** (passage `REPONDU`) → **story 2.4** (ici : statut figé à `EN_ATTENTE` à la création).
- **Saisie des restrictions par le participant** (modèle `Restriction`, route `/p/[token]`) → **Epic 3**.
- **Édition / suppression d'un participant** → non requis par l'AC.

### Testing standards
- **Vitest** : router en env node (Prisma mocké), `tokens.test.ts` (node), `ParticipantsListe.test.tsx` (RTL/jsdom). Co-localiser.
- Couvrir le **cas de sécurité** (repas non possédé → rejet) — c'est le test le plus important de cette story.

### Definition of Done manuelle (utilisateur, hors agent)
1. `DATABASE_URL` Postgres + `npm run db:push` (crée `Participant` + enum).
2. `npm run dev` → ouvrir un repas → ajouter un participant (avec et sans email) → vérifier la liste + le statut « en attente ».

### Project Structure Notes
- Nouveaux : `src/lib/tokens.ts` (+ test), `src/app/(organisateur)/repas/[id]/page.tsx`, `src/components/organisateur/AjouterParticipantForm.tsx`, `src/components/organisateur/ParticipantsListe.tsx` (+ test).
- Modifiés : `prisma/schema.prisma` (`Participant` + enum + `Repas.participants`), `src/server/api/routers/organisateur.ts` (+ test), `src/components/organisateur/RepasListe.tsx` (cartes cliquables).
- Aucune nouvelle dépendance npm (`node:crypto` natif).

### References
- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.2] (énoncé + AC) ; [#Story 2.3] (token/diffusion, périmètre voisin)
- [Source: _bmad-output/planning-artifacts/architecture.md#Data Architecture] (modèle `Participant`, `accessToken`, statut)
- [Source: _bmad-output/planning-artifacts/architecture.md#Authentication & Security] (token 256 bits `crypto.randomBytes`, frontière orga/participant)
- [Source: _bmad-output/planning-artifacts/architecture.md#Process Patterns] (vérifier l'appartenance, jamais d'id client de confiance)
- [Source: _bmad-output/implementation-artifacts/2-1-creer-un-repas.md] (router `organisateur`, modèle `Repas`, pattern de test Prisma mocké, `error.tsx`)

## Dev Agent Record

### Agent Model Used

claude-opus-4-8 (bmad-dev-story)

### Debug Log References

- `npx prisma generate` OK (`Participant` + `StatutParticipant` typés).
- `npm run test` → **51/51** ✅ (+8 : participants ×4, token ×2, ParticipantsListe ×2) · `lint` ✅ · `typecheck` ✅ · `build` ✅.
- Test de sécurité central : `ajouterParticipant` sur un repas non possédé → `NOT_FOUND`, `participant.create` jamais appelé.

### Completion Notes List

- ✅ Modèle `Participant` (rattaché au `Repas`, statut `EN_ATTENTE`, `accessToken` 256 bits `@unique`).
- ✅ **Vérification d'appartenance** sur `ajouterParticipant` et `repasDetail` (repas scopé à la session — impossible d'agir sur le repas d'autrui).
- ✅ `accessToken` généré **dès la création** (`src/lib/tokens.ts`, `crypto.randomBytes(32)` base64url) — modèle complet pour la story 2.3 (diffusion), pas de migration future.
- ✅ Page `/repas/[id]` : ajout de participants (prénom requis, email optionnel) + liste avec badge de statut (icône + texte). Cartes « Mes repas » désormais cliquables.
- **À faire par l'utilisateur (DoD manuelle)** : `db:push` (crée `Participant` + enum) puis test bout-en-bout d'ajout.
- **Hors périmètre** : diffusion du lien `/p/{token}` + email + copie (2.3), passage au statut `REPONDU` (2.4), saisie des restrictions (Epic 3).

### File List

- `prisma/schema.prisma` (MODIFIÉ — `Participant` + enum `StatutParticipant` + `Repas.participants`)
- `src/lib/tokens.ts` + `src/lib/tokens.test.ts` (NOUVEAUX — token 256 bits)
- `src/server/api/routers/organisateur.ts` + `organisateur.test.ts` (MODIFIÉS — `ajouterParticipant`, `repasDetail`)
- `src/app/(organisateur)/repas/[id]/page.tsx` (NOUVEAU — détail repas)
- `src/components/organisateur/AjouterParticipantForm.tsx` (NOUVEAU — formulaire client)
- `src/components/organisateur/ParticipantsListe.tsx` + `ParticipantsListe.test.tsx` (NOUVEAUX — liste + badge statut)
- `src/components/organisateur/RepasListe.tsx` (MODIFIÉ — cartes cliquables)

### Review Findings (revue complète, 2026-06-25)

> ✅ Revue **complète** (3 couches : Blind Hunter en sous-agent ; Edge Case Hunter + Acceptance Auditor menés en direct). Tous les AC de la story satisfaits.

- [x] [Review][Patch] **Aucun plafond de participants** (vecteur d'abus / coûts Resend) — `ajouterParticipant` refuse au-delà de **50** participants par repas (`BAD_REQUEST`). [src/server/api/routers/organisateur.ts]
- [x] [Review][Dismiss] Validation `repasId.cuid()` — non nécessaire : l'IDOR est déjà bloqué par le filtrage `organisateurId` (pas de confiance à l'id client).

### Change Log

- 2026-06-22 : Story 2.2 implémentée — modèle `Participant` + token d'accès 256 bits, ajout/listing des participants (router scopé, page `/repas/[id]`). Tests 51/51, lint/typecheck/build verts. Statut → review.
- 2026-06-25 : Revue complète — plafond de participants (50). Tous AC OK, 69 tests verts. Statut → done.
