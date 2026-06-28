---
baseline_commit: 898d9703f4036aa98eae67e3156e77e8128950d0
---

# Story 2.3: Générer & diffuser les invitations

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As an organisateur,
I want un lien d'invitation par participant, copiable et envoyable par email,
so that chacun accède à sa page de saisie. (FR3, NFR4)

## Acceptance Criteria

1. **Given** un participant ayant déjà un `accessToken` (256 bits, story 2.2), **When** j'ouvre le détail du repas, **Then** je vois pour chaque participant son **URL d'invitation `/p/{token}`**.
2. **Given** un participant, **When** je clique sur **« Copier le lien »**, **Then** l'URL absolue (`{origine}/p/{token}`) est copiée dans le presse-papiers, avec un retour visuel (« Copié ✓ »).
3. **Given** un participant **avec un email**, **When** je clique sur **« Envoyer l'invitation »**, **Then** CookWho envoie un email d'invitation contenant le lien (via le transport Resend configuré en 1.3) ; un retour de succès/échec s'affiche.
4. **Given** un participant **sans email**, **When** j'ouvre ses actions, **Then** l'envoi par email **n'est pas proposé** (ou désactivé) — seule la copie du lien reste disponible.
5. **Given** la frontière de sécurité, **When** je déclenche un envoi, **Then** l'opération **vérifie que le participant appartient à un repas que je possède** (participant → repas → `organisateurId` = session) ; procédure **protégée**. Aucun token n'est jamais loggé (NFR6).
6. **Given** les validations, **When** je lance `npm run test`, `npm run lint`, `npm run typecheck`, `build`, **Then** tout reste vert ; l'envoi d'email est testé **sans appel réseau réel** (transport mocké).

## Tasks / Subtasks

- [x] **Tâche 1 — Variable d'env `APP_URL` + helper d'envoi d'email** (AC: 3)
  - [x] `APP_URL` ajouté à `env.js` (server + runtimeEnv), `.env.example`, `.env`.
  - [x] `src/server/email.ts` : `envoyerEmail` → POST API Resend par `fetch` (bearer `AUTH_RESEND_KEY`, `from` `EMAIL_FROM`), lève si `!res.ok`, aucun log. Aucune dépendance ajoutée.
- [x] **Tâche 2 — Router : envoyer l'invitation** (AC: 3, 4, 5)
  - [x] `envoyerInvitation` (protected) : participant scopé via la relation `repas.organisateurId = session` → `NOT_FOUND` sinon ; `BAD_REQUEST` si sans email ; URL `${APP_URL}/p/{token}` ; envoi via le helper.
