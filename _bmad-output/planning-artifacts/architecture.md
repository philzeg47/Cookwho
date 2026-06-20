---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
lastStep: 8
status: 'complete'
completedAt: '2026-06-19'
inputDocuments:
  - _bmad-output/planning-artifacts/prds/prd-CookWho-2026-06-19/prd.md
  - _bmad-output/planning-artifacts/prds/prd-CookWho-2026-06-19/addendum.md
  - _bmad-output/planning-artifacts/ux-designs/ux-CookWho-2026-06-19/DESIGN.md
  - _bmad-output/planning-artifacts/ux-designs/ux-CookWho-2026-06-19/EXPERIENCE.md
  - _bmad-output/planning-artifacts/briefs/brief-CookWho-2026-06-07/brief.md
  - _bmad-output/brainstorming/brainstorming-session-2026-06-06-10-34.md
workflowType: 'architecture'
project_name: 'CookWho'
user_name: 'Philippe'
date: '2026-06-19'
---

# Architecture Decision Document — CookWho

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Project Context Analysis

### Requirements Overview

**Functional Requirements:**
16 FR en 6 domaines : (F1) gestion de repas & invitations, (F2) saisie des restrictions participant, (F3) moteur de compatibilité « mur & curseur », (F4) couche allergènes interne, (F5) source de recettes (abstraction + cache), (F6) présentation des recettes à l'organisateur. Le cœur de valeur et de risque est F3+F4 (générer des plats sûrs et compatibles).

**Non-Functional Requirements:**
- Sécurité (prioritaire) : objectif zéro faux négatif sur la détection d'allergènes ; « dans le doute, on exclut ». À tenir comme cible *de tests* (corpus d'or), doublée côté produit d'une communication explicite de l'incertitude (3 états : sûr / contient / incertain) + disclaimer — un moteur sur texte libre n'offre pas de garantie médicale absolue.
- Performance : profil participant < 2 min ; génération < 5 s (cible).
- Contrôle d'accès : lien d'invitation non-devinable (token cryptographique) ; vue des recettes strictement réservée à l'organisateur ; routes orga/participant séparées.
- Confidentialité : minimisation des données ; restrictions = données de santé sensibles (RGPD = question ouverte, pas de rétention définie en V1 ; garde-fous gratuits : TTL/purge, pas de log en clair).
- Plateforme : web, parcours participant mobile-first.

**Scale & Complexity:**
- Primary domain: application web full-stack.
- Complexity level: moyenne (risque concentré sur la sécurité, pas le volume).
- Estimated architectural components: ~6 (front web, API/back, moteur de compatibilité, couche allergènes, adaptateur source + cache, stockage).

### Principe d'architecture directeur (issu du tour de table)

