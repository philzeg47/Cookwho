---
baseline_commit: b84c66a14f6ac121f0f4809a70514d714650bb5a
---

# Story 5.1 : Consulter la liste & choisir un plat

As an organisateur,
I want voir les recettes proposées et en choisir une,
so that j'arrête mon menu. (FR15, NFR5)

Status: done

## Acceptance Criteria

1. **Given** un repas que je possède, **When** j'ouvre son détail, **Then** une **section Recettes** (réservée organisateur) me permet de **lancer la génération** (`genererRecettes`).
2. **Given** une génération réussie (`statut: "GENERE"`, `resolution.ok`), **When** la liste s'affiche, **Then** je vois **chaque recette** dans une **`recipe-card`** : titre + **accès aux ingrédients à la demande** (révélation), et je peux **sélectionner** le plat.
3. **Given** un succès plein (`mode: "TOUS_CONTENTS"`), **When** la liste s'affiche, **Then** un **`safe-badge`** annonce « **X plats compatibles avec tout le groupe** » (X = nombre de recettes).
4. **Given** que je clique « Choisir ce plat » sur une recette, **When** l'action s'exécute, **Then** le plat est **persisté** comme **plat retenu** du repas (`retenirPlat`, protégée, `organisateurId` de session), et l'écran reflète le **plat retenu** (survit au rechargement).
5. **Given** NFR5 (frontière étanche), **When** je vérifie les routes/vues participant (`/p/[token]`, `src/components/participant/**`), **Then** **aucune** n'expose la liste de recettes ni le plat retenu ; `genererRecettes`/`retenirPlat` vivent uniquement dans `organisateurRouter` (protégé).
6. **Given** les autres états de génération (`ATTENTE_REPONSES`, dégradation, échec, chargement), **When** ils surviennent, **Then** 5.1 affiche un **repli minimal non cassant** (message neutre) — le **traitement riche est différé** : chargement → 5.4, ingrédients gênants → 5.2, avertissement allergie + validation → 5.3.
7. **Given** l'accessibilité (NFR6/UX-DR6), **When** j'utilise la section, **Then** elle est **navigable au clavier** (révélation des ingrédients + sélection), cibles ≥ 44px, libellés explicites.
8. **Given** la non-régression + CI, **When** je lance `npm run test`, `lint`, `typecheck`, `SKIP_ENV_VALIDATION=1 build`, **Then** tout reste vert ; le détail repas existant (suivi, participants) n'est pas cassé.

## Tasks / Subtasks

- [x] **Tâche 1 — Schéma : plat retenu** (AC: 4)
  - [x] `prisma/schema.prisma` : ajouter à `Repas` `platRetenuRef String?` et `platRetenuTitre String?` (nullable). Régénérer le client : `npx prisma generate` (le client typé est requis pour le typecheck). Migration : `npx prisma migrate dev --name plat_retenu` (ou DoD utilisateur via `db push`).
  - [x] `repasDetail` renvoie déjà tout le `repas` (scalaires inclus) → `platRetenuRef`/`platRetenuTitre` remontent automatiquement.

