---
baseline_commit: 7007a309569de4bcd9786a5c21917afabaa8c86b
---

# Story 3.4 : Modifier ses restrictions

Status: done

## Story

As a participant,
I want rouvrir mon lien pour ajuster mes réponses,
so that je corrige une erreur ou un changement. (FR8)

## Acceptance Criteria

1. **Given** un lien dont le participant a **déjà répondu** (`statut = REPONDU`), **When** je le rouvre, **Then** je suis accueilli·e par **« On a déjà tes préférences ✓ — tu veux les modifier ? »** (pas replongé·e de force dans les 3 étapes), avec un **récap de mes restrictions actuelles**.
2. **Given** l'écran de retour, **When** je clique **« Modifier mes réponses »**, **Then** l'assistant s'ouvre **pré-rempli** avec mes sélections précédentes (régimes, allergènes, aliments non-aimés **et** le niveau de tolérance), modifiables.
3. **Given** mes modifications, **When** je valide, **Then** elles **remplacent** mes restrictions précédentes (sémantique « remplace » déjà en place), le `statut` reste `REPONDU`, et le récap reflète le nouvel état — les générations ultérieures (Epic 4) liront ces nouvelles valeurs.
4. **Given** un lien **jamais répondu** (`statut = EN_ATTENTE`), **When** je l'ouvre, **Then** le parcours **première fois** est inchangé (accueil « Déclarer mes restrictions » → stepper vide).
5. **Given** la frontière étanche (NFR5), **When** `monAcces` renvoie mes restrictions, **Then** il ne renvoie **que mes propres** restrictions + le contexte repas — **jamais** une recette, ni un autre participant.
6. **Given** un mobile, **When** j'utilise l'écran de retour et l'assistant pré-rempli, **Then** tout est utilisable (mobile-first, cibles ≥ 44px), au clavier et au lecteur d'écran (NFR7, NFR8).
7. **Given** les validations CI, **When** je lance `npm run test`, `lint`, `typecheck`, `SKIP_ENV_VALIDATION=1 npm run build`, **Then** tout reste vert ; le mapping DB→état et le nouveau `select` de `monAcces` sont testés (Prisma mocké).

## Tasks / Subtasks

- [x] **Tâche 1 — Étendre `monAcces` (router participant)** (AC: 1, 5, 7)
  - [x] Dans `src/server/api/routers/participant.ts`, ajouter au `select` de `monAcces` : `statut: true` et `restrictions: { select: { type: true, valeur: true, seuilTolerance: true }, orderBy: { createdAt: "asc" } }`.
  - [x] **Ne pas** ajouter de recette ni d'autre participant (NFR5). Le `select` reste limité à `prenom`, `statut`, `repas { lieu, date, heure }`, `restrictions { type, valeur, seuilTolerance }`.
  - [x] Le retour de `monAcces` change de forme → adapter les consommateurs (`AccueilParticipant` type dérivé, `AssistantRestrictions`).

