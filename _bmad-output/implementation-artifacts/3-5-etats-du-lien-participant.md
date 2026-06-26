---
baseline_commit: 7007a309569de4bcd9786a5c21917afabaa8c86b
---

# Story 3.5 : États du lien participant (expiré, invalide, repas clos)

Status: done

## Story

As a participant,
I want un message clair si mon lien ne fonctionne pas,
so that je ne tombe pas sur une page cassée et garde confiance. (NFR5, NFR8)

## Acceptance Criteria

1. **Given** un lien pointant vers un **repas expiré** (`expiresAt` dépassé) mais pas encore purgé, **When** je l'ouvre, **Then** je vois un **message habillé** (ton Cocon, via `LienInvalide`), **jamais** un 404 brut — `monAcces` ne renvoie pas le repas.
2. **Given** un **token invalide / inconnu** ou un **repas purgé** (supprimé par le cron), **When** je l'ouvre, **Then** je vois **le même message générique** (aucune distinction observable → pas de fuite sur l'existence du token).
3. **Given** un repas qui **expire ou est purgé pendant ma session** (entre l'ouverture et la validation), **When** je clique **Valider**, **Then** `enregistrerRestrictions` **rejette** (NOT_FOUND) et l'assistant affiche un **message terminal** « ce lien n'est plus valable » **sans boucle de retry**.
4. **Given** une **erreur réseau transitoire** (pas un NOT_FOUND), **When** la validation échoue, **Then** je vois un message **« réessaie »** (retry possible) — distinct du cas terminal (AC3).
5. **Given** la confidentialité (NFR5), **When** un message d'erreur s'affiche, **Then** il **n'expose aucune donnée d'autrui**, ni le menu, ni l'existence du token ; il **m'oriente** (« recontacte la personne qui organise »).
6. **Given** un mobile, **When** un état d'erreur s'affiche, **Then** il est lisible et utilisable (mobile-first), au lecteur d'écran (rôle `alert`/`status` adéquat).
7. **Given** les validations CI, **When** je lance `npm run test`, `lint`, `typecheck`, `SKIP_ENV_VALIDATION=1 npm run build`, **Then** tout reste vert ; les cas **expiré (lecture + écriture)** et **NOT_FOUND terminal côté assistant** sont testés (Prisma mocké).

## Tasks / Subtasks

- [x] **Tâche 1 — Filtrer `expiresAt` à la LECTURE (`monAcces`)** (AC: 1, 2)
  - [x] Dans `src/server/api/routers/participant.ts`, remplacer `findUnique({ where: { accessToken } })` par **`findFirst`** avec `where: { accessToken: input.token, repas: { expiresAt: { gt: new Date() } } }` (un `findUnique` ne peut pas filtrer sur une relation).
  - [x] Comportement inchangé sinon : `NOT_FOUND` si rien → la page rend déjà `LienInvalide` (story 3.1). Un repas expiré devient donc indistinguable d'un token inconnu (pas de fuite).
  - [x] Conserver le `select` étanche (prenom, statut, repas, restrictions — NFR5).

- [x] **Tâche 2 — Filtrer `expiresAt` à l'ÉCRITURE (`enregistrerRestrictions`)** (AC: 3)
  - [x] Remplacer le `findUnique({ where: { accessToken }, select: { id } })` de résolution par **`findFirst`** avec `where: { accessToken: input.token, repas: { expiresAt: { gt: new Date() } } }, select: { id: true }`.
  - [x] `NOT_FOUND` si rien (repas expiré/purgé) → la transaction n'est pas lancée. **Résout le finding High déféré (D1)** : plus aucune écriture de données santé sur un repas logiquement expiré.

- [x] **Tâche 3 — Gestion d'erreur de l'assistant (terminal vs transitoire)** (AC: 3, 4)
  - [x] Dans `AssistantRestrictions.tsx`, ajouter `onError` à la mutation : si `error.data?.code === "NOT_FOUND"` → `setVue("lienInvalide")` (état terminal). Sinon, ne rien faire (le `Banner` `isError` « réessaie » existant gère le transitoire).
  - [x] Nouvelle vue `"lienInvalide"` : rend `<LienInvalide />` (message générique, ton Cocon, oriente vers l'organisateur). Pas de bouton « Valider » qui rejouerait l'échec.
  - [x] **Résout le finding Med déféré (D2)** : plus de boucle de retry infinie sur un repas purgé en cours de session.

- [x] **Tâche 4 — Tests** (AC: 1, 2, 3, 4, 7)
  - [x] `participant.test.ts` :
    - adapter les mocks existants `findUnique` → **`findFirst`** (monAcces et enregistrerRestrictions).
    - `monAcces` : asserter que le `where` inclut `repas: { expiresAt: { gt: <Date> } }` ; repas expiré (mock `findFirst` → `null`) → `NOT_FOUND`.
    - `enregistrerRestrictions` : repas expiré (`findFirst` → `null`) → `NOT_FOUND`, **transaction non appelée**.
  - [x] `AssistantRestrictions.test.tsx` : simuler `onError({ data: { code: "NOT_FOUND" } })` → la vue passe à l'état « lien invalide » (message générique, plus de bouton Valider) ; simuler une erreur sans `data.code` → reste sur le stepper (cas transitoire, pas de bascule).

- [x] **Tâche 5 — Validations** (AC: 7)
  - [x] `npm run test`, `lint`, `typecheck`, `SKIP_ENV_VALIDATION=1 npm run build` → tout vert.

### Review Findings

> Revue de code adversariale du 2026-06-26 (3 couches), **périmètre combiné Epic 3 (stories 3.2b → 3.5)**, diff depuis `5abb208`. Verdict : backbone propre — **tous les ACs satisfaits**, NFR4/5/6 vérifiés, auth/isolation/atomicité solides, findings High/Med déférés (D1/D2) confirmés résolus. Les seuls vrais points portent sur **le seuil de tolérance** (unique donnée stockée). 2 patches · 5 reports · 6 écartés.

- [x] [Review][Patch] **[Med]** Off-by-one : Zod `seuilTolerance.max(5)` mais `TOLERANCE_LABELS` n'a que les index 0-4 → une valeur 5 (payload forgé/legacy) stocke un seuil sans libellé (récap vide + curseur désynchro). Borner sur `TOLERANCE_LABELS.length - 1`. [src/server/api/routers/participant.ts, src/lib/restrictions.ts] — ✅ `SEUIL_TOLERANCE_MAX = TOLERANCE_LABELS.length - 1`
- [x] [Review][Patch] **[Low]** Défaut neutre incohérent : serveur `?? 3` (« Plutôt souple ») vs client `SEUIL_TOLERANCE_DEFAUT = 2` (« Équilibré », le neutre annoncé). Aligner le défaut serveur sur `SEUIL_TOLERANCE_DEFAUT` + corriger le commentaire « neutre » + le test qui asserte 3. [src/server/api/routers/participant.ts] — ✅ `?? SEUIL_TOLERANCE_DEFAUT` + test mis à jour
- [x] [Review][Defer] **[Med→3.2b polish]** `onError` ne gère que `NOT_FOUND` ; un `BAD_REQUEST` (dépassement `.max(50)` ou Zod refine) tombe dans le Banner « réessaie » → boucle de retry trompeuse sur une erreur déterministe. Distinguer terminal-validation vs transitoire. [AssistantRestrictions.tsx]
- [x] [Review][Defer] **[Low→3.2b polish]** Pas de plafond client sur le nombre d'items libres (peut dépasser `.max(50)` serveur) ni de `maxLength=200` sur la saisie libre → rejet seulement au submit (couplé au report précédent). [EtapeAllergenes.tsx, EtapeNonAimes.tsx]
- [x] [Review][Defer] **[Low→3.2b polish]** Ajout libre d'une valeur égale à une option standard (ex. « Arachides ») → puce `aria-pressed` sans chip supprimable visible (retrait non évident). Rejeter/basculer si match standard (insensible à la casse). [EtapeAllergenes.tsx]
- [x] [Review][Defer] **[Low→3.2b polish]** Dédup sensible à la casse : « Champignons » et « champignons » persistent en 2 lignes. Normaliser (`toLocaleLowerCase("fr")`) dans le `Set` de dédup et les `includes`. [AssistantRestrictions.tsx]
- [x] [Review][Defer] **[Low→3.4 polish]** Réouverture d'un participant `REPONDU` **sans** restriction : « On a déjà tes préférences » + récap vide « Tu manges de tout » lit un peu bizarre. Brancher la microcopy de la vue retour sur `rienSaisi`. [AssistantRestrictions.tsx]

## Dev Notes

### ⚠️ Pièges critiques (lire avant de coder)

1. **`findUnique` ne filtre pas sur une relation.** Pour exiger `repas.expiresAt > now`, il faut **`findFirst`** (`accessToken` reste unique → au plus une ligne). Ne pas tenter d'ajouter `expiresAt` dans un `where` de `findUnique`.

2. **Pas de fuite (NFR5, AC2).** Repas expiré, token inconnu, repas purgé → **même** `NOT_FOUND` → **même** écran `LienInvalide`. Ne **pas** créer un message distinct « expiré » côté lecture qui révélerait que le token a existé. Le message générique « ce lien n'est plus valable, recontacte l'organisateur » couvre tous les cas.

3. **Terminal vs transitoire (AC3/AC4) — finding déféré D2.** `onError` ne bascule en état terminal **que** si `error.data?.code === "NOT_FOUND"` (lien devenu invalide). Une erreur réseau (fetch échoué) n'a **pas** de `data.code` → on reste sur le stepper et le `Banner` « réessaie » s'affiche (retry légitime). Ne pas basculer en terminal sur **toute** erreur (sinon un hoquet réseau bloquerait à tort).

4. **Cohérence lecture/écriture — finding déféré D1 (High).** Les **deux** chemins (`monAcces` ET `enregistrerRestrictions`) doivent filtrer `expiresAt`. Filtrer seulement la lecture laisserait une fenêtre d'écriture sur un repas expiré. Faire les deux dans cette story.

5. **`new Date()` côté serveur, par appel.** Calculer `new Date()` au moment de la requête (pas une constante de module). Cohérent avec `purgerRepasExpires(db, maintenant = new Date())` (story 2.5).

6. **Pas de notion de « clos » explicite dans le modèle.** Le PRD parle de « repas purgé/clos » : en V1 il n'y a **pas** de flag « clos » distinct — un repas est « clos » de fait quand il est **expiré** (puis purgé par le cron). L'`expiresAt` est donc le mécanisme unique. Ne pas inventer de champ `statut` sur `Repas`.

7. **Le test de sécurité du `select` reste vert.** Passer `findUnique`→`findFirst` ne change pas le `select`. Le test `monAcces` qui asserte le `select` (pas de recette) doit rester valable — adapter seulement le mock de méthode (`findFirst`) et l'assertion du `where`.

### État réel du projet (vérifié — acquis 3.1 → 3.4)

- **`monAcces`** (`participant.ts`) : `findUnique({ where: { accessToken }, select: { prenom, statut, repas {…}, restrictions {…} } })`, `NOT_FOUND` sinon. **À passer en `findFirst` + filtre `expiresAt`.**
- **`enregistrerRestrictions`** : résout `findUnique({ where: { accessToken }, select: { id } })` → `NOT_FOUND` sinon, puis `$transaction`. **À passer en `findFirst` + filtre `expiresAt`.** Le reste (deleteMany/createMany/update REPONDU, `.max(50)`) inchangé.
- **`Repas.expiresAt`** : `DateTime`, fixé à `date + 30 j` (`computeExpiresAt`, story 2.1) ; purge cron quotidienne `deleteMany({ where: { expiresAt: { lt: now } } })` (story 2.5).
- **`page.tsx`** (`/p/[token]`) : `try { monAcces } catch NOT_FOUND → <LienInvalide/>` ; sinon `<AssistantRestrictions>`. **Inchangé** — le filtre `expiresAt` réutilise ce chemin.
- **`LienInvalide.tsx`** : message générique « Lien non valide » + « recontacte la personne qui organise » (rôle `status`/`alert`). **Réutilisé** dans la vue terminale de l'assistant.
- **`AssistantRestrictions.tsx`** : mutation `useMutation({ onSuccess })` ; `enregistrer.isError` → `Banner` danger « réessaie ». **À étendre** : `onError` (NOT_FOUND→terminal), vue `"lienInvalide"`.
- **Pattern test** : mock `~/server/auth`/`~/server/db`/`~/env` ; `appRouter.createCaller`. Pour l'assistant, mock `~/trpc/react` en capturant `onSuccess` **et** `onError`.

### Périmètre — hors de cette story

- **Aucune** nouvelle UI au-delà de la réutilisation de `LienInvalide`. Pas de message « expiré » distinct (anti-fuite).
- **Aucun** changement de schéma, pas de flag « clos », pas de migration.
- Génération de recettes, etc. → Epic 4+.

### Findings de revue résolus ici

- **[High → 3.5] (D1)** Repas expiré-mais-pas-purgé acceptait lecture **et** écriture → filtre `expiresAt` sur `monAcces` **et** `enregistrerRestrictions`.
- **[Med → 3.5] (D2)** Boucle de retry infinie si le repas est purgé en cours de session → `onError` NOT_FOUND bascule en état terminal (pas de retry). Voir `deferred-work.md`.

### Accessibilité / UX (NFR7, NFR8)

- `LienInvalide` : message chaleureux mais clair, oriente vers l'organisateur, icône + texte (pas la couleur seule). Mobile-first.
- État terminal de l'assistant : pas de bouton qui rejouerait l'échec ; rôle ARIA d'alerte porté par le composant.

### Testing standards

- **Vitest** : router en `@vitest-environment node` (Prisma mocké via `findFirst`/`$transaction`), assistant en RTL/jsdom.
- Asserter le **filtre `expiresAt`** dans le `where` de `monAcces` et `enregistrerRestrictions`.
- Asserter que `$transaction` **n'est pas** appelée quand le repas est expiré.
- Assistant : `onError` NOT_FOUND → bascule terminale ; erreur sans `data.code` → pas de bascule.

### Definition of Done manuelle (utilisateur, hors agent)

1. Mettre (en base, manuellement) `expiresAt` d'un repas dans le passé → ouvrir `/p/{token}` → message « Lien non valide » (pas de 404 brut).
2. Ouvrir `/p/nimportequoi` → même message (indistinguable).
3. (Simulation) Pendant une session ouverte, expirer le repas puis Valider → message terminal « ce lien n'est plus valable », pas de boucle.
4. Couper le réseau et Valider → message « réessaie » (transitoire), différent du cas terminal.

### Project Structure Notes

- **Modifié** : `src/server/api/routers/participant.ts` (`monAcces` + `enregistrerRestrictions` → `findFirst` + filtre `expiresAt`), `participant.test.ts`, `src/components/participant/AssistantRestrictions.tsx` (`onError` + vue terminale), `AssistantRestrictions.test.tsx`.
- **Réutilisé** : `LienInvalide.tsx` (aucune modif nécessaire ; à vérifier que le rôle ARIA convient).
- **Aucune** migration, aucune dépendance, aucun nouveau composant.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 3.5] (énoncé + AC : message habillé, pas de 404 brut, pas de fuite, oriente vers l'organisateur)
- [Source: _bmad-output/implementation-artifacts/deferred-work.md] (findings D1 High + D2 Med déférés ici depuis les revues 3.1/3.2a)
- [Source: _bmad-output/implementation-artifacts/2-5-purge-planifiee-des-repas-expires.md] (`expiresAt`, purge cron, `lt: now`)
- [Source: _bmad-output/implementation-artifacts/3-1-acces-participant-par-lien-sans-compte.md] (`LienInvalide`, page `NOT_FOUND → LienInvalide`, anti-fuite)
- [Source: _bmad-output/implementation-artifacts/3-4-modifier-ses-restrictions.md] (`monAcces` étendu, `AssistantRestrictions` vues)

## Dev Agent Record

### Agent Model Used

claude-opus-4-8 (bmad-dev-story)

### Debug Log References

- Suite complète : **116/116** ✅ (114 → 116, +2 : assistant terminal/transitoire ; tests router monAcces/enregistrer mis à jour pour `findFirst` + `expiresAt`). `lint` ✅ · `typecheck` ✅ · `SKIP_ENV_VALIDATION=1 build` ✅ (`/p/[token]` = 5.37 kB).
- Aucun échec en cours de route.

### Completion Notes List

- ✅ **Filtre `expiresAt` à la LECTURE** : `monAcces` passe de `findUnique` à `findFirst` avec `where: { accessToken, repas: { expiresAt: { gt: new Date() } } }`. Un repas expiré → `null` → `NOT_FOUND` → `LienInvalide` (page inchangée). Indistinguable d'un token inconnu (anti-fuite, NFR5).
- ✅ **Filtre `expiresAt` à l'ÉCRITURE** : `enregistrerRestrictions` résout via `findFirst` + même filtre → impossible d'écrire des données santé sur un repas expiré/purgé. **Résout le finding High déféré (D1).**
- ✅ **Assistant — terminal vs transitoire** : `onError` ajouté ; `error.data?.code === "NOT_FOUND"` → nouvelle vue `"lienInvalide"` (rend `LienInvalide`, pas de bouton Valider). Erreur sans `data.code` (réseau) → reste sur le stepper + Banner « réessaie » via `isError`. **Résout le finding Med déféré (D2).**
- ✅ **Anti-fuite** : token inconnu, repas expiré, repas purgé → même `NOT_FOUND` → même écran générique. Aucun message « expiré » distinct.
- **Aucun** changement de schéma, aucune migration, aucune notion de « clos » ajoutée (l'expiration EST le mécanisme).
- **Les 2 findings restants de `deferred-work.md` (D1, D2) sont désormais résolus** → dette de revue de l'Epic 3 purgée.
- **À faire par l'utilisateur (DoD)** : mettre `expiresAt` d'un repas dans le passé → `/p/{token}` → « Lien non valide » ; `/p/nimportequoi` → même message ; (simulation) expiration en cours de session → message terminal ; coupure réseau → « réessaie ».

### File List

- `src/server/api/routers/participant.ts` (MODIFIÉ — `monAcces` + `enregistrerRestrictions` → `findFirst` + filtre `expiresAt`)
- `src/server/api/routers/participant.test.ts` (MODIFIÉ — mocks `findFirst`, assertions `expiresAt`, cas expiré)
- `src/components/participant/AssistantRestrictions.tsx` (MODIFIÉ — `onError` NOT_FOUND → vue `lienInvalide`)
- `src/components/participant/AssistantRestrictions.test.tsx` (MODIFIÉ — terminal vs transitoire)

### Change Log

- 2026-06-26 : Story 3.5 implémentée — états du lien participant : filtre `expiresAt` à la lecture (`monAcces`) ET à l'écriture (`enregistrerRestrictions`), gestion terminal (NOT_FOUND → `LienInvalide`) vs transitoire (réseau → retry) dans l'assistant. Résout les findings déférés D1 (High) et D2 (Med). Aucun changement schéma. Tests 116/116, lint/typecheck/build verts. Statut → review. **Epic 3 fonctionnellement complet.**
- 2026-06-26 : Revue de code combinée Epic 3 (3.2b→3.5, 3 couches). Tous ACs satisfaits, NFR4/5/6 vérifiés. 2 patches appliqués sur le seuil de tolérance (source unique des constantes : borne Zod `TOLERANCE_LABELS.length-1` + défaut serveur `SEUIL_TOLERANCE_DEFAUT`). 5 reports de polish tracés (`deferred-work.md`). Tests 116/116. Statut → done. **Epic 3 terminé.**
