---
baseline_commit: 7007a309569de4bcd9786a5c21917afabaa8c86b
---

# Story 3.3 : Récapitulatif & confirmation de prise en compte

Status: done

## Story

As a participant,
I want voir ce qui a été retenu et être rassuré·e,
so that j'ai confiance que ma contrainte sera respectée. (FR7)

## Acceptance Criteria

1. **Given** mes restrictions saisies, **When** je valide, **Then** après **enregistrement effectif** (succès de la mutation), l'écran de confirmation affiche une **pastille « ✓ pris en compte »** (SafeBadge) — jamais avant le succès.
2. **Given** l'écran de confirmation, **When** il s'affiche, **Then** je vois le **récapitulatif complet** de mes sélections sous forme de chips, **groupées et distinguées par type** : régimes (`regime`, sauge), allergènes (`allergie`, rouge + icône ⚠), aliments non-aimés (`non-aime`, accent) — la distinction allergie/non-aimé est conservée (icône + libellé, jamais la couleur seule).
3. **Given** au moins un aliment non-aimé, **When** le récap s'affiche, **Then** le **seuil de tolérance** est rappelé **en clair** (libellé, ex. « Plutôt souple »), jamais un chiffre.
4. **Given** que je n'ai rien sélectionné, **When** le récap s'affiche, **Then** un message rassurant tient lieu de liste (ex. « Tu manges de tout, c'est noté ! ») — pas de liste vide ni d'écran nu.
5. **Given** l'écran de confirmation, **When** il s'affiche, **Then** je ne vois **jamais** le menu ni les recettes ni un autre participant (NFR5) ; le récap ne provient que de **mes** propres saisies.
6. **Given** l'écran de confirmation, **When** je clique « Modifier mes réponses », **Then** je reviens à l'assistant (étape 1) avec mes saisies **conservées** et modifiables (réouverture **via le lien** = story 3.4, hors périmètre).
7. **Given** un mobile, **When** j'utilise l'écran, **Then** il est pleinement utilisable (mobile-first, cibles ≥ 44px), au clavier et au lecteur d'écran (NFR7, NFR8).
8. **Given** les validations CI, **When** je lance `npm run test`, `lint`, `typecheck`, `SKIP_ENV_VALIDATION=1 npm run build`, **Then** tout reste vert ; le composant de récap est testé (incl. cas vide + distinction allergie/non-aimé).

## Tasks / Subtasks

- [x] **Tâche 1 — Composant `RecapRestrictions`** (AC: 2, 3, 4, 5)
  - [x] Créer `src/components/participant/RecapRestrictions.tsx` (`'use client'` non requis — composant de présentation pur, pas d'état/événement).
  - [x] Props : `{ donnees: DonneesRestrictions }` (réutilise le type exporté par `AssistantRestrictions`).
  - [x] Rendu groupé : section « Régimes » → `Chip variant="regime"` ; « Allergies » → `Chip variant="allergie" icon="⚠"` ; « Aliments non-aimés » → `Chip variant="non-aime"`. N'afficher une section que si elle a au moins un élément.
  - [x] Si ≥1 non-aimé : rappeler le **libellé** du seuil via `TOLERANCE_LABELS[donnees.seuilNonAimes]` (jamais le chiffre).
  - [x] Cas **tout vide** (aucun régime/allergène/non-aimé) : afficher un message rassurant unique (« Tu manges de tout, c'est noté ! »), pas de sections vides.
  - [x] En-tête « Ce qu'on a retenu » (cf. maquette `key-screens-cocon.html`).

- [x] **Tâche 2 — Enrichir la vue `confirme` de `AssistantRestrictions`** (AC: 1, 5, 6)
  - [x] Dans `AssistantRestrictions.tsx`, vue `confirme` : conserver le SafeBadge « C'est bien noté » + le titre « Merci {prenom} ! », **ajouter** `<RecapRestrictions donnees={donnees} />`.
  - [x] Ajouter un bouton **« Modifier mes réponses »** (`variant="secondary"`) qui repasse `vue="stepper"`, `etape=0` (l'état `donnees` est déjà conservé). Déplacer le focus sur le titre d'étape (réutiliser `focusTitre`).
  - [x] Ne **pas** modifier le router ni le schéma : le récap s'appuie sur l'état local `donnees` (déjà soumis avec succès). Frontière étanche conservée (NFR5).

- [x] **Tâche 3 — Tests** (AC: 2, 3, 4, 8)
  - [x] `RecapRestrictions.test.tsx` : récap non vide (régime + allergène ⚠ + non-aimé + libellé de seuil), distinction allergie/non-aimé (⚠ présent sur l'allergène, absent du non-aimé), **cas vide** → message « Tu manges de tout ».
  - [x] Étendre `AssistantRestrictions.test.tsx` : après un parcours avec sélections + `onSuccess`, l'écran de confirmation affiche le SafeBadge **et** le récap (un chip attendu) ; cliquer « Modifier mes réponses » → retour à « Étape 1 sur 3 » avec la sélection conservée (le régime reste `aria-pressed`).

- [x] **Tâche 4 — Validations** (AC: 8)
  - [x] `npm run test`, `lint`, `typecheck`, `SKIP_ENV_VALIDATION=1 npm run build` → tout vert.

## Dev Notes

### ⚠️ Pièges critiques (lire avant de coder)

1. **Le récap vient de l'état local, pas de la DB.** « Après enregistrement effectif » (AC1) = dans le `onSuccess` de la mutation, on bascule sur `confirme` (déjà le cas en 3.2a/3.2b). Le récap rend `donnees` (ce qui vient d'être soumis avec succès). **Ne pas** rouvrir une lecture serveur (ce serait redondant et toucherait à la frontière) — la réouverture via lien, elle, est la story 3.4 et nécessitera d'exposer les restrictions dans `monAcces`.

2. **Frontière étanche (NFR5) — intacte.** Cette story est 100 % présentation côté participant. **Aucune** lecture de recette, **aucun** autre participant, **aucune** modif du router `participant` ni du schéma. Si tu te retrouves à éditer `participant.ts`, tu es hors périmètre.

3. **Distinction allergie/non-aimé conservée (AC2).** Le composant `Chip` porte déjà les bonnes couleurs (`allergie`=danger, `regime`=safe, `non-aime`=accent). Mettre l'icône ⚠ **uniquement** sur les allergènes (gravité). Jamais la couleur seule → libellé texte toujours présent (NFR8).

4. **« Pas de chiffre » pour le seuil (AC3).** Rappeler `TOLERANCE_LABELS[seuil]` (« Équilibré », « Souple »…), jamais l'index. Cohérent avec `ToleranceSlider` (3.2b).

5. **« Modifier mes réponses » = retour en session, PAS réouverture par lien.** Ici : un simple retour à `vue="stepper"`, `etape=0`, état `donnees` intact. La réouverture d'un lien déjà `REPONDU` (réafficher depuis la DB + accueil « On a déjà tes préférences ✓ ») est la **story 3.4** — ne pas l'implémenter ici.

6. **Re-validation après modification.** Si l'utilisateur modifie puis re-valide, `enregistrerRestrictions` refait `deleteMany`+`createMany` (sémantique « remplace », déjà en place). Rien à changer.

### État réel du projet (vérifié — acquis 3.2a + 3.2b)

- **`AssistantRestrictions.tsx`** : vues `accueil`/`stepper`/`confirme` ; `DonneesRestrictions` (exporté) = `{ regimes[], allergenes[], nonAimes[], seuilNonAimes }` ; `donnees` est un état **mutable** (`useState`) ; `enregistrer.onSuccess → setVue("confirme")` ; `focusTitre()` dispo. La vue `confirme` actuelle est sobre (SafeBadge + « Merci {prenom} ! ») → **à enrichir**.
- **`Chip`** (`~/components/ui/Chip`) : `variant` `allergie`/`regime`/`non-aime` câblés aux bons tokens ; prop `icon` optionnelle.
- **`TOLERANCE_LABELS`** (`~/lib/restrictions`) : 5 libellés (index 0-4).
- **`SafeBadge`** (`~/components/ui/SafeBadge`) : pastille « ✓ … » (défaut « pris en compte »).
- **Maquette** `_bmad-output/planning-artifacts/ux-designs/ux-CookWho-2026-06-19/mockups/key-screens-cocon.html` : écran de confirmation = SafeBadge « C'est pris en compte » + « Sami ne choisira que des plats qui te conviennent » + bloc « Ce qu'on a retenu » (chips Végétarien / ⚠ Arachides / Champignons) + bouton « Modifier mes réponses ». **Référence visuelle directe de cette story.**
- **Voix** (EXPERIENCE.md) : « ✓ C'est pris en compte. … ne choisira que des plats qui te conviennent. » L'app **ne connaît pas** le prénom de l'organisateur côté participant (`monAcces` ne le renvoie pas) → formuler **générique** (« L'organisateur… »), ne pas inventer de nom.

### Périmètre — hors de cette story

- **Réouverture du lien** déjà utilisé (réafficher les restrictions depuis la DB, accueil « On a déjà tes préférences ✓ ») → **story 3.4** (nécessitera `statut` + lecture des `Restriction` dans `monAcces`).
- **États expiré/repas clos** → **story 3.5** (inclut le filtre `expiresAt` déféré des revues 3.1/3.2a).
- **Aucune** vue/route participant n'expose les recettes (NFR5) — vrai pour tout l'Epic 3.

### Accessibilité / UX (NFR7, NFR8, UX-DR6)

- Récap mobile-first, colonne unique, chips lisibles ; bouton « Modifier » ≥ 44px (`Button` `min-h-11`).
- Allergènes : icône ⚠ **et** libellé (jamais la couleur seule).
- Au retour vers le stepper, déplacer le focus sur le titre d'étape (réutiliser `focusTitre`).
- Microcopy chaleureuse (sauf sécurité), phrases courtes.

### Testing standards

- **Vitest + RTL/jsdom**, co-localiser. Mock `~/trpc/react` comme en 3.2a/3.2b pour le test de l'assistant.
- Tester explicitement : la **distinction** allergie (⚠) vs non-aimé (pas de ⚠), le **rappel du seuil en libellé**, le **cas vide**.

### Definition of Done manuelle (utilisateur, hors agent)

1. Ouvrir `/p/{token}`, saisir un régime + une allergie + un non-aimé (régler le curseur), Valider.
2. Vérifier l'écran de confirmation : pastille « ✓ pris en compte » + « Ce qu'on a retenu » avec les bons chips (couleurs/icône ⚠) + le libellé du seuil.
3. Cliquer « Modifier mes réponses » → retour à l'étape 1, sélections conservées ; re-valider → toujours OK.
4. Cas vide : valider sans rien saisir → message « Tu manges de tout, c'est noté ! ».

### Project Structure Notes

- **Nouveau** : `src/components/participant/RecapRestrictions.tsx` (+ test).
- **Modifié** : `src/components/participant/AssistantRestrictions.tsx` (vue `confirme` enrichie + bouton « Modifier ») + son test.
- **Aucune** modif du router `participant`, du schéma Prisma, ni de migration. Aucune nouvelle dépendance.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 3.3] (énoncé + AC : récap complet, confirmation après enregistrement effectif, NFR5)
- [Source: _bmad-output/planning-artifacts/ux-designs/.../EXPERIENCE.md] (confirmation participant, Safety & Reassurance — la confiance naît du visible)
- [Source: _bmad-output/planning-artifacts/ux-designs/.../mockups/key-screens-cocon.html] (écran de confirmation Léa — référence visuelle directe)
- [Source: _bmad-output/implementation-artifacts/3-2b-assistant-restrictions-contenu.md] (`DonneesRestrictions`, `TOLERANCE_LABELS`, `Chip`, vue `confirme` à enrichir)

## Dev Agent Record

### Agent Model Used

claude-opus-4-8 (bmad-dev-story)

### Debug Log References

- Suite complète : **109/109** ✅ (103 → 109, +6 : RecapRestrictions ×5, parcours récap/modifier ×1). `lint` ✅ · `typecheck` ✅ · `SKIP_ENV_VALIDATION=1 build` ✅ (`/p/[token]` = 5 kB).
- Aucun échec en cours de route.

### Completion Notes List

- ✅ **`RecapRestrictions`** (présentation pure, pas d'état) : sections « Régimes »/« Allergies »/« Aliments non-aimés » rendues seulement si non vides ; `Chip` aux bons variants (allergène avec ⚠, non-aimé sans) ; rappel du seuil via `TOLERANCE_LABELS[seuil]` (libellé, jamais le chiffre) ; **cas vide** → « Tu manges de tout, c'est noté ! ».
- ✅ **Vue `confirme` enrichie** : SafeBadge « C'est pris en compte » + « Merci {prenom} ! » + `<RecapRestrictions>` + bouton **« Modifier mes réponses »** (`variant="secondary"`) → retour `stepper`/étape 0, état `donnees` conservé, focus replacé sur le titre d'étape.
- ✅ **Confirmation après enregistrement effectif** (AC1) : le récap n'apparaît que dans la vue `confirme`, atteinte via `onSuccess` de la mutation. Le récap vient de l'**état local** déjà soumis — **aucune** lecture serveur, **aucune** modif du router/schéma (NFR5 intact).
- ✅ **Multi-régime** affiché (N chips). Wording **générique** côté participant (« L'organisateur… ») — le prénom de l'organisateur n'est pas exposé par `monAcces`.
- **Hors périmètre (confirmé)** : réouverture du lien déjà `REPONDU` (relecture DB + accueil « On a déjà tes préférences ✓ ») → story 3.4 ; états expiré/clos → story 3.5.
- **À faire par l'utilisateur (DoD)** : ouvrir `/p/{token}`, saisir régime+allergie+non-aimé, Valider → vérifier le récap + le libellé de seuil + « Modifier » ; cas vide → message rassurant.

### File List

- `src/components/participant/RecapRestrictions.tsx` + `RecapRestrictions.test.tsx` (NOUVEAUX)
- `src/components/participant/AssistantRestrictions.tsx` (MODIFIÉ — vue `confirme` enrichie + handler `modifier`)
- `src/components/participant/AssistantRestrictions.test.tsx` (MODIFIÉ — parcours récap + modifier)

### Change Log

- 2026-06-26 : Story 3.3 implémentée — récap des sélections (chips groupés par type + rappel du seuil en clair + cas vide rassurant) dans la vue de confirmation, bouton « Modifier mes réponses » (retour en session). Aucun changement router/schéma (récap depuis l'état local, NFR5 intact). Tests 109/109, lint/typecheck/build verts. Statut → review.
