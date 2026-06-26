---
baseline_commit: 5abb2089873df8e7cdbe9928c9cdc59f02f1fd25
---

# Story 3.1: Accès participant par lien, sans compte

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a participant,
I want ouvrir mon lien d'invitation et arriver sur ma page personnelle,
so that je renseigne mes contraintes sans créer de compte. (FR5)

## Acceptance Criteria

1. **Given** un lien d'invitation **valide** (`/p/{token}`), **When** je l'ouvre (souvent sur mobile), **Then** j'arrive sur **ma page personnelle**, **pré-remplie de mon prénom**, **sans authentification** (pas de connexion, pas de compte).
2. **Given** ma page, **When** elle s'affiche, **Then** elle me situe le repas (lieu / date / heure) et m'annonce ce que je vais faire (renseigner mes préférences) — sans jamais exposer le menu ni les recettes (NFR5), ni les autres participants.
3. **Given** un **token invalide / inconnu**, **When** j'ouvre le lien, **Then** un **message clair** s'affiche (ton Cocon), **sans fuite d'information** (ne pas révéler si le token a existé, ni de données d'un repas/participant).
4. **Given** un mobile, **When** j'utilise la page, **Then** elle est **pleinement utilisable** (mobile-first, responsive, cibles ≥ 44px) (NFR7).
5. **Given** la confidentialité, **When** la page se charge, **Then** le **token ne fuit pas via `Referer`** (`Referrer-Policy: no-referrer` sur la route `/p/[token]`).
6. **Given** les validations, **When** je lance `npm run test`, `npm run lint`, `npm run typecheck`, `build`, **Then** tout reste vert ; le router participant est testé **sans base réelle** (Prisma mocké), y compris le cas token invalide.

## Tasks / Subtasks

- [x] **Tâche 1 — Router tRPC `participant` (scopé au token)** (AC: 1, 2, 3)
  - [x] `src/server/api/routers/participant.ts` : `monAcces` (`publicProcedure`, input `{ token }`) → `findUnique({ where: { accessToken }, select: { prenom, repas: { lieu, date, heure } } })` ; `NOT_FOUND` sinon. Aucun accès recette/autres participants.
  - [x] Branché dans `root.ts` (`participant`, à côté de `health`/`organisateur`).
- [x] **Tâche 2 — Route publique `/p/[token]`** (AC: 1, 2, 3, 5)
  - [x] `src/app/p/[token]/page.tsx` (RSC, hors `(organisateur)`) : `metadata.referrer = "no-referrer"` ; `NOT_FOUND` → `LienInvalide` (pas de 404 brut, pas de fuite) ; sinon `AccueilParticipant`.
- [x] **Tâche 3 — Composants participant** (AC: 2, 3, 4)
  - [x] `AccueilParticipant.tsx` (accueil prénom + repas + SafeBadge, mobile-first) ; `LienInvalide.tsx` (message générique sans fuite).
- [x] **Tâche 4 — Tests** (AC: 1, 3, 6)
  - [x] `participant.test.ts` : token connu → `{ prenom, repas }` + assertion que le `select` n'inclut ni recette ni autres participants ; token inconnu → `NOT_FOUND`.
  - [x] `AccueilParticipant.test.tsx` (prénom + repas) ; `LienInvalide.test.tsx` (message).
- [x] **Tâche 5 — Validations** (AC: 6)
  - [x] `npm run test` → 73/73 ✅ · `lint` ✅ · `typecheck` ✅ · `SKIP_ENV_VALIDATION=1 build` ✅ (`/p/[token]`).

## Dev Notes

### ⚠️ Pièges critiques (lire avant de coder)

