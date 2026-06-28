---
baseline_commit: 898d9703f4036aa98eae67e3156e77e8128950d0
---

# Story 2.4: Suivre l'état des réponses

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As an organisateur,
I want voir qui a répondu et qui manque,
so that je sais quand je peux générer les recettes. (FR4)

## Acceptance Criteria

1. **Given** un repas avec des participants, **When** j'ouvre le détail du repas, **Then** je vois pour **chaque participant** son statut (**a répondu** / **en attente**) — déjà porté par un badge icône + texte (story 2.2), conservé.
2. **Given** le détail du repas, **When** il s'affiche, **Then** une **synthèse** indique combien ont répondu (« X sur Y ont répondu »).
3. **Given** un repas où **personne n'a encore répondu** (participants présents, 0 réponse), **When** je l'ouvre, **Then** un état **« aucune réponse pour l'instant »** habillé et **rassurant** s'affiche (ton Cocon, pas un vide brut) (revue UX).
4. **Given** un participant qui valide ses restrictions (Epic 3), **When** l'enregistrement a lieu, **Then** son statut passe à **`REPONDU`** et la vue de suivi le reflète. *(Le déclenchement du passage `REPONDU` est implémenté par la story 3.3 ; ici on garantit que la vue lit et reflète le statut réel.)*
5. **Given** les validations, **When** je lance `npm run test`, `npm run lint`, `npm run typecheck`, `build`, **Then** tout reste vert.

## Tasks / Subtasks

- [x] **Tâche 1 — Composant de synthèse `SuiviReponses`** (AC: 2, 3)
  - [x] `SuiviReponses.tsx` : `total === 0` → rien ; `repondu === 0` → message rassurant (🕊️ + texte) ; sinon « X sur Y ont répondu » + barre de progression `role=progressbar` (doublée du texte chiffré, NFR8). Typé via `inferRouterOutputs`.
- [x] **Tâche 2 — Intégration dans le détail du repas** (AC: 1, 2, 3)
  - [x] `<SuiviReponses participants={repas.participants} />` inséré au-dessus de la section « Participants ». Aucune nouvelle requête (réutilise `repasDetail`).
- [x] **Tâche 3 — Tests** (AC: 2, 3, 5)
  - [x] `SuiviReponses.test.tsx` : rien si 0 participant ; rassurant si 0 réponse ; « 1 sur 3 » + `aria-valuenow` sinon.
- [x] **Tâche 4 — Validations** (AC: 5)
  - [x] `npm run test` → 61/61 ✅ · `lint` ✅ · `typecheck` ✅ · `SKIP_ENV_VALIDATION=1 build` ✅.

## Dev Notes

### ⚠️ Cadrage (lire avant de coder)

1. **Story essentiellement présentationnelle.** Les données existent déjà : le modèle `Participant.statut` (`EN_ATTENTE | REPONDU`) et `repasDetail` (story 2.2) qui renvoie les participants. **Aucun changement de schéma, aucune nouvelle procédure tRPC.**
2. **Le passage au statut `REPONDU` n'est PAS implémenté ici.** Il est déclenché côté **participant** quand il valide ses restrictions → **story 3.3** (Epic 3). En V1 actuelle, tous les participants restent `EN_ATTENTE` tant que l'Epic 3 n'existe pas : la synthèse affichera donc « 0 sur Y » (état rassurant). C'est **attendu** — ne pas inventer de mutation pour forcer `REPONDU` ici.
3. **Ne pas dupliquer le badge par participant** (déjà fait en 2.2 dans `ParticipantsListe`). Cette story ajoute la **synthèse globale**, pas un second affichage par ligne.
4. **NFR8** : la progression ne doit pas reposer sur la seule couleur — toujours un libellé chiffré (« X sur Y ») + icône/texte.

### État réel du projet (vérifié — acquis 2.2/2.3)
- **`repasDetail`** (`organisateur.ts`) renvoie `repas` avec `participants` (chaque participant a `statut`, `prenom`, `email`, `accessToken`). **Réutiliser** — aucune requête à ajouter.
- **`ParticipantsListe.tsx`** affiche déjà le badge `EN_ATTENTE`/`REPONDU` (icône + texte) — conserver tel quel.
- **Page `/repas/[id]`** (story 2.2) : RSC qui charge `repasDetail` et rend `AjouterParticipantForm` + `ParticipantsListe`. Y insérer la synthèse.
- **Composants UI** : `Banner` (info) pour l'état rassurant si pertinent, ou un simple bloc texte. Tokens Cocon (`safe`, `ink-soft`, `surface-muted`). Pas de couleur seule.
- **Type** : `inferRouterOutputs<AppRouter>["organisateur"]["repasDetail"]["participants"]` (comme `ParticipantsListe`).
- **Tests** : RTL/jsdom pour le composant présentational (pas de tRPC ⇒ pas de mock client nécessaire).