- [x] **Tâche 2 — Mapping DB → `DonneesRestrictions`** (AC: 2, 7)
  - [x] Dans `AssistantRestrictions.tsx`, ajouter `versDonnees(restrictions)` (inverse de `versRestrictions`) :
    - `regimes` = restrictions `type === "REGIME"` → `valeur` (ordre conservé)
    - `allergenes` = `type === "ALLERGIE"` → `valeur`
    - `nonAimes` = `type === "NON_AIME"` → `valeur`
    - `seuilNonAimes` = `seuilTolerance` de la 1ʳᵉ ligne `NON_AIME` `?? SEUIL_TOLERANCE_DEFAUT` (seuil global ; toutes les lignes NON_AIME portent la même valeur à l'écriture)
  - [x] Initialiser l'état : `useState(() => restrictionsInitiales ? versDonnees(restrictionsInitiales) : DONNEES_INITIALES)`.

- [x] **Tâche 3 — Vue « retour » (déjà répondu)** (AC: 1, 2, 4)
  - [x] Étendre le type `Acces` de l'assistant : `prenom`, `repas`, **`statut: "EN_ATTENTE" | "REPONDU"`**, **`restrictions: { type, valeur, seuilTolerance }[]`**.
  - [x] État initial de `vue` : `statut === "REPONDU" ? "retour" : "accueil"`.
  - [x] Nouvelle vue `"retour"` : `SafeBadge` « On a déjà tes préférences » + question « Tu veux les modifier ? » + `<RecapRestrictions donnees={donnees} />` + bouton **« Modifier mes réponses »** (`variant="primary"`) → `vue="stepper"`, `etape=0`, `focusTitre()`.
  - [x] La vue `"accueil"` (première fois) et le reste du flux restent inchangés (AC4).

- [x] **Tâche 4 — Câblage page** (AC: 1, 4)
  - [x] `src/app/p/[token]/page.tsx` : passer le `acces` enrichi (incluant `statut` + `restrictions`) à `<AssistantRestrictions>` (déjà via la prop `acces` — vérifier que le type suit).

- [x] **Tâche 5 — Tests** (AC: 1, 2, 3, 4, 5, 7)
  - [x] `participant.test.ts` (`monAcces`) : le retour mocké inclut `statut` + `restrictions` ; asserter que le `select` demande `statut` + `restrictions` **sans** recette/autre participant (le test de sécurité existant `/recette|recipe|participant/i` doit rester vert — `restrictions` ne matche pas `participant`).
  - [x] `AssistantRestrictions.test.tsx` :
    - lien `REPONDU` avec restrictions → vue « retour » (« On a déjà tes préférences »), récap visible, **pas** de bouton « Déclarer mes restrictions ».
    - clic « Modifier mes réponses » → étape 1 **pré-remplie** (un régime déjà `aria-pressed`).
    - lien `EN_ATTENTE` → accueil première fois inchangé (bouton « Déclarer mes restrictions »).
  - [x] (Si extrait) test unitaire de `versDonnees` (mapping inverse, seuil repris de la 1ʳᵉ ligne NON_AIME).

- [x] **Tâche 6 — Validations** (AC: 7)
  - [x] `npm run test`, `lint`, `typecheck`, `SKIP_ENV_VALIDATION=1 npm run build` → tout vert.

## Dev Notes

### ⚠️ Pièges critiques (lire avant de coder)

1. **Première vraie évolution du router participant — rester étanche (NFR5).** `monAcces` renvoie désormais `statut` + **les restrictions du participant courant** (résolu par le token). C'est légitime (ce sont *ses* données). **Interdit** : recette, menu, autre participant. Le test de sécurité existant (`select` ne matche pas `/recette|recipe|participant/i`) **doit rester vert** — `restrictions`/`statut` ne contiennent pas ces mots.

2. **Seuil global au remontage.** À l'écriture (3.2b), toutes les lignes `NON_AIME` portent le **même** `seuilTolerance` (curseur global). Au remontage, prendre celui de la **1ʳᵉ** ligne `NON_AIME` ; s'il n'y a aucun non-aimé, `SEUIL_TOLERANCE_DEFAUT`. Ne pas tenter de « moyenner ».

3. **« Remplace » déjà en place — ne rien changer côté écriture.** `enregistrerRestrictions` fait déjà `deleteMany` + `createMany` + `update REPONDU` dans une transaction. Une modification re-validée écrase proprement l'ancien état. **Aucune** modif de `enregistrerRestrictions` nécessaire.

4. **Ne pas forcer le stepper (revue UX, AC1).** Un participant qui revient doit voir « On a déjà tes préférences ✓ — tu veux les modifier ? », pas être renvoyé d'office dans les 3 étapes. La vue `"retour"` est l'écran d'entrée quand `statut === "REPONDU"`.

5. **Changement de forme du retour de `monAcces` = casse de type potentielle.** En ajoutant `statut` + `restrictions`, le type `Acces` dérivé (`inferRouterOutputs`) change. Vérifier `AccueilParticipant` (qui dérive ce type) et `AssistantRestrictions`. `AccueilParticipant` n'est plus monté par la page depuis 3.2a, mais son test existe encore — il passe ses propres props, donc non impacté par le router ; juste vérifier que le `typecheck` reste vert.

6. **Pré-remplissage = init d'état, pas d'effet.** Initialiser `donnees` via la **forme paresseuse** de `useState` (`useState(() => …)`), pas un `useEffect` (évite un flash d'état vide + re-render).

### État réel du projet (vérifié — acquis 3.1 → 3.3)

- **`monAcces`** (`participant.ts`) : `findUnique({ where: { accessToken }, select: { prenom, repas: { lieu, date, heure } } })`, `NOT_FOUND` sinon. **À étendre** avec `statut` + `restrictions`.
- **`Participant.statut`** : enum `StatutParticipant` `EN_ATTENTE | REPONDU`. **`Restriction`** : `type` (`REGIME|ALLERGIE|NON_AIME`), `valeur`, `seuilTolerance Int?`. Relation `restrictions Restriction[]` déjà sur `Participant` (3.2a).
- **`AssistantRestrictions.tsx`** : vues `accueil`/`stepper`/`confirme` ; `DonneesRestrictions = { regimes[], allergenes[], nonAimes[], seuilNonAimes }` (exporté) ; `versRestrictions` (état→payload) ; handlers de toggle/ajout/retrait ; `RecapRestrictions` monté dans `confirme` ; `focusTitre()`. **À étendre** : `versDonnees` (payload→état), props `statut`+`restrictions`, init de `vue` et `donnees`, vue `"retour"`.
- **`RecapRestrictions.tsx`** (3.3) : présentation pure d'un `DonneesRestrictions` → réutilisable tel quel dans la vue `"retour"`.
- **Pattern test router** : mock `~/server/auth`/`~/server/db`/`~/env`, `appRouter.createCaller({ session: null, db, headers })`. Le test mocke `participant.findUnique`.

### Périmètre — hors de cette story

- **États expiré / repas clos / purgé** → **story 3.5** (inclut le filtre `expiresAt` déféré des revues 3.1/3.2a — lecture ET écriture). Ici on traite seulement le cas « lien valide déjà répondu ».
- **Aucune** vue participant n'expose les recettes (NFR5).
- **Aucune** modif de `enregistrerRestrictions`, du schéma, ni de migration.

### Accessibilité / UX (NFR7, NFR8, UX-DR6)

- Vue « retour » mobile-first, chaleureuse (« On a déjà tes préférences ✓ — tu veux les modifier ? »), bouton ≥ 44px.
- Au passage en stepper, focus sur le titre d'étape (`focusTitre`, déjà en place).
- Quick-select pré-cochés annoncés via `aria-pressed` (déjà géré par `QuickSelect`).

### Testing standards

- **Vitest + RTL/jsdom** ; mock `~/trpc/react` pour l'assistant.
- **Router** : asserter que `monAcces` demande bien `statut` + `restrictions` et **renvoie** les restrictions du participant ; le test de sécurité du `select` reste vert.
- Tester les **deux** états d'entrée : `REPONDU` (vue retour + pré-remplissage) et `EN_ATTENTE` (accueil première fois).

### Definition of Done manuelle (utilisateur, hors agent)

1. Sur un participant déjà `REPONDU`, rouvrir `/p/{token}` → écran « On a déjà tes préférences ✓ » + récap correct.
2. « Modifier mes réponses » → étapes pré-remplies (régimes cochés, allergènes cochés, non-aimés en chips, curseur au bon niveau).
3. Changer une sélection, Valider → confirmation ; rouvrir encore → le nouvel état est bien réaffiché.
4. Sur un participant `EN_ATTENTE`, ouvrir le lien → accueil première fois inchangé.

### Project Structure Notes

- **Modifié** : `src/server/api/routers/participant.ts` (`monAcces` select), `participant.test.ts`, `src/components/participant/AssistantRestrictions.tsx` (+ `versDonnees`, vue retour, init), `AssistantRestrictions.test.tsx`. `src/app/p/[token]/page.tsx` (passe l'`acces` enrichi — sans doute déjà OK via le type).
- **Aucun** nouveau composant indispensable (`RecapRestrictions` réutilisé). Aucune migration, aucune dépendance.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 3.4] (énoncé + AC : réouverture, accueil « On a déjà tes préférences ✓ », prise en compte par les générations)
- [Source: _bmad-output/planning-artifacts/ux-designs/.../EXPERIENCE.md#Interaction Primitives] (« Modifier ses restrictions : rouvrir le lien réaffiche et permet l'édition »)
- [Source: _bmad-output/implementation-artifacts/3-2a-assistant-restrictions-coquille.md] (`monAcces`, `Participant.statut`, modèle `Restriction`)
- [Source: _bmad-output/implementation-artifacts/3-2b-assistant-restrictions-contenu.md] (`DonneesRestrictions`, `versRestrictions`, seuil global, `QuickSelect`/`ToleranceSlider`)
- [Source: _bmad-output/implementation-artifacts/3-3-recapitulatif-confirmation-de-prise-en-compte.md] (`RecapRestrictions`, vue `confirme`, bouton « Modifier mes réponses »)

## Dev Agent Record

### Agent Model Used

claude-opus-4-8 (bmad-dev-story)

### Debug Log References

- Suite complète : **114/114** ✅ (109 → 114, +5 : réouverture ×3, `versDonnees` ×2 ; `monAcces` test mis à jour). `lint` ✅ · `typecheck` ✅ · `SKIP_ENV_VALIDATION=1 build` ✅ (`/p/[token]` = 5.18 kB).
- 2 erreurs de typecheck corrigées après le changement de forme de `monAcces` :
  - `AccueilParticipant` dérivait tout le retour `monAcces` (devenu plus large) → typé sur ce qu'il utilise réellement (`{ prenom, repas }`), découplé du router.
  - Fixture de test trop étroitement inféré (`statut` littéral, `restrictions: never[]`) → type explicite `AccesTest`.

### Completion Notes List

- ✅ **`monAcces` étendu** : `select` ajoute `statut` + `restrictions { type, valeur, seuilTolerance }` (orderBy createdAt). **Frontière étanche conservée** (NFR5) : ses propres restrictions uniquement, jamais de recette ni d'autre participant ; test de sécurité du `select` toujours vert.
- ✅ **`versDonnees`** (inverse de `versRestrictions`) : regroupe par type ; `seuilNonAimes` repris de la 1ʳᵉ ligne `NON_AIME` `?? SEUIL_TOLERANCE_DEFAUT`.
- ✅ **Vue « retour »** : si `statut === "REPONDU"`, l'écran d'entrée est « On a déjà tes préférences ✓ — tu veux les modifier ? » + `RecapRestrictions` (pré-rempli) + bouton « Modifier mes réponses ». Le participant n'est **pas** renvoyé d'office dans le stepper (revue UX, AC1).
- ✅ **Pré-remplissage** paresseux (`useState(() => …)`) : à la modification, régimes/allergènes cochés, non-aimés en chips, curseur au bon niveau.
- ✅ **Première fois inchangée** (`EN_ATTENTE`) : accueil « Déclarer mes restrictions » → stepper vide (AC4).
- ✅ **Écriture inchangée** : `enregistrerRestrictions` (deleteMany + createMany + REPONDU) gère déjà le « remplace » — re-valider une modif écrase proprement l'ancien état. Aucune modif schéma/migration.
- **Hors périmètre (confirmé)** : états expiré/clos/purgé + filtre `expiresAt` → story 3.5.
- **À faire par l'utilisateur (DoD)** : sur un participant REPONDU, rouvrir `/p/{token}` → écran de retour + récap ; « Modifier » → étapes pré-remplies ; changer + Valider ; rouvrir → nouvel état réaffiché.

### File List

- `src/server/api/routers/participant.ts` (MODIFIÉ — `monAcces` select += statut + restrictions)
- `src/server/api/routers/participant.test.ts` (MODIFIÉ — test `monAcces` mis à jour)
- `src/components/participant/AssistantRestrictions.tsx` (MODIFIÉ — type `Acces` étendu, `versDonnees`, init vue/donnees selon statut, vue « retour »)
- `src/components/participant/AssistantRestrictions.test.tsx` (MODIFIÉ — réouverture + `versDonnees`)
- `src/components/participant/AccueilParticipant.tsx` (MODIFIÉ — type de props découplé du router)

### Change Log

- 2026-06-26 : Story 3.4 implémentée — réouverture d'un lien déjà répondu : `monAcces` renvoie statut + restrictions (étanche), écran de retour « On a déjà tes préférences ✓ », assistant pré-rempli (`versDonnees`), re-validation en « remplace ». Aucun changement schéma/écriture. Tests 114/114, lint/typecheck/build verts. Statut → review.
