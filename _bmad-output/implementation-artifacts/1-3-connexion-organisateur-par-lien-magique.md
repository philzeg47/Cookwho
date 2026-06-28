---
baseline_commit: f27b0499b3fcbc621d8377653ec11bb732cd8787
---

# Story 1.3: Connexion organisateur par lien magique

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As an organisateur,
I want me connecter sans mot de passe,
so that j'accède à mon espace simplement et en sécurité.

## Acceptance Criteria

1. **Given** Auth.js v5 configuré avec le modèle utilisateur (Auth.js `User` = l'organisateur), **When** je saisis mon email sur une page de connexion, **Then** Auth.js m'envoie un lien magique de connexion par email (provider Email/magic-link, plus de provider Discord).
2. **Given** un lien magique reçu, **When** je clique dessus, **Then** une session organisateur valide est ouverte (cookie de session, `ctx.session.user` peuplé côté tRPC) et je suis redirigé vers une page connectée.
3. **Given** le besoin de diffuser des emails, **When** je configure le projet, **Then** un transport email réel est branché (fournisseur **Resend** par défaut — ou SMTP via Nodemailer) avec ses variables d'environnement, et il est **réutilisable** pour l'envoi des invitations (FR3) plus tard.
4. **Given** la sécurité, **When** un organisateur se connecte, **Then** **aucun mot de passe n'est stocké ni demandé** — le seul facteur est la possession de la boîte mail (lien magique à usage unique, expirant).
5. **Given** l'accessibilité et le thème Cocon, **When** j'ouvre la page de connexion, **Then** elle réutilise les composants `Input` + `Button` de la story 1.2, est navigable au clavier, et un état de confirmation habillé (« Vérifie ta boîte mail ») s'affiche après l'envoi (pas un 404 brut Auth.js).
6. **Given** les validations, **When** je lance `npm run test`, `npm run lint`, `npm run typecheck`, **Then** tout reste vert ; le scaffold démo Discord/Post n'introduit plus d'erreur (env Discord retiré proprement).

## Tasks / Subtasks

- [x] **Tâche 0 — Variables d'environnement & transport email** (AC: 3, 6)
  - [x] Fournisseur retenu : **Resend** (validé par l'utilisateur, avec son domaine comme expéditeur de marque).
  - [x] `src/env.js` : `AUTH_DISCORD_ID`/`AUTH_DISCORD_SECRET` retirés (server + `runtimeEnv`) ; `AUTH_RESEND_KEY` et `EMAIL_FROM` ajoutés. `AUTH_SECRET`/`DATABASE_URL` conservés.
  - [x] `.env.example` : bloc Discord remplacé par `AUTH_RESEND_KEY` + `EMAIL_FROM` (commentaire domaine + repli `onboarding@resend.dev`).
  - [x] `.env` local aligné (Resend vide + `EMAIL_FROM` repli pour le dev via fallback console).
- [x] **Tâche 1 — Provider magic link dans Auth.js** (AC: 1, 4)
  - [x] `src/server/auth/config.ts` : `DiscordProvider` remplacé par `Resend({ apiKey: env.AUTH_RESEND_KEY, from: env.EMAIL_FROM })`.
  - [x] `adapter: PrismaAdapter(db)` conservé (jetons `VerificationToken`).
  - [x] Stratégie de session laissée au défaut `database` (pas de `jwt` forcé).
  - [x] `pages.signIn` → `/connexion`, `pages.verifyRequest` → `/connexion/verifier`.
  - [x] Aucun mot de passe (provider email — AC4 garanti par construction).
- [x] **Tâche 2 — Fallback dev (log du lien en console)** (AC: 1, 4)
  - [x] `sendVerificationRequest` borné à `env.NODE_ENV !== "production"` logge l'URL en console ; en prod, envoi Resend normal.
  - [x] Aucun log de donnée sensible en production (NFR6).
- [x] **Tâche 3 — Page de connexion (UI Cocon)** (AC: 2, 5)
  - [x] `src/app/connexion/page.tsx` (Server Component) : `Input` email + `Button` primaire, Server Action `signIn("resend", { email, redirectTo: "/repas" })`.
  - [x] `src/app/connexion/verifier/page.tsx` : confirmation « Vérifie ta boîte mail » via `Banner` info (icône 📬 + texte).
  - [x] Responsive, navigable au clavier, microcopy FR chaleureuse.
- [x] **Tâche 4 — Nettoyage du scaffold démo Discord** (AC: 6)
  - [x] Aucune référence Discord résiduelle dans le code (vérifié par grep + test de config).
  - [x] `Post`/router `post`/`_components/post.tsx` laissés en l'état (ne cassent pas le build — hors périmètre).
- [x] **Tâche 5 — Tests** (AC: 1, 4, 6)
  - [x] `src/server/auth/config.test.ts` (env node) : garde-fou anti-régression Discord→Resend + adapter + pages + bornage du log (assertion au niveau source — voir note ci-dessous).
  - [x] `src/app/connexion/page.test.tsx` (RTL/jsdom) : rend le champ email + le bouton d'envoi.
- [x] **Tâche 6 — Validations** (AC: 6)
  - [x] `npm run test` → 17/17 ✅ · `npm run lint` ✅ · `npm run typecheck` ✅.
  - [x] `SKIP_ENV_VALIDATION=1 npm run build` ✅ (routes `/connexion` et `/connexion/verifier` générées).
  - [x] Vérification fonctionnelle bout-en-bout : **déléguée à l'utilisateur** (DB + email/console) — voir « Definition of Done manuelle ».

## Dev Notes

### ⚠️ Pièges critiques (lire avant de coder)

1. **`User` Auth.js = l'« Organisateur ».** L'architecture parle d'un modèle `Organisateur`, mais le `PrismaAdapter` d'Auth.js **exige** les modèles `User`, `Account`, `Session`, `VerificationToken` avec des noms/champs précis. **NE PAS renommer `User` en `Organisateur`** — cela casserait l'adapter. En V1, la table `User` **EST** l'organisateur. Plus tard, `Repas.organisateurId` référencera `User.id`. (Source : contrainte technique PrismaAdapter vs [architecture.md#Authentication & Security].)
2. **Le modèle `VerificationToken` existe déjà** dans `prisma/schema.prisma` (issu du scaffold 1.1) — c'est lui qui stocke les jetons de lien magique. **Aucune migration de schéma n'est nécessaire pour cette story** (le provider email réutilise les tables Auth.js existantes).
3. **Magic link ⇒ stratégie de session `database`.** Ne pas activer `session: { strategy: "jwt" }`. Avec `PrismaAdapter`, le défaut est `database`, ce qu'il faut pour les liens magiques. Surcharger en JWT casserait silencieusement le flux.
4. **`env.js` est strict.** `AUTH_DISCORD_ID/SECRET` y sont `z.string()` **obligatoires** : si on retire le provider Discord sans nettoyer `env.js`, le build exigera quand même ces variables. Le nettoyage de `env.js` (Tâche 0) est donc **obligatoire**, pas optionnel.
5. **`build` se fait avec `SKIP_ENV_VALIDATION=1`** (convention héritée de 1.1 : la DB/email réels ne sont pas branchés en CI). Les tests ne doivent pas dépendre d'une vraie clé Resend ni d'une vraie DB.

### État réel du projet (vérifié — peut différer de l'architecture)
- **next-auth `5.0.0-beta.25`** (Auth.js v5), **`@auth/prisma-adapter ^2.7.2`**, **Next 15.2.3** (pas 16), **Tailwind v4** (thème dans `globals.css @theme`, pas de `tailwind.config.ts`), **React 19**, **tRPC v11**.
- **Auth.js est éclaté** en `src/server/auth/config.ts` (l'objet `authConfig`) + `src/server/auth/index.ts` (exporte `auth`, `handlers`, `signIn`, `signOut`). L'architecture évoquait un unique `src/server/auth.ts` — suivre le **réel** (dossier `auth/`).
- **Provider actuel : `DiscordProvider`** (à remplacer). `adapter: PrismaAdapter(db)` déjà en place. Callback `session` peuple déjà `session.user.id`.
- **tRPC** : `protectedProcedure` (dans `src/server/api/trpc.ts`) vérifie déjà `ctx.session?.user` → une session valide suffit à protéger les futures procédures organisateur (story 1.4+). Rien à modifier ici.
- **Route handler Auth.js** déjà câblé : `src/app/api/auth/[...nextauth]/route.ts`.
- **Alias d'import** : `~/*` → `src/*`.

### API Auth.js v5 — provider Resend (référence d'implémentation)
```ts
// src/server/auth/config.ts (extrait cible)
import { PrismaAdapter } from "@auth/prisma-adapter";
import { type DefaultSession, type NextAuthConfig } from "next-auth";
import Resend from "next-auth/providers/resend";
import { env } from "~/env";
import { db } from "~/server/db";

export const authConfig = {
  providers: [
    Resend({
      apiKey: env.AUTH_RESEND_KEY,
      from: env.EMAIL_FROM,
      // Fallback dev : logge le lien au lieu de l'envoyer (Tâche 2)
      ...(env.NODE_ENV !== "production" && {
        sendVerificationRequest({ identifier, url }) {
          console.log(`\n🔗 Lien magique pour ${identifier} :\n${url}\n`);
        },
      }),
    }),
  ],
  adapter: PrismaAdapter(db),
  pages: { signIn: "/connexion", verifyRequest: "/connexion/verifier" },
  callbacks: {
    session: ({ session, user }) => ({
      ...session,
      user: { ...session.user, id: user.id },
    }),
  },
} satisfies NextAuthConfig;
```
- Le provider **Resend d'Auth.js appelle l'API Resend par `fetch`** — **pas besoin d'installer le paquet `resend`** ni `nodemailer`. Seule la clé `AUTH_RESEND_KEY` est requise.
- `from` : pour tester sans domaine vérifié, `onboarding@resend.dev` est accepté par Resend.
- **Alternative SMTP** (si l'utilisateur préfère) : `import Nodemailer from "next-auth/providers/nodemailer"` + `npm i nodemailer` + vars `EMAIL_SERVER` (URL SMTP) et `EMAIL_FROM`. Même flux côté UI.

### Page de connexion — Server Action (référence)
```tsx
// src/app/connexion/page.tsx (Server Component)
import { signIn } from "~/server/auth";
import { Input } from "~/components/ui/Input";
import { Button } from "~/components/ui/Button";

export default function ConnexionPage() {
  return (
    <main className="...">
      <h1>Se connecter à CookWho</h1>
      <form
        action={async (formData) => {
          "use server";
          await signIn("resend", {
            email: String(formData.get("email")),
            redirectTo: "/repas",
          });
        }}
      >
        <Input id="email" name="email" type="email" label="Ton email" required />
        <Button type="submit">Recevoir mon lien de connexion</Button>
      </form>
    </main>
  );
}
```
- `signIn("resend", …)` déclenche l'envoi puis une redirection vers `pages.verifyRequest`. Importer `signIn` depuis `~/server/auth` (déjà exporté), **pas** depuis `next-auth/react`.
- La cible `redirectTo: "/repas"` correspond à l'espace « Mes repas » de la **story 1.4** (cette route n'existe pas encore — c'est normal ; 1.4 la créera). Tu peux temporairement viser `/` si `/repas` n'existe pas, mais garder `/repas` documente l'intention.

### Décision : Resend avec domaine de l'utilisateur (TRANCHÉ)
- **Retenu : Resend.** Zéro infra, API HTTP via `fetch`, free tier généreux, idéal Vercel + dev solo, et **réutilisable tel quel pour les invitations FR3** (story 2.3). Une seule variable secrète (`AUTH_RESEND_KEY`).
- **L'utilisateur possède déjà un nom de domaine** → le **vérifier dans Resend** (enregistrements DNS SPF/DKIM) et envoyer depuis une adresse de marque (`EMAIL_FROM="CookWho <bonjour@son-domaine>"`). Meilleure délivrabilité et image que `onboarding@resend.dev`.
- **La boîte mail associée au domaine n'est PAS requise** pour l'envoi : Resend envoie en votre nom après vérification DNS. Elle ne servirait que pour un envoi via SMTP direct (chemin Nodemailer, écarté ici).
- **SMTP/Nodemailer** reste l'alternative documentée si l'utilisateur veut plus tard passer par le serveur SMTP de sa mailbox (ajoute `nodemailer` + `EMAIL_SERVER`).
- **Étape manuelle utilisateur :** vérifier le domaine dans le dashboard Resend avant la mise en prod (en dev, le fallback console de la Tâche 2 évite tout envoi).

### Accessibilité (NFR8 / UX-DR6)
- `Input` (story 1.2) associe déjà `label`↔`input` (`htmlFor`/`id`) et porte un focus ring ; le `Button` primaire est focusable (corrigé en revue 1.2 : `ring-offset` + `ring-primary-strong`).
- Page de connexion : un seul champ, libellé explicite, bouton ≥ 44px (déjà garanti par `min-h-11` du `Button`).
- État « vérifie ta boîte mail » : message texte clair (pas seulement une icône), ton chaleureux.

### Sécurité & confidentialité
- **Aucun mot de passe** (AC4) : le magic link ne stocke ni ne demande de secret utilisateur — garanti par le provider email.
- **NFR4 (token non-devinable)** concerne le **lien participant** (story 2.3), pas le lien magique organisateur (géré par Auth.js, déjà cryptographiquement sûr).
- **NFR6** : pas de log de données sensibles en prod. Le fallback console (Tâche 2) est strictement borné à `NODE_ENV !== "production"`.

### Périmètre — hors de cette story
- **Espace « Mes repas »** (`/repas`), redirection des non-connectés, bouton de déconnexion d'UI complet → **story 1.4**.
- **Lien/token participant** (`/p/[token]`), routers métier `organisateur`/`participant`, entités `Repas`/`Participant`/`Restriction` → Epics 2/3.
- **Nettoyage du démo `Post`/`post` router/`_components/post.tsx`** : laissé en l'état (ne casse pas le build). À traiter dans un nettoyage ultérieur si souhaité — ne pas élargir cette story.
- **Envoi réel d'invitations** (FR3) : ici on ne fait que **poser le transport** réutilisable.

### Testing standards
- **Vitest + RTL/jsdom** (installés en 1.2) pour les composants ; **Vitest env node** pour la config.
- Le flux magic-link complet (réception email → clic → session) **n'est pas testable unitairement** sans DB + email : il relève d'un test e2e (Playwright, non installé) ou d'une **vérification manuelle**. Couvrir ici : (a) la config du provider (anti-régression Discord→email), (b) le rendu de la page de connexion.
- Co-localiser les tests (`config.test.ts` à côté de `config.ts`, `page.test.tsx` si besoin).
- Ne pas dépendre d'une vraie clé Resend dans les tests (mocker / tester la forme de la config seulement).

### Definition of Done manuelle (à exécuter par l'utilisateur, hors agent)
1. Renseigner `.env` (DATABASE_URL réelle, AUTH_SECRET via `npx auth secret`, AUTH_RESEND_KEY ou laisser le fallback console en dev).
2. `npm run db:push` (créer les tables Auth.js sur la base) si pas déjà fait.
3. `npm run dev`, ouvrir `/connexion`, saisir un email → récupérer le lien (console en dev) → cliquer → vérifier l'ouverture de session.

### Project Structure Notes
- Nouveaux fichiers : `src/app/connexion/page.tsx`, `src/app/connexion/verifier/page.tsx`, `src/server/auth/config.test.ts`.
- Modifiés : `src/server/auth/config.ts`, `src/env.js`, `.env.example`, `.env`.
- Aucune nouvelle dépendance npm (provider Resend = `fetch`, déjà dans next-auth). Si l'utilisateur choisit SMTP : ajouter `nodemailer` (HALT pour accord, cf. règle dev-story sur les dépendances).

### References
- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.3] (énoncé + AC)
- [Source: _bmad-output/planning-artifacts/architecture.md#Authentication & Security] (Auth.js v5 lien magique, frontière orga/participant)
- [Source: _bmad-output/planning-artifacts/architecture.md#Data Architecture] (modèles ; `Organisateur` conceptuel = `User` Auth.js)
- [Source: _bmad-output/planning-artifacts/architecture.md#Gap Analysis Results] (envoi email = manque à traiter tôt, réutiliser le provider Auth.js pour FR3)
- [Source: _bmad-output/implementation-artifacts/1-1-initialisation-du-projet-theme-cocon.md] (scaffold T3, Next 15.2.3, Tailwind v4, env strict, écarts assumés)
- [Source: _bmad-output/implementation-artifacts/1-2-bibliotheque-de-composants-ui-de-base.md] (composants `Input`/`Button` réutilisables + correctifs focus de la revue)
- [Source: _bmad-output/planning-artifacts/ux-designs/ux-CookWho-2026-06-19/EXPERIENCE.md#Voice & Tone] (microcopy chaleureuse)

## Dev Agent Record

### Agent Model Used

claude-opus-4-8 (bmad-dev-story)

### Debug Log References

- `npm run test` → **17/17** ✅ (9 fichiers : core + 5 composants + page connexion + config auth).
- `npm run lint` ✅ · `npm run typecheck` ✅ · `SKIP_ENV_VALIDATION=1 npm run build` ✅ (Next 15.5.19 ; routes `/connexion` + `/connexion/verifier` prerendered).
- **Piège de test résolu :** importer `./config` en test charge le runtime next-auth, qui tire `next/server` (non résoluble hors runtime Next sous Vitest, même en mockant le provider/adapter). Le test de config est donc une **assertion au niveau source** (`config.ts` lu via `fs`) — garde-fou anti-régression Discord→Resend fiable et hermétique, sans charger next-auth.

### Completion Notes List

- ✅ Connexion organisateur par **lien magique Resend** (sans mot de passe) — `DiscordProvider` remplacé, `env.js`/`.env`/`.env.example` nettoyés.
- ✅ Adapter Prisma conservé (jetons dans `VerificationToken`, déjà présent depuis 1.1) ; **aucune migration de schéma** nécessaire ; stratégie de session `database` (défaut).
- ✅ Pages Cocon `/connexion` (Input + Button de la story 1.2) et `/connexion/verifier` (Banner info) ; Server Action `signIn("resend", …)` avec `redirectTo: "/repas"` (route créée en story 1.4).
- ✅ Fallback dev : lien magique loggué en console hors-production uniquement (NFR6).
- ✅ `User` Auth.js conservé tel quel comme représentation de l'organisateur (pas de renommage — contrainte PrismaAdapter).
- **À faire par l'utilisateur (DoD manuelle)** : DB Postgres accessible, `AUTH_RESEND_KEY` + domaine vérifié dans Resend, `npm run db:push`, puis test bout-en-bout `/connexion`.
- **Hors périmètre (laissé en l'état)** : démo T3 `Post`/router `post`/`_components/post.tsx` ; espace `/repas` et redirection des non-connectés (story 1.4).

### File List

- `src/env.js` (MODIFIÉ — Discord retiré, `AUTH_RESEND_KEY`/`EMAIL_FROM` ajoutés)
- `.env.example` (MODIFIÉ — bloc transport email Resend)
- `.env` (MODIFIÉ — vars email locales)
- `src/server/auth/config.ts` (MODIFIÉ — provider Resend + fallback dev + pages + adapter conservé)
- `src/app/connexion/page.tsx` (NOUVEAU — page de connexion)
- `src/app/connexion/verifier/page.tsx` (NOUVEAU — confirmation « vérifie ta boîte mail »)
- `src/server/auth/config.test.ts` (NOUVEAU — garde-fou anti-régression au niveau source)
- `src/app/connexion/page.test.tsx` (NOUVEAU — test de rendu de la page)

### Review Findings (revue groupée 1.3–1.5, 2026-06-22)

- [x] [Review][Decision→Patch] Démo T3 `Post` supprimée — router `post`, `_components/post.tsx`, modèle `Post` + `User.posts` retirés ; `root.ts` expose désormais une procédure `health` (API non vide/typée). [src/server/api/root.ts, prisma/schema.prisma]
- [x] [Review][Decision→Patch] Gestion d'erreur `signIn` ajoutée — try/catch dans la Server Action ; échec → `redirect("/connexion?error=envoi")` ; Banner danger affiché via `searchParams`. La redirection de succès (NEXT_REDIRECT) est relayée. [src/app/connexion/page.tsx]
- [x] [Review][Patch] `env.js` durci — `AUTH_RESEND_KEY`/`EMAIL_FROM`/`AUTH_SECRET` (prod) en `.min(1)`. [src/env.js]
- [x] [Review][Patch] Email normalisé — `String(formData.get("email") ?? "").trim()`. [src/app/connexion/page.tsx]
- [x] [Review][Patch] Garde-fou stratégie session — assertion source « pas de `strategy: jwt` ». [src/server/auth/config.test.ts]
- [x] [Review][Patch] Log du lien magique restreint à `NODE_ENV === "development"`. [src/server/auth/config.ts]
- [x] [Review][Patch] `verifier/page.tsx` — lien de retour en `next/link`. [src/app/connexion/verifier/page.tsx]

### Change Log

- 2026-06-22 : Story 1.3 implémentée — connexion organisateur par lien magique (Resend), pages Cocon `/connexion` + `/connexion/verifier`, nettoyage Discord, tests verts (17/17), lint/typecheck/build OK. Statut → review.
- 2026-06-22 : Revue de code — 7 findings traités (gestion d'erreur signIn, nettoyage démo Post + procédure `health`, durcissement env, trim email, garde stratégie session, log dev-only, Link). Statut → done.