**Noyau de sécurité pur et isolé.** La logique critique (détection d'allergènes + moteur mur & curseur) vit dans un noyau `/core` SANS I/O — déterministe, 100 % testable, n'important jamais la source, la base ou l'UI. Tout le reste (Next/UI, scraper Marmiton, persistance) est de la périphérie jetable autour de ce noyau. C'est la contrainte structurante qui protège l'exigence de sécurité en l'isolant de tout ce qui est fragile ou changeant.

### Technical Constraints & Dependencies

- Source amorçage : `marmiton-api` (scraper npm non-officiel, côté serveur ; ingrédients en texte libre, sans allergènes ; licence non précisée → à isoler derrière une abstraction `SourceDeRecettes` + cache persistant). À évaluer : **Open Food Facts** comme source dédiée de vérité allergènes, distincte de la source de recettes.
- Détection d'allergènes : composant interne (dictionnaire ingrédient → allergènes/dérivés, ≥ 14 allergènes UE), indépendant de la source, validé par un corpus d'or annoté.
- Accès participant sans compte (lien tokenisé non-devinable) ; organisateur avec compte léger.
- V1 web uniquement (app native = hors périmètre).

### Cross-Cutting Concerns Identified

- Sécurité alimentaire (détection allergènes) — transverse à F3/F4/F6, criticité maximale, risque ACTIF dès la V1 testeurs → disclaimer non-contournable.
- Vie privée / données de santé (RGPD) — risque dormant en privé, **bloquant avant usage public**.
- Légal source de recettes (scraping zone grise) — risque dormant en privé, **bloquant avant usage public/commercial**.
- **GATE pré-public :** légal source + RGPD/consentement + disclaimer renforcé doivent passer au vert avant toute ouverture au-delà des testeurs proches.
- Contrôle d'accès & frontière organisateur/participant (routes séparées, cloisonnement des vues).
- Résilience de la source de recettes (abstraction + cache, source jetable).
- Internationalisation : français uniquement en V1.

## Starter Template Evaluation

### Primary Technology Domain
Application web full-stack — JS/TypeScript, écosystème React/Next (préférence utilisateur), hébergement clé-en-main (Vercel + base Postgres managée).

### Starter Options Considered
- create-next-app (16.2.9) : minimal, tout à assembler soi-même. Écarté : trop de décisions à porter seul.
- create-t3-app : pile full-stack typée (Next 16 App Router, TS, Tailwind, tRPC v11, Prisma/Drizzle, Auth.js v5). Retenu.

### Selected Starter: create-t3-app (Prisma)

**Rationale for Selection:**
Cohérent avec l'architecture cible : typage de bout en bout, Prisma/Postgres, Auth.js pour le compte organisateur léger, Tailwind pour décliner les tokens Cocon, et tRPC qui structure naturellement la frontière orga/participant (routers séparés). Optimise la vélocité d'un développeur solo.

**Initialization Command:**

```bash
npm create t3-app@latest
# Sélections : TypeScript, Tailwind CSS, tRPC, Prisma, Auth.js (NextAuth), App Router
```

**Architectural Decisions Provided by Starter:**

- **Langage & runtime :** TypeScript, Next.js 16 (App Router), Node côté serveur (scraper Marmiton).
- **Styling :** Tailwind CSS (mapper les tokens DESIGN.md : couleurs Cocon, rayons, Nunito).
- **API :** tRPC v11 (procédures typées ; routers `organisateur` / `participant` séparés = frontière étanche).
- **ORM / base :** Prisma + PostgreSQL (repas → participants → restrictions ; cache des recettes).
- **Auth :** Auth.js v5 (compte organisateur léger ; accès participant hors auth, par token).
- **Organisation du code :** ajouter un dossier `/core` PUR (allergènes + moteur mur & curseur), sans I/O, indépendant de tRPC/Prisma/source — testé par corpus d'or.
- **Déploiement :** Vercel + Postgres managé (Neon/Supabase).
- **Versions vérifiées (juin 2026) :** Next.js 16.2.7 stable, create-next-app 16.2.9, tRPC v11, Auth.js v5.

**Note :** L'initialisation via cette commande doit être la première story d'implémentation.

## Core Architectural Decisions

### Decision Priority Analysis

**Critical (bloquent l'implémentation) :** schéma de données, noyau `/core` pur, auth orga (lien magique), token participant, frontière tRPC orga/participant.
**Important (façonnent l'architecture) :** stratégie de cache, gestion d'erreurs (Result), mapping tokens Tailwind, garde-fous RGPD.
**Deferred (post-MVP) :** rate limiting, intégration Open Food Facts, migration Drizzle, i18n, app native.

### Data Architecture

- **Modèle (Prisma/PostgreSQL) :**
  - `Organisateur` (géré par Auth.js).
  - `Repas` (id, organisateurId, lieu, date, heure, createdAt, **expiresAt**).
  - `Participant` (id, repasId, prenom, email?, **accessToken** unique indexé, statut[EN_ATTENTE|REPONDU], updatedAt).
  - `Restriction` (id, participantId, **type**[REGIME|ALLERGIE|NON_AIME], valeur, seuilTolerance? — uniquement pour NON_AIME).
  - `RecetteCache` (id, source, sourceRef, titre, ingredientsTexte, fetchedAt).
- **Validation :** Zod à toutes les frontières (entrées tRPC) ; le `/core` revalide ses entrées.
- **Migrations :** Prisma Migrate (versionnées).
- **Cache :** table Postgres persistante (pas de Redis en V1) — résilience si la source casse.
- **Cycle de vie / RGPD :** `expiresAt` sur `Repas` → purge planifiée des repas + restrictions (données de santé). Garde-fou gratuit.

### Authentication & Security

- **Organisateur :** Auth.js v5, **Email provider (lien magique)** — sans mot de passe.
- **Participant :** aucun compte ; accès par **token cryptographique 256 bits** (`crypto.randomBytes`), stocké sur `Participant.accessToken`, URL `/p/{token}`. Le token scope l'accès à CE participant de CE repas, rien d'autre.
- **Autorisation — frontière étanche :** routers tRPC séparés. `organisateurRouter` = procédures protégées (session requise). `participantRouter` = procédures scopées au token, **sans aucun accès aux recettes**. Pas de route polyvalente décidant des droits par `if`.
- **Confidentialité :** pas de log des restrictions en clair ; minimisation (prénom + restrictions).

### API & Communication Patterns

- **tRPC v11**, procédures typées de bout en bout, entrées validées par Zod.
- **Gestion d'erreurs :** le `/core` retourne un **Result discriminé** (`{ok:true,...} | {ok:false, raison, contrainteBloquante}`) — jamais d'exception ni de menu partiel silencieux ; l'échec explicatif porte la contrainte bloquante (FR-11).
- **Rate limiting :** différé (V1 = testeurs proches).

### Frontend Architecture

- **Next 16 App Router** (Server Components par défaut), **Tailwind** avec thème dérivé des tokens DESIGN.md (palette Cocon, Nunito, rayons arrondis).
- **Formulaires :** React Hook Form + Zod (parcours participant 3 étapes, curseur de tolérance).
- **État :** minimal — Server Components + tRPC ; état local pour l'assistant participant. **Mobile-first** côté participant.

### Domain Core (`/core`) — décision structurante

- `/core/allergenes` : `normalize()`, dictionnaire ingrédient→allergènes/dérivés, `detect() → {allergenes, ingredientsNonReconnus}`. **Pur, sans I/O.**
- `/core/compatibilite` : `mur()` (filtre dur booléen), `curseur()` (scoring), `resoudre() → Result` (3-10 plats, dégradation, échec explicatif). **Pur, sans I/O.**
- Testé par **corpus d'or** (assertion asymétrique : faux négatif = build rouge) + property-tests d'invariant « aucun plat retenu ne franchit le mur ».
- **Source :** interface `SourceDeRecettes` + impl `marmitonSource` + cache Postgres. Données scrapées normalisées AVANT de toucher `/core`. **Open Food Facts** = piste d'enrichissement *hors-ligne* du dictionnaire (préparation de données), pas une dépendance runtime — différé.

### Infrastructure & Deployment

- **Hébergement :** Vercel + **Postgres managé** (Neon ou Supabase).
- **Config :** variables d'environnement (secret Auth, URL DB, identifiants email provider).
- **Logging :** structuré, **sans données de santé**.
- **CI :** lint + tests (le corpus d'or sécurité est un *gate* de build) avant déploiement.

### Decision Impact Analysis

**Séquence d'implémentation :**
1. Init `create-t3-app` + config Tailwind (tokens Cocon).
2. Schéma Prisma + Auth.js lien magique.
3. `/core/allergenes` (corpus d'or écrit AVANT le code).
4. `/core/compatibilite` (mur → curseur → resoudre).
5. Couche `SourceDeRecettes` + cache (marmiton).
6. Routers tRPC orga/participant (frontière étanche).
7. Écrans (UJ-1 orga, UJ-2 participant mobile-first).

**Dépendances inter-composants :** le moteur (4) dépend de la détection (3) ; la présentation (7) et la génération dépendent de la source+cache (5) ; les routers (6) orchestrent `/core` + sources sans jamais mélanger les vues orga/participant.

## Implementation Patterns & Consistency Rules

### Convention de langue (spécifique CookWho)
- **Termes du domaine = français, verbatim du Glossaire** dans le code : modèles `Repas`, `Participant`, `Restriction`, et le vocabulaire `mur`/`curseur`/`seuilTolerance`. Langage ubiquitaire = celui du PRD.
- **Code générique = anglais** (helpers, hooks, variables techniques). **Chaînes d'UI = français** (cf EXPERIENCE.md Voice & Tone).

### Naming Patterns
- **Base (Prisma) :** modèles PascalCase singulier (`Repas`, `Participant`, `RecetteCache`) ; champs camelCase (`organisateurId`, `accessToken`, `expiresAt`) ; enums en `SCREAMING_SNAKE` (`EN_ATTENTE`, `ALLERGIE`).
- **API (tRPC) :** un router par domaine d'accès (`organisateurRouter`, `participantRouter`) ; procédures `verbeNom` en français métier (`creerRepas`, `ajouterParticipant`, `enregistrerRestrictions`, `genererRecettes`). Pas d'endpoints REST.
- **Code :** composants `PascalCase` (fichier `RecipeCard.tsx`) ; hooks `useXxx` ; modules `/core` camelCase (`detect`, `normalize`, `resoudre`) ; fonctions/variables camelCase.
- **Routes (App Router) :** segments en minuscules ; lien participant `/p/[token]`.

### Structure Patterns
- Base T3 `src/` étendue :
  - `src/core/` → domaine PUR (`allergenes/`, `compatibilite/`), zéro I/O. Corpus d'or dans `src/core/allergenes/fixtures/`.
  - `src/server/api/routers/` → routers tRPC (orga / participant séparés).
  - `src/server/sources/` → `SourceDeRecettes` + `marmitonSource` + cache.
  - `src/app/` → routes & UI ; `src/components/` par fonctionnalité ; `src/lib/` utils partagés.
- **Tests co-localisés** `*.test.ts` à côté du code. Le `/core` est couvert en priorité.

### Format Patterns
- **tRPC** renvoie les données typées directement (pas de wrapper `{data,error}`).
- **Moteur `/core`** : retourne un **Result discriminé**, ne lève jamais d'exception. Les procédures tRPC traduisent un échec métier en `TRPCError`.
- **Dates** : ISO 8601 ; **JSON** : camelCase ; booléens `true/false`.

### Communication & State Patterns
- **Server Components par défaut** ; `'use client'` uniquement pour l'interactif (assistant participant, curseur).
- **Données client** via tRPC + React Query ; **formulaires** React Hook Form + Zod.
- États de chargement/vide/erreur/succès/dégradation/échec : suivre EXPERIENCE.md → State Patterns.

### Process Patterns
- **Validation** : Zod à la frontière tRPC ; `/core` revalide ses entrées.
- **Sécurité d'accès** : toute procédure participant résout `token → Participant → Repas` et scope dessus ; **ne jamais faire confiance à un id client**. Aucune procédure participant ne lit de recette.
- **Erreurs UI** : messages chaleureux (Voice & Tone), jamais de stack technique exposée ; jamais de donnée de santé en log.

### Enforcement Guidelines
**Tous les agents/contributions DOIVENT :**
- Ne jamais importer `/sources`, `/db`, `/app` depuis `/core` (frontière vérifiable, ex. règle ESLint de boundaries).
- Faire passer le **corpus d'or** (sécurité allergènes) — c'est un *gate* de CI : un faux négatif = build rouge.
- Router toute lecture de recette par `organisateurRouter` uniquement.
- Réutiliser les termes du Glossaire sans synonyme.

**Anti-patterns à proscrire :**
- Une route/procédure polyvalente décidant des droits orga/participant par `if`.
- `includes()` pour détecter un allergène (faux positifs de sous-chaîne : « ail » dans « volaille ») → match sur tokens.
- Logguer « X est allergique à Y ».
- Mettre de la logique métier dans l'UI ou les routers (elle vit dans `/core`).

## Project Structure & Boundaries

### Complete Project Directory Structure

```
cookwho/
├── README.md
├── package.json
├── next.config.js
├── tailwind.config.ts          # thème = tokens Cocon (DESIGN.md)
├── tsconfig.json
├── .env / .env.example         # AUTH secret, DATABASE_URL, EMAIL provider
├── .eslintrc.cjs               # règle de boundaries : /core n'importe pas /server,/app
├── .github/workflows/ci.yml    # lint + tests — GATE corpus d'or sécurité
├── prisma/
│   ├── schema.prisma           # Organisateur, Repas, Participant, Restriction, RecetteCache
│   └── migrations/
├── public/
│   └── illustrations/          # pictos légumes/ustensiles (Cocon)
├── src/
│   ├── core/                          # DOMAINE PUR — ZÉRO I/O
│   │   ├── allergenes/
│   │   │   ├── normalize.ts
│   │   │   ├── dictionnaire.ts        # ingrédient → allergènes/dérivés (≥14 UE)
│   │   │   ├── detect.ts              # → {allergenes, ingredientsNonReconnus}
│   │   │   ├── detect.test.ts
│   │   │   └── fixtures/
│   │   │       └── ingredients-annotes.json   # CORPUS D'OR
│   │   └── compatibilite/
│   │       ├── mur.ts                 # filtre dur booléen
│   │       ├── curseur.ts             # scoring goûts / seuil
│   │       ├── resoudre.ts            # Result : 3-10, dégradation, échec explicatif
│   │       └── *.test.ts              # property-tests d'invariant
│   ├── server/
│   │   ├── api/
│   │   │   ├── trpc.ts                # contexte, procédures protégées / token
│   │   │   ├── root.ts
│   │   │   └── routers/
│   │   │       ├── organisateur.ts    # F1, F3 (génération), F6 (recettes)
│   │   │       └── participant.ts     # F2 (restrictions) — AUCUN accès recette
│   │   ├── auth.ts                    # Auth.js v5 — lien magique email
│   │   ├── db.ts                      # client Prisma
│   │   └── sources/                   # F5
│   │       ├── SourceDeRecettes.ts    # interface (abstraction)
│   │       ├── marmitonSource.ts      # impl scraper
│   │       └── cache.ts               # cache Postgres
│   ├── app/
│   │   ├── layout.tsx · page.tsx
│   │   ├── (organisateur)/
│   │   │   └── repas/                 # mes repas · créer · [id] détail · [id]/recettes
│   │   └── p/[token]/                 # parcours participant (sans compte, mobile-first)
│   ├── components/
│   │   ├── ui/                        # button, chip, banner, safe-badge (DESIGN.md)
│   │   ├── organisateur/
│   │   └── participant/              # stepper, tolerance-slider, quick-select
│   ├── lib/
│   │   ├── tokens.ts                  # génération token participant (crypto 256 bits)
│   │   └── utils.ts
│   └── styles/globals.css
└── tests/                            # e2e éventuels (Playwright)
```

### Architectural Boundaries

- **Frontière de sécurité (la plus importante) :** `/core` est pur et hermétique — il n'importe jamais `/server`, `/app`, Prisma ou une source. Vérifié par règle ESLint. Tout ce qui est fragile (scraper, réseau, DB) reste dehors.
- **Frontière orga/participant :** deux routers tRPC distincts. `organisateur.ts` exige une session ; `participant.ts` est scopé au token et ne référence aucune procédure de recette.
- **Frontière source :** le moteur ne connaît que l'interface `SourceDeRecettes` ; `marmitonSource` est interchangeable ; le cache Postgres absorbe les pannes.
- **Frontière données :** Prisma est le seul point d'accès à Postgres (`server/db.ts`).

### Requirements to Structure Mapping

- **F1 Gestion repas & invitations** → `routers/organisateur.ts`, `app/(organisateur)/repas/`, `lib/tokens.ts`.
- **F2 Saisie restrictions** → `routers/participant.ts`, `app/p/[token]/`, `components/participant/`.
- **F3 Moteur mur & curseur** → `core/compatibilite/`.
- **F4 Couche allergènes** → `core/allergenes/` (+ corpus d'or).
- **F5 Source de recettes** → `server/sources/`.
- **F6 Présentation recettes** → `app/(organisateur)/repas/[id]/recettes/`, `routers/organisateur.ts`.

### Data Flow

`Source (marmiton) → cache Postgres → normalisation → /core (detect + resoudre) → router organisateur → UI recettes`.
Le participant écrit ses restrictions via `router participant` (token) → Postgres ; ces données alimentent `/core` lors de la génération, mais ne reviennent jamais vers la vue participant.

### Development Workflow Integration
- **Dev :** `npm run dev` (Next) + base Postgres locale ou managée ; Prisma Studio pour inspecter.
- **CI :** lint + typecheck + tests ; le corpus d'or sécurité bloque le merge en cas de faux négatif.
- **Deploy :** push → Vercel ; migrations Prisma sur la base managée (Neon/Supabase).

## Architecture Validation Results

### Coherence Validation ✅
- **Compatibilité des décisions :** pile T3 cohérente (Next 16, TS, tRPC v11, Prisma, Auth.js v5, Tailwind) — versions vérifiées, sans conflit. Hébergement Vercel + Postgres managé aligné.
- **Cohérence des patterns :** noyau `/core` pur soutenu par la règle d'import ESLint ; routers séparés soutiennent la frontière orga/participant ; Result discriminé cohérent avec l'échec explicatif (FR-11).
- **Alignement structurel :** l'arborescence matérialise chaque frontière (sécurité, accès, source, données).

### Requirements Coverage Validation ✅
- **FR couverts (16/16) :** F1 → routers/organisateur + tokens ; F2 → routers/participant + app/p/[token] ; F3 → core/compatibilite ; F4 → core/allergenes + corpus d'or ; F5 → server/sources ; F6 → app recettes + organisateur. FR-16 (avertissement allergie + validation) → UI + logique router.
- **NFR :** sécurité (token 256 bits, routes séparées, /core déterministe) ; perf (profil <2 min UX, génération <5 s via cache) ; confidentialité (purge TTL, pas de log de santé) ; mobile-first participant.

### Implementation Readiness Validation ✅
- **Décisions :** complètes et versionnées.
- **Structure :** arborescence concrète, frontières et mapping FR définis.
- **Patterns :** nommage, format, sécurité d'accès, anti-patterns et *gate* corpus d'or documentés.

### Gap Analysis Results
- **Important (non-bloquant) :** (a) envoi d'email des invitations (FR-3) → réutiliser le fournisseur email d'Auth.js (ex. Resend/SMTP) ; (b) purge planifiée des repas expirés (RGPD) → Vercel Cron + route protégée.
- **Mineur :** alimentation/maintenance du dictionnaire allergènes (piste Open Food Facts, hors-ligne) ; latence du premier fetch source avant mise en cache (UX de chargement à soigner).
- **Aucun gap critique.**

### Architecture Completeness Checklist

**Requirements Analysis**
- [x] Project context thoroughly analyzed
- [x] Scale and complexity assessed
- [x] Technical constraints identified
- [x] Cross-cutting concerns mapped

**Architectural Decisions**
- [x] Critical decisions documented with versions
- [x] Technology stack fully specified
- [x] Integration patterns defined
- [x] Performance considerations addressed

**Implementation Patterns**
- [x] Naming conventions established
- [x] Structure patterns defined
- [x] Communication patterns specified
- [x] Process patterns documented

**Project Structure**
- [x] Complete directory structure defined
- [x] Component boundaries established
- [x] Integration points mapped
- [x] Requirements to structure mapping complete

### Architecture Readiness Assessment
**Overall Status:** READY FOR IMPLEMENTATION (2 manques mineurs non-bloquants à traiter tôt : envoi email, cron de purge)
**Confidence Level:** high
**Key Strengths :** noyau de sécurité isolé et testable (corpus d'or = gate CI) ; frontière orga/participant structurelle ; source jetable derrière abstraction + cache ; pile solo-friendly à typage de bout en bout.
**Areas for Future Enhancement :** Open Food Facts pour fiabiliser/alimenter le dictionnaire ; gestion RGPD complète + consentement avant usage public ; clarification légale de la source ; rate limiting ; app native.

### Implementation Handoff
**AI Agent Guidelines :** suivre les décisions et patterns à la lettre ; respecter la frontière `/core` (zéro I/O) et la séparation orga/participant ; le corpus d'or sécurité est non-négociable.
**First Implementation Priority :** `npm create t3-app@latest` (TS, Tailwind, tRPC, Prisma, Auth.js, App Router), puis schéma Prisma + corpus d'or avant le code de détection.