1. **Frontière orga/participant — la plus importante.** `participantRouter` est **séparé** d'`organisateurRouter`. Il utilise **`publicProcedure`** (aucune session : le participant n'a pas de compte). L'autorisation vient **uniquement du token**. Ce router **ne doit jamais** exposer de recette ni un autre participant. (Architecture : « participantRouter scopé au token, sans aucun accès aux recettes ».)
2. **Pas de fuite d'information sur token invalide.** Même message/typage pour « token inexistant » — ne révéler ni l'existence du token, ni de données. Pas de `notFound()` qui exposerait une 404 distincte exploitable ; afficher un état habillé générique.
3. **`Referrer-Policy: no-referrer`** sur `/p/[token]` (finding de revue 2.3) : le token est dans l'URL ; sans cette politique, il fuit dans l'en-tête `Referer` des ressources tierces. `export const metadata = { referrer: "no-referrer" }` suffit (Next génère la balise meta).
4. **Route HORS du groupe `(organisateur)`** : `src/app/p/[token]/page.tsx` n'hérite **pas** de la garde `auth()` du layout organisateur (sinon le participant serait renvoyé vers `/connexion`). Vérifier qu'aucun layout parent n'impose de session.
5. **`findUnique` sur `accessToken`** (champ `@unique`, story 2.2) → efficace. **`select` explicite** (jamais `include` large) pour ne renvoyer que `prenom` + `repas { lieu, date, heure }`.
6. **RSC public + tRPC** : `api` (de `~/trpc/server`) crée un contexte avec `session: null` ; `publicProcedure` fonctionne sans session. OK.

### État réel du projet (vérifié — acquis Epic 2)
- **Modèle `Participant`** : `accessToken @unique`, `prenom`, `email?`, `statut`, relation `repas`. **Réutiliser** — pas de changement de schéma dans cette story.
- **Router `organisateur`** existant (protégé) ; **ajouter** un router `participant` **distinct** (ne pas mélanger). `root.ts` agrège `health` + `organisateur` + (nouveau) `participant`.
- **`publicProcedure`** existe dans `src/server/api/trpc.ts` (pas de garde de session). `protectedProcedure` est réservé à l'organisateur.
- **Appel RSC** : `import { api } from "~/trpc/server"`. **Composants UI Cocon** : `Button`, `Banner`, `SafeBadge`… (`~/components/ui/*`). Nouveau dossier **`src/components/participant/`** (architecture).
- **Mise en forme date** : `new Intl.DateTimeFormat("fr-FR", { dateStyle: "long", timeZone: "Europe/Paris" })` (cohérent avec 2.1/2.2, évite le décalage de fuseau).
- **Pattern de test router** : mocker `~/server/auth`, `~/server/db`, `~/env` ; `appRouter.createCaller({ session: null, db, headers })` puis `caller.participant.monAcces({ token })`.

### Périmètre — hors de cette story
- **Saisie des restrictions en 3 étapes** (régime / allergies / non-aimés + seuil) → **story 3.2** (modèle `Restriction`, assistant, `participantRouter.enregistrerRestrictions`). Ici : accès + accueil **uniquement**.
- **Récapitulatif & confirmation** → story 3.3 ; **modification** → 3.4 ; **états expiré/repas clos** détaillés → story 3.5 (ici : seulement le cas « token invalide/inconnu »).
- **Aucune** vue/route participant n'expose les recettes (NFR5) — vrai pour tout l'Epic 3.

### Accessibilité / UX (NFR7, NFR8, UX-DR5)
- **Mobile-first** : layout vertical, cibles ≥ 44px, texte lisible. Microcopy chaleureuse (EXPERIENCE.md Voice & Tone), accueil personnalisé.
- État « lien invalide » : rassurant, oriente vers l'organisateur, sans culpabiliser ni exposer de données (icône + texte).
- `lang="fr"` déjà au layout racine ; la page hérite du thème Cocon.

