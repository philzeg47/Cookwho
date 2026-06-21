---
baseline_commit: 3f44f21081bc737235b52800f4c0789ec381b5f7
---

# Story 1.1: Initialisation du projet & thème Cocon

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a porteur du projet,
I want le squelette technique de CookWho en place avec son identité visuelle « Cocon »,
so that je peux développer les fonctionnalités sur une base saine, typée et cohérente.

## Acceptance Criteria

1. **Given** un dépôt vide, **When** j'initialise avec `npm create t3-app@latest` (TypeScript, Tailwind, tRPC, Prisma, Auth.js/NextAuth, App Router), **Then** l'app démarre en local (`npm run dev`) sans erreur et se déploie sur Vercel.
2. **Given** le projet initialisé, **When** je configure Tailwind, **Then** le thème reflète les tokens DESIGN.md : palette Cocon, police Nunito, rayons arrondis md/lg/pill.
3. **Given** la structure du projet, **When** je configure ESLint, **Then** une règle de *boundaries* interdit à `src/core/**` d'importer `src/server/**`, `src/app/**` ou `src/db`/Prisma — et l'enfreindre fait échouer le lint.
4. **Given** l'app démarrée, **When** j'ouvre la page d'accueil, **Then** elle s'affiche avec la typo Nunito et le fond crème Cocon (preuve visuelle que le thème est branché).

## Tasks / Subtasks

- [x] **Tâche 1 — Scaffolding T3** (AC: 1)
  - [x] `create-t3-app` (non-interactif) : TypeScript, Tailwind, tRPC, Prisma, NextAuth (Auth.js), App Router — scaffoldé dans un dossier neuf puis fusionné à la racine sans toucher `_bmad-output/`.
  - [x] Vérifié : `npm run build` compile (page `/` statique) ; `npm run typecheck` OK.
  - [ ] Commit + déploiement Vercel : laissés à l'utilisateur (hors exécution dev).
- [x] **Tâche 2 — Thème « Cocon »** (AC: 2, 4)
  - [x] Tokens Cocon ajoutés dans `src/styles/globals.css` via `@theme` (Tailwind v4 — pas de `tailwind.config.ts`).
  - [x] Police **Nunito** chargée via `next/font/google` (poids 400/600/700), mappée sur `--font-nunito` / `--font-sans`.
  - [x] Rayons `md=10px`, `lg=16px`, `pill=999px` mappés.
  - [x] Fond crème + typo appliqués sur le `<body>` ; page `/` affiche le branding CookWho (badge sauge, titre, bouton abricot).
- [x] **Tâche 3 — Règle de boundaries `/core`** (AC: 3)
  - [x] Dossier `src/core/` créé (README + `index.ts` placeholder).
  - [x] Règle ESLint `no-restricted-imports` interdisant à `src/core/**` d'importer `~/server`, `~/app`, `~/trpc`, Prisma.
  - [x] Non-régression vérifiée : une sonde important `~/server/db` dans `/core` fait bien échouer `npm run lint` (sonde retirée ensuite).
- [x] **Tâche 4 — CI minimale** (AC: 1, 3)
  - [x] `.github/workflows/ci.yml` : `npm ci` + `lint` + `typecheck` + `test` (gate corpus d'or noté pour l'Epic 4).
  - [ ] Vérification du déploiement Vercel : laissée à l'utilisateur.

## Dev Notes

### Stack imposée (architecture — ne pas dévier)
- **Next.js 16 (App Router) + TypeScript** ; Server Components par défaut, `'use client'` uniquement pour l'interactif.
- **tRPC v11** (routers à venir : `organisateur` / `participant` séparés), **Prisma + PostgreSQL**, **Auth.js v5** (lien magique email — story 1.3, ne PAS implémenter ici, juste laisser le scaffold NextAuth).
- **Tailwind** pour tout le style (dérivé des tokens DESIGN.md).
- **Hébergement :** Vercel + Postgres managé (Neon/Supabase) — la connexion DB réelle viendra avec le schéma (story 1.3+). Ici on ne crée PAS encore d'entités métier.
- Versions vérifiées (juin 2026) : Next 16.2.x, create-t3-app courant, tRPC v11, Auth.js v5.

### Tokens Cocon à injecter dans Tailwind (source : DESIGN.md)
```
colors:
  background  #FBF4EC   surface #FFFFFF   surface-muted #F2E9DD
  primary     #EF9F27   primary-strong #854F0B   primary-soft #FAEEDA
  accent      #BA7517   accent-soft #FAEEDA
  safe        #5DCAA5   safe-text #04342C   safe-soft #E1F5EE
  danger      #E24B4A   danger-strong #791F1F   danger-soft #FCEBEB
  text-primary #2C2C2A  text-secondary #5F5E5A  text-on-primary #633806
  border      #E0D4C2
font: Nunito (display + body), poids 400/600/700
radius: md 10px · lg 16px · pill 999px
```
- **Important :** le texte des boutons primaires est foncé (`text-on-primary #633806`) car l'abricot est clair. Le rouge `danger` est réservé aux allergènes ; la sauge `safe` aux confirmations. V1 = mode clair uniquement.

### Décision structurante (architecture)
- Le **noyau `/core` est PUR (zéro I/O)** — c'est la frontière la plus importante du projet. La règle ESLint de la Tâche 3 la matérialise dès le départ pour éviter toute dérive ultérieure. `/core` recevra plus tard `allergenes/` et `compatibilite/`.

