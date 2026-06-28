---
baseline_commit: c48dfa0a7f03a2c7ebb1cbaf4188adbe1f4d45d8
---

# Story 4.7 : Génération forcée (réponses partielles)

As an organisateur,
I want générer avant que tous aient répondu,
so that je ne suis pas bloqué par un retardataire. (FR12)

Status: review

## Acceptance Criteria

1. **Given** des participants **n'ayant pas répondu** (statut `EN_ATTENTE`) et **aucun forçage**, **When** j'appelle la génération, **Then** elle **ne génère pas** et renvoie un état d'attente discriminé `{ statut: "ATTENTE_REPONSES"; nonCouverts: string[] }` listant les **prénoms** des non-répondants.
2. **Given** des participants n'ayant pas répondu, **When** je **force** la génération (`forcer: true`), **Then** elle s'exécute en **n'utilisant QUE** les restrictions des participants `REPONDU`, et renvoie `{ statut: "GENERE"; force: true; nonCouverts: string[]; resolution }` où `nonCouverts` **nomme les participants non couverts**.
3. **Given** que **tous** les participants ont répondu (ou zéro participant), **When** j'appelle la génération (forcé ou non), **Then** elle s'exécute normalement et renvoie `{ statut: "GENERE"; force: false; nonCouverts: []; resolution }`.
4. **Given** la sécurité, **When** la génération est forcée, **Then** le `resolution` reste produit par le pipeline inchangé (detect → mur → resoudre) : **aucune** restriction de non-répondant n'est devinée/utilisée, et **aucune** recette violant le mur des répondants n'est proposée. La génération forcée n'affaiblit **jamais** le mur.
5. **Given** la performance, **When** l'état est `ATTENTE_REPONSES`, **Then** la source/cache **n'est PAS appelée** (court-circuit avant `recupererRecettes`).
6. **Given** NFR5/NFR4, **When** la procédure tRPC `genererRecettes` est appelée, **Then** elle reste dans `organisateurRouter` (protégée), `organisateurId` vient de la session, et `forcer` est un booléen d'entrée optionnel (défaut `false`). Les **prénoms** ne sont pas des données de santé → leur exposition à l'organisateur est légitime (NFR6).
7. **Given** la compatibilité, **When** je change le type de retour de `genererPourRepas` (de `ResultatResolution` vers `ResultatGeneration`), **Then** je mets à jour la procédure et **tous** les tests concernés (`generation.test.ts`, `organisateur.test.ts`) ; `npm run test`, `lint`, `typecheck`, `SKIP_ENV_VALIDATION=1 build` restent verts.

## Tasks / Subtasks

- [x] **Tâche 1 — Type `ResultatGeneration` + `nonCouverts`** (AC: 1, 2, 3)
  - [x] Dans `src/server/generation.ts`, ajouter `prenom: string` à `ParticipantRow` (déjà présent au runtime via le `findFirst` ; il manque juste au type structurel).
  - [x] Définir et exporter :
    ```ts
    export type ResultatGeneration =
      | { statut: "ATTENTE_REPONSES"; nonCouverts: string[] }
      | { statut: "GENERE"; force: boolean; nonCouverts: string[]; resolution: ResultatResolution };
    ```
  - [x] `nonCouverts` = prénoms des participants `statut === "EN_ATTENTE"` (ordre du tableau participants, déterministe).