### Testing standards
- **Vitest** : `participant.test.ts` (node, Prisma mocké), composants en RTL/jsdom. Co-localiser.
- **Test de sécurité clé** : asserter que `monAcces` appelle `findUnique` avec un `select` limité (pas de recette, pas d'autres participants) et lève `NOT_FOUND` sur token inconnu.

### Definition of Done manuelle (utilisateur, hors agent)
1. DB up + au moins un `Participant` (créé via l'espace organisateur, story 2.2).
2. Ouvrir `/p/{token}` (token réel) → page d'accueil avec prénom + repas. Ouvrir `/p/nimportequoi` → état « lien invalide » (pas de 404 brut, pas de fuite).
3. Vérifier sur mobile (responsive) et l'en-tête `<meta name="referrer" content="no-referrer">` dans le HTML.

### Project Structure Notes
- Nouveaux : `src/server/api/routers/participant.ts` (+ test), `src/app/p/[token]/page.tsx`, `src/components/participant/AccueilParticipant.tsx` (+ test), `src/components/participant/LienInvalide.tsx` (+ test).
- Modifié : `src/server/api/root.ts` (router `participant`).
- Aucune nouvelle dépendance, aucune migration.

### References
- [Source: _bmad-output/planning-artifacts/epics.md#Story 3.1] (énoncé + AC)
- [Source: _bmad-output/planning-artifacts/architecture.md#Authentication & Security] (participant sans compte, token, frontière orga/participant)
- [Source: _bmad-output/planning-artifacts/architecture.md#API & Communication Patterns] (routers séparés, publicProcedure) ; [#Process Patterns] (token → Participant → Repas, jamais d'id client, aucune lecture de recette côté participant)
- [Source: _bmad-output/implementation-artifacts/2-2-ajouter-des-participants.md] (modèle `Participant`, `accessToken`, pattern de test)
- [Source: _bmad-output/implementation-artifacts/2-3-generer-diffuser-les-invitations.md] (URL `/p/{token}`, finding `Referrer-Policy` déféré ici)

## Dev Agent Record

### Agent Model Used

claude-opus-4-8 (bmad-dev-story)

### Debug Log References

- `npm run test` → **73/73** ✅ (+4 : participant router ×2, AccueilParticipant ×1, LienInvalide ×1) · `lint` ✅ · `typecheck` ✅ · `build` ✅ (`/p/[token]`).
- Router participant testé avec `session: null` (publicProcedure) ; `~/server/auth`/`~/server/db`/`~/env` mockés.

### Completion Notes List

- ✅ **Router `participant` distinct** (publicProcedure, token = auth), frontière étanche : `select` limité à `prenom` + `repas { lieu, date, heure }`, **zéro recette**, **zéro autre participant**. Test de sécurité dédié.
- ✅ **Route publique `/p/[token]`** (hors du segment protégé) avec accueil personnalisé mobile-first ; token invalide → `LienInvalide` générique (pas de 404 brut, pas de fuite).
- ✅ **`Referrer-Policy: no-referrer`** via `metadata.referrer` — le finding déféré de la revue 2.3 est traité ; le token ne fuit plus via `Referer`. **Les liens d'invitation de l'Epic 2 sont désormais vivants.**
- **Hors périmètre (suite Epic 3)** : saisie des restrictions en 3 étapes (3.2), récap/confirmation (3.3), modification (3.4), états expiré/clos détaillés (3.5).
- **À faire par l'utilisateur (DoD manuelle)** : DB up + un participant ; ouvrir `/p/{token}` réel (accueil) et `/p/xxx` (lien invalide) ; vérifier la balise `<meta name="referrer" content="no-referrer">`.

### File List

- `src/server/api/routers/participant.ts` + `participant.test.ts` (NOUVEAUX — router scopé au token)
- `src/server/api/root.ts` (MODIFIÉ — branchement `participant`)
- `src/app/p/[token]/page.tsx` (NOUVEAU — page publique participant)
- `src/components/participant/AccueilParticipant.tsx` + `AccueilParticipant.test.tsx` (NOUVEAUX)
- `src/components/participant/LienInvalide.tsx` + `LienInvalide.test.tsx` (NOUVEAUX)

### Change Log

- 2026-06-25 : Story 3.1 implémentée — accès participant sans compte (`/p/[token]`), router `participant` étanche, accueil + état lien invalide, `Referrer-Policy`. Tests 73/73, lint/typecheck/build verts. Statut → review.