### Accessibilité / UX
- Synthèse lisible, chiffrée. Si barre de progression : `role="progressbar"` avec `aria-valuenow/min/max`, **doublée d'un texte** « X sur Y ».
- État « aucune réponse » : chaleureux et déculpabilisant (Voice & Tone EXPERIENCE.md), jamais un vide nu.

### Périmètre — hors de cette story
- **Déclenchement du passage `REPONDU`** (le participant valide) → **story 3.3** (Epic 3).
- **Génération des recettes** quand « assez » de réponses → Epic 4 (la synthèse aide l'organisateur à décider, mais ne déclenche rien ici).
- **Relances / notifications** des non-répondants → non requis par l'AC.
- **Édition/suppression de participants** → hors périmètre.

### Testing standards
- **Vitest + RTL/jsdom**, co-localisé. Couvrir les 3 cas : 0 participant (rien), participants sans réponse (message rassurant), réponses partielles/complètes (« X sur Y »).

### Definition of Done manuelle (utilisateur, hors agent)
1. DB up. Ouvrir un repas avec des participants → vérifier la synthèse « 0 sur N » + le message rassurant.
2. (Quand l'Epic 3 sera là : un participant valide ses restrictions → la synthèse passe à « 1 sur N ».)

### Project Structure Notes
- Nouveau : `src/components/organisateur/SuiviReponses.tsx` (+ test).
- Modifié : `src/app/(organisateur)/repas/[id]/page.tsx` (insertion de la synthèse).
- Aucune nouvelle dépendance, aucune migration, aucun changement de router.

### References
- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.4] (énoncé + AC, état rassurant)
- [Source: _bmad-output/planning-artifacts/architecture.md#Data Architecture] (`Participant.statut`)
- [Source: _bmad-output/planning-artifacts/ux-designs/ux-CookWho-2026-06-19/EXPERIENCE.md#State Patterns] (états « en attente de réponses », Voice & Tone)
- [Source: _bmad-output/implementation-artifacts/2-2-ajouter-des-participants.md] (`repasDetail`, `ParticipantsListe`, badge de statut)
- [Source: _bmad-output/implementation-artifacts/2-3-generer-diffuser-les-invitations.md] (détail du repas, intégration UI)

## Dev Agent Record

### Agent Model Used

claude-opus-4-8 (bmad-dev-story)

### Debug Log References

- `npm run test` → **61/61** ✅ (+3 : SuiviReponses) · `lint` ✅ · `typecheck` ✅ · `build` ✅.
- Story présentationnelle : aucune nouvelle requête/migration ; réutilise `repasDetail` (statuts déjà renvoyés).

### Completion Notes List

- ✅ **Synthèse des réponses** sur `/repas/[id]` : « X sur Y ont répondu » + barre de progression accessible (`role=progressbar` + texte chiffré, NFR8).
- ✅ **État rassurant** « Aucune réponse pour l'instant — pas d'inquiétude » quand des participants existent sans réponse.
- ✅ Badge par participant (2.2) conservé ; pas de doublon.
- **Rappel** : le passage au statut `REPONDU` sera déclenché par la **story 3.3** (le participant valide ses restrictions) ; ici la vue reflète le statut réel (aujourd'hui tous `EN_ATTENTE` tant que l'Epic 3 n'existe pas).

### File List

- `src/components/organisateur/SuiviReponses.tsx` + `SuiviReponses.test.tsx` (NOUVEAUX — synthèse des réponses)
- `src/app/(organisateur)/repas/[id]/page.tsx` (MODIFIÉ — insertion de la synthèse)

### Review Findings (revue complète, 2026-06-25)

> ✅ Revue **complète** (3 couches). Tous les AC satisfaits.

- [x] [Review][Patch] Pourcentage de progression pouvait afficher 100 % prématurément (arrondi, ex. 199/200) — `Math.floor` + 100 % seulement si `repondu === total`. [src/components/organisateur/SuiviReponses.tsx]

### Change Log

- 2026-06-22 : Story 2.4 implémentée — synthèse du suivi des réponses (compteur + barre + état rassurant) sur le détail du repas. Tests 61/61, lint/typecheck/build verts. Statut → review.
- 2026-06-25 : Revue complète — correctif d'arrondi du pourcentage. Tous AC OK. Statut → done.