- [x] **Tâche 2 — Logique de forçage dans `genererPourRepas`** (AC: 1, 2, 3, 4, 5)
  - [x] Ajouter `forcer?: boolean` à `OptionsGeneration` (défaut `false`).
  - [x] Après le `findFirst` (et l'`organisateurId` check `NOT_FOUND` inchangé) : calculer `nonCouverts`.
  - [x] **Si `nonCouverts.length > 0 && !forcer`** → `return { statut: "ATTENTE_REPONSES", nonCouverts }` **avant** `recupererRecettes` (court-circuit, AC5).
  - [x] Sinon : pipeline inchangé (REPONDU only → contraintes/nonAimes → recupererRecettes → detect → resoudre) puis `return { statut: "GENERE", force: nonCouverts.length > 0, nonCouverts, resolution }`.

- [x] **Tâche 3 — Procédure tRPC** (AC: 6, 7)
  - [x] Dans `src/server/api/routers/organisateur.ts`, ajouter `forcer: z.boolean().optional()` à l'input de `genererRecettes` et le passer à `genererPourRepas`. Le retour `ResultatGeneration` remonte tel quel (procédure mince, `organisateurId` de session).

- [x] **Tâche 4 — Mettre à jour les tests existants (changement de forme)** (AC: 7)
  - [x] `generation.test.ts` : adapter les assertions `res.ok`/`res.recettes` → `res.statut === "GENERE"` puis `res.resolution.ok`/`res.resolution.recettes`. Ajouter `prenom` aux participants du `dbMock`.
  - [x] `organisateur.test.ts` : adapter les 2 tests `genererRecettes` à la nouvelle forme.

- [x] **Tâche 5 — Nouveaux tests (forçage)** (AC: 1, 2, 3, 4, 5)
  - [x] EN_ATTENTE + non forcé → `ATTENTE_REPONSES`, `nonCouverts` contient les prénoms, et **la source n'est pas appelée** (`chercher` mock non appelé — AC5).
  - [x] EN_ATTENTE + `forcer: true` → `GENERE`, `force: true`, `nonCouverts` nomme le(s) retardataire(s), et une recette dangereuse **pour un REPONDU** reste exclue (le mur tient — AC4).
  - [x] Tous REPONDU → `GENERE`, `force: false`, `nonCouverts: []`.
  - [x] (Router) `genererRecettes({ forcer: true })` avec un EN_ATTENTE → `GENERE`/`force: true`.

- [x] **Tâche 6 — Validations** (AC: 7)
  - [x] `npm run test`, `lint`, `typecheck`, `SKIP_ENV_VALIDATION=1 build` → tout vert.

## Dev Notes

### ⚠️ Pièges critiques (lire avant de coder)

1. **Changement de contrat de `genererPourRepas` (retour).** Il renvoyait `ResultatResolution` ; il renverra `ResultatGeneration` (enveloppe avec `statut`/`force`/`nonCouverts`/`resolution`). **Tous** les appelants/tests doivent suivre : `generation.test.ts` (6 tests) et `organisateur.test.ts` (2 tests `genererRecettes`). C'est le gros du travail — pas la logique, mais la mise à jour des assertions. Ne marquer la tâche faite que quand tout est vert.

2. **La génération forcée n'affaiblit JAMAIS le mur (AC4).** On ne devine pas les restrictions des absents : on continue d'utiliser **uniquement** les `REPONDU`. Le `resolution` passe par le même pipeline `detect → mur → resoudre`. Le « risque » des non-couverts est porté par l'**avertissement** (`nonCouverts`), pas par un assouplissement du filtre. Garder l'ordre exact.

3. **Court-circuit avant la source (AC5).** L'état `ATTENTE_REPONSES` doit sortir **avant** `recupererRecettes` (pas d'appel réseau/cache inutile). Le test l'asserte via `chercher` (mock) non appelé.

4. **`prenom` est déjà au runtime.** Le `findFirst` fait `include: { participants: { include: { restrictions: true } } }`, donc Prisma renvoie tous les **scalaires** du participant (dont `prenom`). Il suffit d'ajouter `prenom: string` au type `ParticipantRow` — **pas** besoin de toucher au `include`. Les mocks de test doivent fournir `prenom`.

5. **`forcer` par défaut `false`.** Sans forçage et avec des manquants → on **n'appelle pas** la génération (gate). C'est volontaire : ne jamais produire un menu silencieusement incomplet (l'UI « en attente de réponses », UX-DR4, gère la confirmation). Tous répondu → `force: false`, `nonCouverts: []`, quel que soit `forcer`.

6. **Périmètre = serveur uniquement.** `/core` (`resoudre`, mur, curseur) **inchangé**. Pas d'UI (Epic 5 affichera l'avertissement et le bouton « forcer »). Pas de migration. NFR5/NFR4 inchangés.