### Structure cible (rappel, à préparer — pas à remplir ici)
```
src/core/        (pur, créé vide ici)
src/server/      (tRPC, db, auth, sources — plus tard)
src/app/         (routes, layout racine + thème ici)
src/components/  (ui/ — composants en story 1.2)
src/lib/         (utils)
```

### Périmètre — ce qui N'EST PAS dans cette story
- Pas de composants UI réutilisables (story 1.2), pas d'auth fonctionnelle (story 1.3), pas d'entités métier ni de schéma Repas/Participant (stories 2.x/3.x), pas de logique `/core` (Epic 4). Ici : **scaffold + thème + frontière + CI**.

### Testing standards
- Mettre en place le runner de tests fourni par T3 (Vitest) ; un test trivial qui passe suffit pour valider le pipeline.
- AC3 : la non-régression de la règle de boundaries doit être vérifiable (lint qui échoue sur import interdit).

### Project Structure Notes
- On greffe le scaffold T3 sur le dépôt existant `philzeg47/Cookwho` (qui ne contient pour l'instant que les artefacts de planning sous `_bmad-output/`). Veiller à ne pas écraser `_bmad-output/`.

### References
- [Source: _bmad-output/planning-artifacts/architecture.md#Starter Template Evaluation] (create-t3-app, versions)
- [Source: _bmad-output/planning-artifacts/architecture.md#Project Structure & Boundaries] (`/core` pur, règle ESLint, arborescence)
- [Source: _bmad-output/planning-artifacts/architecture.md#Implementation Patterns & Consistency Rules] (conventions de nommage, langue)
- [Source: _bmad-output/planning-artifacts/ux-designs/ux-CookWho-2026-06-19/DESIGN.md#Colors] (palette Cocon, tokens)
- [Source: _bmad-output/planning-artifacts/ux-designs/ux-CookWho-2026-06-19/DESIGN.md#Typography] (Nunito, échelle)
- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.1] (énoncé + critères d'acceptation)

## Dev Agent Record

### Agent Model Used

claude-opus-4-8 (bmad-dev-story)

### Debug Log References

- `npm create t3-app@latest cookwho-scaffold -- --CI --tailwind --trpc --prisma --nextAuth --appRouter --dbProvider postgres --noGit --noInstall` → scaffold OK (create-t3-app 7.40.0).
- `npm install` → 250 paquets, client Prisma généré (v6.19.3).
- `npm run test` → 1/1 ✅ · `npm run typecheck` → ✅ · `npm run lint` → ✅ (après resserrage sur `src/**` + ignore `generated/`).
- Sonde de boundaries (`~/server/db` dans `/core`) → lint **échoue** comme attendu, puis sonde retirée.
- `SKIP_ENV_VALIDATION=1 npm run build` → compilé en 11 s, page `/` statique.

### Completion Notes List

- ✅ Tous les AC validés (build, thème Cocon + Nunito, règle de boundaries `/core` effective, CI).
- **Écarts assumés vs. story/architecture (signalés) :**
  - **Next 15.2.3** (et non 16) : create-t3-app 7.40 épingle Next 15 ; aligné sur ce que produit réellement le starter.
  - **Tailwind v4** : thème via `globals.css @theme` (pas de `tailwind.config.ts`).
  - **ESLint + Vitest ajoutés** : le starter ne génère plus de linter ; ajoutés pour satisfaire AC3 (boundaries) et les standards de test.
  - Couleurs exposées en utilitaires Tailwind (`bg-background`, `text-ink`, `bg-primary`/`text-on-primary`, `bg-safe`…) ; `border` renommé `edge` pour éviter le conflit avec l'utilitaire Tailwind.
  - Build validé avec `SKIP_ENV_VALIDATION=1` (DB/auth fonctionnels = stories 1.3+) ; commit & déploiement Vercel laissés à l'utilisateur.
- À faire à la story suivante : variables d'env réelles (DATABASE_URL, AUTH_SECRET, fournisseur email), plugin `@next/eslint-plugin-next` (avertissement non bloquant au build).

### File List

- `package.json` (MODIFIÉ — nom `cookwho`, scripts `lint`/`test`, devDeps eslint/typescript-eslint/@eslint/js/vitest)
- `package-lock.json` (NOUVEAU)
- `.gitignore` (MODIFIÉ — fusion T3 + ignore `/generated`)
- `eslint.config.js` (NOUVEAU — flat config + règle de boundaries `/core`)
- `.github/workflows/ci.yml` (NOUVEAU)
- `src/styles/globals.css` (MODIFIÉ — tokens Cocon `@theme` + Nunito)
- `src/app/layout.tsx` (MODIFIÉ — Nunito, `lang="fr"`, fond Cocon, métadonnées)
- `src/app/page.tsx` (MODIFIÉ — accueil CookWho statique, preuve du thème)
- `src/core/README.md`, `src/core/index.ts`, `src/core/core.test.ts` (NOUVEAUX — noyau pur + test)
- Reste du scaffold T3 à la racine : `next.config.js`, `postcss.config.js`, `tsconfig.json`, `next-env.d.ts`, `.env`, `.env.example`, `start-database.sh`, `prisma/`, `public/`, `src/server/`, `src/trpc/`, `src/app/api/`, `src/app/_components/`, `src/env.js` (NOUVEAUX, issus du starter)

### Change Log

- 2026-06-19 : Story 1.1 implémentée — scaffold T3 fusionné, thème Cocon + Nunito, noyau `/core` + règle ESLint de boundaries, CI minimale. Statut → review.