- [x] **Tâche 3 — UI : lien, copie, envoi** (AC: 1, 2, 3, 4)
  - [x] `InvitationActions.tsx` (client) : URL `/p/{token}`, « Copier le lien » (clipboard + « Copié ✓ »), « Envoyer l'invitation » conditionné à `hasEmail` (états envoi/succès/erreur, anti double-soumission).
  - [x] Intégré dans `ParticipantsListe.tsx` (une zone d'actions par participant).
- [x] **Tâche 4 — Tests** (AC: 3, 4, 5, 6)
  - [x] `email.test.ts` (fetch mocké) : URL/bearer/from + erreur si `!ok`.
  - [x] `organisateur.test.ts` : `envoyerInvitation` rejette repas non possédé (`NOT_FOUND`) + sans email (`BAD_REQUEST`) + appelle le helper (URL correcte) quand valide.
  - [x] `InvitationActions.test.tsx` : rend l'URL + copie ; « Envoyer » selon `hasEmail`.
- [x] **Tâche 5 — Validations** (AC: 6)
  - [x] `npm run test` → 58/58 ✅ · `lint` ✅ · `typecheck` ✅ · `SKIP_ENV_VALIDATION=1 build` ✅.

## Dev Notes

### ⚠️ Pièges critiques (lire avant de coder)

1. **Frontière de sécurité via la RELATION.** Le `participantId` vient du client : scoper par `where: { id, repas: { organisateurId: ctx.session.user.id } }`. Sans la clause sur la relation `repas`, n'importe quel organisateur pourrait envoyer l'invitation d'un participant d'autrui (et donc exfiltrer un token). C'est le test de sécurité central.
2. **NFR6 — confidentialité.** Ne **jamais** `console.log` le token, l'email du participant, ni le contenu de l'invitation (données personnelles). Le helper email ne logue rien.
3. **Le lien `/p/{token}` n'aboutit PAS encore** — la route participant (`/p/[token]`) est construite à l'**Epic 3 (story 3.1)**. Jusque-là, cliquer un lien d'invitation mène à un 404. C'est **attendu** (même cas que `/repas/creer` avant 2.1). Le présent story livre la **génération/diffusion**, pas la page d'atterrissage.
4. **Réutiliser le transport Resend de 1.3 SANS nouvelle dépendance** : appeler l'API HTTP Resend par `fetch` (le provider Auth.js de 1.3 fait déjà ainsi en interne). Variables déjà présentes : `AUTH_RESEND_KEY`, `EMAIL_FROM`. **Ne PAS** installer le paquet `resend` ni `nodemailer`.
5. **`APP_URL` nouveau** : `env.js` est strict — l'ajouter en `server` **et** `runtimeEnv`, sinon il sera ignoré/indéfini. Le build CI tourne avec `SKIP_ENV_VALIDATION=1` (ne bloque pas), mais le runtime en a besoin.

### API Resend (référence — envoi direct par fetch)
```ts
// src/server/email.ts
import { env } from "~/env";
export async function envoyerEmail(opts: { to: string; subject: string; html: string }) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.AUTH_RESEND_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: env.EMAIL_FROM, to: opts.to, subject: opts.subject, html: opts.html }),
  });
  if (!res.ok) throw new Error(`Échec d'envoi email (${res.status})`);
}
```
- En **dev sans clé Resend**, l'envoi échouera (clé vide) → l'UI affiche l'erreur ; la **copie du lien** reste le chemin testable localement. (Le fallback console de 1.3 ne concerne que le magic link Auth.js, pas cet envoi-ci.)

### État réel du projet (vérifié — acquis 2.1/2.2)
- **Modèle `Participant`** : `accessToken` (256 bits, `@unique`), `email String?`, `statut`, relation `repas`. Le token **existe déjà** — cette story ne le régénère pas.
- **Router `organisateur`** : `creerRepas`, `mesRepas`, `repasDetail` (avec `include participants`), `ajouterParticipant`. Y **ajouter** `envoyerInvitation`.
- **`repasDetail`** renvoie déjà chaque participant avec `accessToken` + `email` → l'UI a tout pour afficher le lien et conditionner le bouton email.
- **`ParticipantsListe.tsx`** (server) : à enrichir d'`InvitationActions` (client) par ligne.
- **Transport email** : `AUTH_RESEND_KEY` + `EMAIL_FROM` dans `env.js` (1.3). Réutilisés tels quels.
- **Pattern de test** : router → mocker `~/server/auth`, `~/server/db`, **et** `~/server/email` ; contexte injecté. Helper email → mocker `global.fetch`.
- **Conventions** : procédure `verbeNom` FR (`envoyerInvitation`). Frontière orga/participant intacte (toujours côté organisateur ici).

### Accessibilité / UX
- Lien affiché en lecture seule, sélectionnable. Boutons « Copier »/« Envoyer » ≥ 44px, focus visible, libellés explicites + retour d'état texte (pas seulement couleur, NFR8).
- Microcopy FR chaleureuse pour l'email (EXPERIENCE.md Voice & Tone) ; ton clair pour l'invitation.

### Périmètre — hors de cette story
- **Page d'atterrissage `/p/[token]`** (le participant ouvre son lien) → **Epic 3, story 3.1**.
- **Suivi « a répondu »** (statut `REPONDU`) → story 2.4.
- **Renvoi groupé / relances** → non requis par l'AC (un envoi par participant suffit).
- **Personnalisation avancée de l'email** (templates riches) → non requis ; un HTML simple suffit.

### Testing standards
- **Vitest** : `email.test.ts` (node, `fetch` mocké), router (node, Prisma + email mockés), `InvitationActions.test.tsx` (RTL/jsdom). Co-localiser.
- Couvrir **la sécurité** (participant non possédé → rejet) et **le cas sans email** (rejet `BAD_REQUEST`).
- Ne dépendre d'**aucune** clé Resend réelle ni d'aucun réseau.

### Definition of Done manuelle (utilisateur, hors agent)
1. `APP_URL` + `AUTH_RESEND_KEY` (domaine vérifié dans Resend) dans `.env` ; DB up (`db:push` déjà fait en 2.1/2.2).
2. `npm run dev` → ajouter un participant avec email → « Copier le lien » (vérifier le presse-papiers) → « Envoyer l'invitation » (vérifier la réception).
3. Note : le lien copié/envoyé renverra un 404 jusqu'à la story 3.1.

### Project Structure Notes
- Nouveaux : `src/server/email.ts` (+ test), `src/components/organisateur/InvitationActions.tsx` (+ test).
- Modifiés : `src/env.js` + `.env.example` + `.env` (`APP_URL`), `src/server/api/routers/organisateur.ts` (+ test : `envoyerInvitation`), `src/components/organisateur/ParticipantsListe.tsx` (intégrer les actions).
- Aucune nouvelle dépendance npm.

### References
- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.3] (énoncé + AC)
- [Source: _bmad-output/planning-artifacts/architecture.md#Gap Analysis Results] (envoi email = réutiliser le fournisseur Auth.js, FR3)
- [Source: _bmad-output/planning-artifacts/architecture.md#Authentication & Security] (token 256 bits, frontière, jamais d'id client)
- [Source: _bmad-output/implementation-artifacts/2-2-ajouter-des-participants.md] (modèle `Participant`, `accessToken`, `repasDetail`, pattern de test, vérif d'appartenance)
- [Source: _bmad-output/implementation-artifacts/1-3-connexion-organisateur-par-lien-magique.md] (transport Resend, `AUTH_RESEND_KEY`/`EMAIL_FROM`)

## Dev Agent Record

### Agent Model Used

claude-opus-4-8 (bmad-dev-story)

### Debug Log References

- `npm run test` → **58/58** ✅ (+7 : email ×2, envoyerInvitation ×3, InvitationActions ×2) · `lint` ✅ · `typecheck` ✅ · `build` ✅.
- Piège de test résolu : `ParticipantsListe` rend désormais `InvitationActions` (client tRPC) → son test mocke `~/trpc/react` (sinon la chaîne next-auth `next/server` casse sous Vitest).
- Le router importe maintenant `~/env` + `~/server/email` → mocks ajoutés dans `organisateur.test.ts`.

### Completion Notes List

- ✅ **Diffusion des invitations** : URL `/p/{token}` affichée, **copie presse-papiers**, **envoi email** (Resend par `fetch`, sans dépendance).
- ✅ **Frontière de sécurité via la relation** : `envoyerInvitation` ne touche qu'un participant d'un repas possédé (sinon `NOT_FOUND`) — protège le token. Aucun log (NFR6).
- ✅ Email seulement si le participant en a un (sinon copie seule). Nouvel env `APP_URL` (base des liens serveur).
- **Caveat assumé** : le lien `/p/{token}` renvoie un 404 jusqu'à la **story 3.1** (page d'atterrissage participant).
- **À faire par l'utilisateur (DoD manuelle)** : `APP_URL` + `AUTH_RESEND_KEY` (domaine vérifié), DB up ; tester copie + envoi depuis `/repas/[id]`.

### File List

- `src/env.js` + `.env.example` + `.env` (MODIFIÉS — `APP_URL`)
- `src/server/email.ts` + `src/server/email.test.ts` (NOUVEAUX — envoi Resend par fetch)
- `src/server/api/routers/organisateur.ts` + `organisateur.test.ts` (MODIFIÉS — `envoyerInvitation`)
- `src/components/organisateur/InvitationActions.tsx` + `InvitationActions.test.tsx` (NOUVEAUX — lien/copie/envoi)
- `src/components/organisateur/ParticipantsListe.tsx` + `ParticipantsListe.test.tsx` (MODIFIÉS — intègrent les actions)

### Review Findings (revue complète, 2026-06-25)

> ✅ Revue **complète** (3 couches). Tous les AC satisfaits.

- [x] [Review][Patch] Copie presse-papiers sans garde — `copier()` enveloppé dans un `try/catch` (contexte non sécurisé / vieux navigateur → le lien reste affiché pour copie manuelle). [src/components/organisateur/InvitationActions.tsx]

- [x] [Review][Patch] **Injection HTML dans l'email** — `prenom` désormais échappé (`echapperHtml`) avant insertion dans le HTML d'invitation. [src/lib/html.ts, src/server/api/routers/organisateur.ts]
- [x] [Review][Patch] Erreur Resend non diagnostiquable — `envoyerEmail` lit le corps de la réponse en cas d'échec (cause réelle), sans donnée sensible. [src/server/email.ts]
- [x] [Review][Defer] Token dans l'URL → fuite possible via `Referer` — ajouter `Referrer-Policy: no-referrer` sur la page `/p/[token]` **à sa création (story 3.1)**. [deferred → 3.1]
- [x] [Review][Defer] Rate-limiting de l'envoi d'emails — différé en V1 par l'architecture (« testeurs proches ») ; partiellement couvert par le plafond de participants (2.2). [deferred → post-MVP]

### Change Log

- 2026-06-22 : Story 2.3 implémentée — diffusion des invitations (lien `/p/{token}`, copie, envoi email Resend), router `envoyerInvitation` scopé. Tests 58/58, lint/typecheck/build verts. Statut → review.
- 2026-06-25 : Revue complète — échappement HTML email, lecture erreur Resend, garde clipboard. Tous AC OK. Statut → done.