### État réel du projet (vérifié — acquis 4.4b)

- **`genererPourRepas(db, source, opts)`** (`src/server/generation.ts`) : `findFirst` (ownership → `NOT_FOUND`), restrictions **REPONDU only** → `construireContraintes` + `nonAimes` → `recupererRecettes` → `detect` par recette → `resoudre`. Renvoie aujourd'hui `ResultatResolution`. **C'est ce retour que 4.7 enveloppe.**
- `ParticipantRow = { statut: "EN_ATTENTE" | "REPONDU"; restrictions }` — ajouter `prenom`.
- **Procédure** `organisateur.genererRecettes` : `protectedProcedure`, input `{ repasId, exclure?: string[] (.max 200) }`, `organisateurId: ctx.session.user.id`, cast `ctx.db as unknown as DbGeneration`. Ajouter `forcer`.
- **Tests serveur** : `generation.test.ts` (`dbMock` renvoie `{ participants }` ; `sourceFactice` avec `chercher: vi.fn`), `organisateur.test.ts` (mock `marmitonSource`). Les `dbMock`/participants doivent gagner `prenom`.
- `resoudre` renvoie maintenant `{ ok:true; mode } | { ok:false; raison:"PAS_ASSEZ"; compatibles; contraintesBloquantes }` (4.5/4.6) — `resolution` porte tout ça inchangé.
- Règle ESLint, Vitest. `genererPourRepas` testable sans réseau/DB.

### Périmètre — hors de cette story