- [x] **Tâche 2 — Mutation `retenirPlat`** (AC: 4, 5)
  - [x] `src/server/api/routers/organisateur.ts` : `retenirPlat: protectedProcedure.input(z.object({ repasId: z.string(), ref: z.string().min(1).max(500), titre: z.string().trim().min(1).max(300) }))` → `updateMany`/`update` sur `repas` filtré par `{ id, organisateurId: ctx.session.user.id }` (ownership ; `NOT_FOUND` si 0 ligne). Écrit `platRetenuRef`/`platRetenuTitre`. Renvoie `{ ok: true }`.
  - [x] Tests (`organisateur.test.ts`) : refuse un repas non possédé (NOT_FOUND, pas d'écriture) ; persiste ref+titre pour un repas possédé.

- [x] **Tâche 3 — Composant `RecipeCard` (ui)** (AC: 2, 7)
  - [x] `src/components/ui/RecipeCard.tsx` : props `{ titre, ingredients: string[], selectionne?: boolean, onChoisir?: () => void }`. Affiche le titre ; **révélation des ingrédients à la demande** (`<details>`/disclosure accessible, clavier) ; bouton « Choisir ce plat » (ou « Plat retenu ✓ » si `selectionne`). Palette Cocon, cible ≥ 44px. **Pas** de traitement des ingrédients gênants ici (story 5.2 enrichira via une prop ultérieure).
  - [x] Test RTL : titre rendu, ingrédients révélés au clic/clavier, `onChoisir` appelé, état « retenu » affiché.

- [x] **Tâche 4 — Composant `RecettesSection` (client)** (AC: 1, 2, 3, 4, 6)
  - [x] `src/components/organisateur/RecettesSection.tsx` (`"use client"`) : props `{ repasId, platRetenuRef? }`. Bouton « Générer des recettes » → `api.organisateur.genererRecettes.useMutation()`.
  - [x] **Succès** (`GENERE` + `resolution.ok`) : liste de `RecipeCard` (titre + `ingredients`) ; `SafeBadge` « {n} plats compatibles avec tout le groupe » quand `mode === "TOUS_CONTENTS"`. Sélection → `retenirPlat.useMutation()` (ref+titre) → marque la carte retenue + invalide/rafraîchit (`router.refresh()` ou `utils.organisateur.repasDetail.invalidate()`).
  - [x] **Repli minimal non cassant** (AC6) : `ATTENTE_REPONSES` → message neutre (« Des invités n'ont pas répondu — détaillé bientôt ») ; `resolution.ok === false` (PAS_ASSEZ) → message neutre ; `isPending` → texte simple. **Marquer `{/* TODO 5.2/5.3/5.4 */}`** aux endroits enrichis plus tard. NE PAS exposer de logique métier (le serveur a déjà décidé).
  - [x] Test RTL : mutation mockée → liste rendue + badge ; clic « Choisir » appelle `retenirPlat`.

- [x] **Tâche 5 — Intégration page détail repas** (AC: 1, 4)
  - [x] `src/app/(organisateur)/repas/[id]/page.tsx` : ajouter une `<section>` « Recettes » rendant `<RecettesSection repasId={repas.id} platRetenuRef={repas.platRetenuRef} />`. Si `repas.platRetenuTitre`, afficher un en-tête « Menu retenu : {titre} ». Ne pas casser les sections existantes.

- [x] **Tâche 6 — Frontière étanche (NFR5)** (AC: 5)
  - [x] Vérifier qu'aucun composant `src/components/participant/**` ni la route `src/app/p/[token]/**` n'importe `RecipeCard`/`RecettesSection` ni n'appelle `genererRecettes`/`retenirPlat`.
  - [x] Test de garde : `participantRouter` n'expose **aucune** procédure de recette/plat (assertion sur les clés du router, non-régression NFR5).

- [x] **Tâche 7 — Validations** (AC: 7, 8)
  - [x] `npm run test`, `lint`, `typecheck`, `SKIP_ENV_VALIDATION=1 build` → tout vert. A11y : révélation + sélection au clavier.

## Dev Notes

### ⚠️ Pièges critiques (lire avant de coder)

1. **NFR5 — frontière étanche, non négociable.** La liste de recettes et le plat retenu ne doivent JAMAIS être atteignables côté participant. `RecettesSection`/`RecipeCard` ne sont importés QUE sous `(organisateur)`. `retenirPlat`/`genererRecettes` sont des `protectedProcedure` dans `organisateurRouter`, `organisateurId` TOUJOURS de `ctx.session.user.id`. Ajouter un test de garde sur `participantRouter`.

2. **5.1 = chemin SUCCÈS + persistance.** Les états riches sont d'autres stories : **chargement → 5.4**, **ingrédients gênants (dégradation) → 5.2**, **avertissement allergie + validation → 5.3**, **échec explicatif → présentation ultérieure**. 5.1 doit afficher un **repli neutre non cassant** pour ces états (pas un écran blanc, pas de crash), avec des `TODO` balisés. Ne pas implémenter l'avertissement allergie ici (5.3 l'insérera EN AMONT de `retenirPlat`).

3. **Le serveur a déjà tout décidé.** `genererRecettes` renvoie `ResultatGeneration` discriminé ; le client n'invente aucune logique de sécurité/compatibilité — il **rend** `resolution.recettes` (titre, ingredients) telles quelles. Ne pas refiltrer, ne pas recalculer.

4. **Persistance minimale.** Stocker `platRetenuRef` + `platRetenuTitre` suffit pour « j'arrête mon menu » (afficher le plat retenu après rechargement). Les ingrédients du plat retenu restent re-dérivables via le cache (`sourceRef`) si un futur écran les exige — hors périmètre 5.1.

5. **`npx prisma generate` après l'édition du schéma.** Sinon le typecheck échoue (`platRetenuRef` inconnu du client typé). La migration réelle (`migrate dev`/`db push`) peut être en DoD utilisateur, mais le **client généré** doit connaître le champ pour compiler.

6. **Server Component vs Client.** La page `repas/[id]` est un **Server Component** (`api` de `~/trpc/server`). `RecettesSection` est **client** (`"use client"`, `api` de `~/trpc/react`, mutations + état de sélection). Après `retenirPlat`, rafraîchir (`router.refresh()` depuis `next/navigation`, ou invalider la query).

### État réel du projet (vérifié)

- **`genererRecettes`** (`organisateur.ts`) : mutation, input `{ repasId, exclure?, forcer? }`, renvoie `ResultatGeneration` = `{ statut: "ATTENTE_REPONSES"; nonCouverts }` | `{ statut: "GENERE"; force; nonCouverts; resolution }`. `resolution` = `{ ok: true; mode: "TOUS_CONTENTS"|"DEGRADATION"; recettes: RecetteRetenue[] }` | `{ ok: false; raison: "PAS_ASSEZ"; compatibles; contraintesBloquantes }`.
- **`RecetteRetenue`** = `{ ref, titre, ingredients: string[], ingredientsGenants: string[], incertain, raisonsIncertitude, penalite }`. 5.1 utilise `ref`, `titre`, `ingredients` (les `ingredientsGenants`/`incertain` → 5.2/5.3).
- **`repasDetail`** : `protectedProcedure`, `findFirst({ where: { id, organisateurId } , include: { participants } })` → renvoie le `repas` (scalaires + participants). Page : `src/app/(organisateur)/repas/[id]/page.tsx` (Server Component, `notFound()` sur NOT_FOUND).
- **`Repas`** (schéma) : `id, organisateurId, lieu, date, heure, createdAt, expiresAt, participants` — **aucun** champ plat retenu (à ajouter).
- **UI dispo** : `SafeBadge` (`src/components/ui/SafeBadge.tsx`) — réutilisable pour « X plats compatibles ». `Button`, `Banner`, `Chip`. **Pas** de `RecipeCard` (à créer, UX-DR2). Pattern client : `InvitationActions.tsx` (`"use client"`, `api.organisateur.X.useMutation()`).
- **Tests composants** : Vitest + RTL (jsdom), voir `InvitationActions.test.tsx`/`SuiviReponses.test.tsx` (mock de `~/trpc/react`). Auth.js sous Vitest : mocker `~/server/auth` (voir mémoire testing).
- **Frontière** : routes participant `src/app/p/[token]/**` + `src/components/participant/**` ne touchent jamais aux recettes (NFR5/UX-DR8).

### Périmètre — hors de cette story

- **Ingrédients gênants** (distinction visuelle, qui ils gênent) → **5.2** (la `RecipeCard` recevra une prop dédiée).
- **Avertissement allergie + validation explicite** avant de retenir → **5.3** (insérée EN AMONT de `retenirPlat`).
- **État de génération en cours** (attente habillée, narrative) → **5.4**.
- **Échec explicatif** (présentation des contraintes bloquantes), **régénérer**, **génération forcée** (affichage des non-couverts) → stories/itérations ultérieures d'Epic 5.

### Décisions tranchées

- **Persistance dès 5.1** : `Repas.platRetenuRef`/`platRetenuTitre` + mutation `retenirPlat`. 5.3 ajoutera l'avertissement EN AMONT.
- **`RecipeCard`** neuf (ui), révélation des ingrédients à la demande, sans traitement gênants (5.2).
- **Repli neutre** pour les états non-succès (TODO balisés 5.2/5.3/5.4).
- **Badge `SafeBadge`** « X plats compatibles avec tout le groupe » pour `TOUS_CONTENTS`.

### Testing standards

- **Vitest + RTL** (jsdom) pour `RecipeCard`/`RecettesSection` (mutations mockées) ; **node** pour `organisateur.test.ts` (`retenirPlat`).
- Couvrir : génération succès → liste + badge ; choisir → `retenirPlat` ; révélation ingrédients clavier ; ownership `retenirPlat` (NOT_FOUND) ; **garde NFR5** (participantRouter sans procédure recette).
- Non-régression : détail repas (suivi/participants) intact.

### Definition of Done manuelle (utilisateur, hors agent)

1. Migration appliquée : `npx prisma migrate dev --name plat_retenu` (ou `npx prisma db push`).
2. `npm run test`/`lint` verts.
3. Parcours : ouvrir un repas avec des répondants → « Générer » → voir 3-10 cartes + badge → « Choisir ce plat » → recharger → « Menu retenu : … » persiste.
4. Vérifier qu'aucune page participant n'affiche de recette.

### Project Structure Notes

- **Nouveaux** : `src/components/ui/RecipeCard.tsx` (+ test), `src/components/organisateur/RecettesSection.tsx` (+ test). Migration Prisma sous `prisma/migrations/`.
- **Modifiés** : `prisma/schema.prisma` (Repas), `src/server/api/routers/organisateur.ts` (`retenirPlat`) + `organisateur.test.ts`, `src/app/(organisateur)/repas/[id]/page.tsx`.
- **Aucune** nouvelle dépendance.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 5.1] (recipe-card titre+ingrédients, badge « X compatibles », sélection, frontière étanche)
- [Source: _bmad-output/planning-artifacts/ux-designs/.../EXPERIENCE.md] (recipe-card révèle les ingrédients à la demande ; safe-badge « compatibles avec tout le groupe » ; deux univers étanches ; « Valider un plat » = action finale précédée de l'avertissement (5.3))
- [Source: _bmad-output/planning-artifacts/architecture.md#NFR5] (génération/recettes réservées organisateur)
- [Source: src/server/api/routers/organisateur.ts] (`genererRecettes`, `repasDetail`, pattern protectedProcedure + ownership)
- [Source: src/server/generation.ts] (`ResultatGeneration`, `RecetteRetenue`)
- [Source: src/components/organisateur/InvitationActions.tsx] (pattern composant client + mutation tRPC)

## Dev Agent Record

### Agent Model Used

claude-opus-4-8 (bmad-dev-story)

### Debug Log References

- Suite complète : **273/273** ✅ (264 → 273, +9 : RecipeCard ×3, RecettesSection ×3, retenirPlat ×2, garde NFR5 ×1 ; +1 fixture RepasListe complété). `lint` ✅, `typecheck` ✅, `build` ✅.
- **Régression typecheck attrapée et corrigée** : l'ajout de `platRetenuRef`/`platRetenuTitre` au modèle a cassé un fixture `Repas` littéral (`RepasListe.test.tsx`) → champs `null` ajoutés.
- `npx prisma generate` lancé après l'édition du schéma (client typé connaît les nouveaux champs).

### Completion Notes List

- ✅ **Schéma** : `Repas.platRetenuRef`/`platRetenuTitre` (nullable). `repasDetail` les remonte automatiquement. (Migration réelle = DoD utilisateur.)
- ✅ **`retenirPlat`** (tRPC, `organisateurRouter`, protégée) : ownership via `updateMany({ where: { id, organisateurId } })` → `NOT_FOUND` si 0 ligne ; persiste ref+titre. `organisateurId` de session (NFR5/NFR4).
- ✅ **`RecipeCard`** (ui) : titre + ingrédients en disclosure native (accessible clavier, cible ≥44px) + « Choisir ce plat » / état « Plat retenu ✓ ». (Ingrédients gênants → 5.2.)
- ✅ **`RecettesSection`** (client) : « Générer » → `genererRecettes` ; succès → liste `RecipeCard` + `SafeBadge` « X plats compatibles avec tout le groupe » (TOUS_CONTENTS) ; choix → `retenirPlat` + `router.refresh()`. Replis neutres + `TODO 5.2/5.3/5.4` pour attente/échec/chargement.
- ✅ **Intégration** page détail repas : section Recettes + en-tête « Menu retenu : … » (survit au rechargement).
- ✅ **NFR5 frontière étanche** : recettes/plat jamais côté participant (aucun import recette dans `app/p` ou `components/participant`) ; **test de garde** sur `appRouter._def.procedures` (aucune procédure `participant.*` ne matche recette/plat/generer/retenir).
- **Hors périmètre (différé, balisé TODO)** : ingrédients gênants → 5.2 ; avertissement allergie + validation → 5.3 ; attente habillée → 5.4 ; échec explicatif / régénérer / forcée → ultérieur.
- **DoD utilisateur** : `npx prisma migrate dev --name plat_retenu` (ou `db push`) ; parcours générer→choisir→recharger.

### File List

- `prisma/schema.prisma` (MODIFIÉ — Repas platRetenu*)
- `src/server/api/routers/organisateur.ts` (MODIFIÉ — `retenirPlat`) + `organisateur.test.ts`
- `src/server/api/routers/participant.test.ts` (MODIFIÉ — garde NFR5)
- `src/components/ui/RecipeCard.tsx` + `RecipeCard.test.tsx` (NOUVEAUX)
- `src/components/organisateur/RecettesSection.tsx` + `RecettesSection.test.tsx` (NOUVEAUX)
- `src/app/(organisateur)/repas/[id]/page.tsx` (MODIFIÉ — section Recettes + menu retenu)
- `src/components/organisateur/RepasListe.test.tsx` (MODIFIÉ — fixture)

### Change Log

- 2026-06-28 : Story 5.1 implémentée — consulter & choisir un plat. Schéma `Repas.platRetenu*` + mutation `retenirPlat` (protégée, ownership) ; composants `RecipeCard` (disclosure accessible) + `RecettesSection` (générer → liste + SafeBadge + choix persisté) ; intégration page détail repas + « Menu retenu ». NFR5 vérifiée (garde sur le router participant). États riches différés (5.2/5.3/5.4) avec replis neutres. 273/273, lint/typecheck/build verts. Statut → review. **L'organisateur voit les plats sûrs et arrête son menu (FR15).**