- **Affichage** de l'avertissement « non couverts » + bouton « générer quand même » → **Epic 5** (UX-DR4/UX-DR5). 4.7 fournit la donnée (`nonCouverts`, `statut`, `force`).
- **Régimes alimentaires** → story **4.3b** (clôt l'Epic 4).
- Toute relance/notification des retardataires → hors périmètre (Epic 2 gère la diffusion).

### Décisions tranchées

- **Gate explicite** : sans forçage + manquants → `ATTENTE_REPONSES` (on ne génère pas), conforme à « When je **force** la génération » et à l'état UX « en attente de réponses ». Plutôt qu'une génération silencieuse toujours faite.
- **`nonCouverts` = prénoms** des `EN_ATTENTE` (déterministe). Pas de données de santé exposées.
- **Enveloppe `ResultatGeneration`** plutôt qu'un champ ajouté à `ResultatResolution` : sépare proprement « état de génération » (serveur) et « résultat de résolution » (/core).

### Testing standards

- **Vitest**, `generation.test.ts` en `@vitest-environment node`, 100 % hors-ligne (db mocké, source factice, `marmitonSource` mocké côté router).
- Couvrir : gate `ATTENTE_REPONSES` (+ source non appelée), forçage (`force:true`, `nonCouverts` nommés, mur tenu), tous-répondu (`force:false`, `nonCouverts:[]`).
- Non-régression : NOT_FOUND, REPONDU-only, exclusion allergène, régénérer, incertitude — adaptés à la nouvelle enveloppe.

### Definition of Done manuelle (utilisateur, hors agent)

1. `npm run test` vert (gate + forçage + non-régression).
2. `npm run lint` vert (frontière serveur, NFR5 intacte).
3. (Optionnel) Appeler `genererRecettes` avec un repas à réponses partielles : sans `forcer` → état d'attente ; `forcer: true` → menu + prénoms non couverts.

### Project Structure Notes

- **Modifiés** : `src/server/generation.ts` (`ParticipantRow.prenom`, `ResultatGeneration`, `forcer`, gate), `src/server/api/routers/organisateur.ts` (input `forcer`), `src/server/generation.test.ts` + `src/server/api/routers/organisateur.test.ts` (forme + nouveaux tests).
- **Inchangés** : tout `/core`, le cache/source, le schéma Prisma.
- **Aucune** migration, **aucune** dépendance, **aucun** nouvel I/O.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 4.7] (forcer → REPONDU only + avertir les non couverts ; FR12)
- [Source: _bmad-output/planning-artifacts/epics.md#UX-DR4] (état « en attente de réponses » distinct ; UX-DR5 microcopy génération forcée)
- [Source: _bmad-output/planning-artifacts/architecture.md#NFR5] (frontière étanche : génération dans organisateurRouter)
- [Source: _bmad-output/implementation-artifacts/4-4b-generation-serveur.md] (`genererPourRepas`, procédure `genererRecettes`, mocks de test)
- [Source: src/server/generation.ts] (orchestrateur — point d'enveloppe)

## Dev Agent Record

### Agent Model Used

claude-opus-4-8 (bmad-dev-story)

### Debug Log References

- Suite complète : **229/229** ✅ (226 → 229 ; 8 tests serveur adaptés à la nouvelle enveloppe + 3 nouveaux : ATTENTE court-circuit, forçage nomme + mur tient, router forcer/ATTENTE). `lint` ✅, `typecheck` ✅, `SKIP_ENV_VALIDATION=1 build` ✅.
- `/core` **non touché**. Changement confiné au serveur (`generation.ts` + procédure + leurs tests).
- Tests 100 % hors-ligne (db mocké, source factice, `marmitonSource` mocké côté router).

### Completion Notes List

- ✅ **`ResultatGeneration`** (enveloppe serveur) : `{ statut: "ATTENTE_REPONSES"; nonCouverts }` | `{ statut: "GENERE"; force; nonCouverts; resolution }`. `genererPourRepas` renvoie désormais ce type (au lieu de `ResultatResolution`).
- ✅ **Gate de forçage** : des participants `EN_ATTENTE` + `forcer` absent → `ATTENTE_REPONSES` **avant** `recupererRecettes` (aucun appel source/cache — testé). `forcer: true` ou tous répondu → `GENERE`.
- ✅ **`nonCouverts` = prénoms des `EN_ATTENTE`** (déterministe). `force = nonCouverts.length > 0`.
- ✅ **Le mur n'est jamais affaibli** (AC4) : génération forcée = REPONDU only, pipeline `detect → mur → resoudre` inchangé ; testé qu'une recette dangereuse pour un REPONDU reste exclue même en forçant.
- ✅ **Procédure tRPC** `genererRecettes` : input `forcer?: boolean`, reste protégée, `organisateurId` de session, mince (délègue). Retour `ResultatGeneration` remonté tel quel.
- ✅ **`prenom`** ajouté au type `ParticipantRow` (déjà présent au runtime via le `findFirst` ; `include` inchangé).
- **Hors périmètre** : affichage de l'avertissement + bouton « générer quand même » → Epic 5 ; régimes alimentaires → 4.3b.
- **DoD utilisateur** : `npm run test`/`lint` verts ; appeler `genererRecettes` sur un repas à réponses partielles → sans `forcer` = état d'attente, `forcer: true` = menu + prénoms non couverts.

### File List

- `src/server/generation.ts` (MODIFIÉ — `ResultatGeneration`, `forcer`, gate, `prenom`)
- `src/server/api/routers/organisateur.ts` (MODIFIÉ — input `forcer`)
- `src/server/generation.test.ts` (RÉÉCRIT — enveloppe + tests forçage)
- `src/server/api/routers/organisateur.test.ts` (MODIFIÉ — enveloppe + tests forcer/ATTENTE)

### Change Log

- 2026-06-28 : Story 4.7 implémentée — génération forcée. `genererPourRepas` enveloppe le résultat dans `ResultatGeneration` (gate `ATTENTE_REPONSES` court-circuitant la source ; `GENERE` avec `force`/`nonCouverts`). Procédure `genererRecettes` gagne `forcer`. Le mur reste garanti (REPONDU only), aucune restriction d'absent devinée. 229/229, lint/typecheck/build verts. Statut → review. **L'organisateur génère malgré les retardataires, qui sont nommés (FR12). Epic 4 fonctionnellement complet (hors 4.3b).**
