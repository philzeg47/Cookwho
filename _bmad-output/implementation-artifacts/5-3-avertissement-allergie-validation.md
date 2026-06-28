---
baseline_commit: 57699bac5dc930c9d8b06e18ffb90db8009f5407
---

# Story 5.3 : Avertissement allergie & validation

As an organisateur,
I want être averti et valider quand une allergie est en jeu,
so that je porte la responsabilité finale en connaissance de cause. (FR16)

Status: done

## Acceptance Criteria

1. **Given** au moins une **allergie déclarée** par un participant ayant répondu, **When** je m'apprête à **retenir un plat**, **Then** un **avertissement explicite** (danger) s'affiche et me demande de **vérifier les ingrédients** avant de valider.
2. **Given** cet avertissement, **When** il s'affiche, **Then** **ma validation explicite** est **requise** : `retenirPlat` n'est appelé **qu'après** confirmation ; « Annuler » referme l'avertissement **sans** retenir.
3. **Given** l'avertissement, **When** il nomme la situation, **Then** il **nomme le(s) participant(s)** concerné(s) (« {prénoms} a/ont déclaré une allergie ») sans détailler l'allergène — l'info vient d'un flag serveur `prenomsAvecAllergie` (REPONDU × restriction `ALLERGIE`).
4. **Given** la complémentarité (FR16), **When** l'avertissement s'affiche, **Then** sa formulation indique qu'il **complète** la détection algorithmique (le mur), **sans la remplacer** (« vérifie quand même les ingrédients »).
5. **Given** **aucune** allergie dans le groupe, **When** je choisis un plat, **Then** il est retenu **directement** (comportement 5.1 inchangé, pas d'étape de confirmation superflue).
6. **Given** l'accessibilité (NFR8/UX-DR6), **When** l'avertissement s'affiche, **Then** il porte **icône + texte** (role `alert`), et les actions « Valider »/« Annuler » sont **navigables au clavier**, cibles ≥ 44px.
7. **Given** NFR5 + non-régression + CI, **When** je termine, **Then** tout reste dans `organisateurRouter` (protégé) ; 5.1/5.2 (liste, badge, gênants, persistance) ne régressent pas ; `npm run test`, `lint`, `typecheck`, `SKIP_ENV_VALIDATION=1 build` verts.

## Tasks / Subtasks

- [x] **Tâche 1 — Serveur : `prenomsAvecAllergie`** (AC: 1, 3)
  - [x] `src/server/generation.ts` : dans `genererPourRepas`, construire `prenomsAvecAllergie: string[]` = prénoms des participants **REPONDU** ayant **≥1** restriction de type `ALLERGIE` (dédupliqué, ordre stable, un prénom une fois). Ajouter ce champ à la variante **`GENERE`** de `ResultatGeneration`.
  - [x] `/core` inchangé (lecture des restrictions au niveau serveur, comme `genantsParConvive` 5.2).
  - [x] `generation.test.ts` : un répondant avec une `ALLERGIE` → `prenomsAvecAllergie` le nomme ; sans allergie → `[]`.

- [x] **Tâche 2 — `RecettesSection` : étape de validation** (AC: 1, 2, 4, 5, 6)
  - [x] Intercepter « Choisir ce plat » : si `prenomsAvecAllergie.length > 0` → **ne pas** appeler `retenirPlat` tout de suite ; mémoriser le plat en attente (`{ ref, titre }`) et afficher un **`Banner` danger** : « ⚠ {prénoms} a déclaré une allergie. Notre détection a déjà écarté les plats à risque connus, mais **vérifie les ingrédients** de « {titre} » avant de valider. » + boutons **« Valider ce plat »** / **« Annuler »**.
  - [x] « Valider ce plat » → `retenirPlat.mutate(...)` (+ `router.refresh()` comme 5.1) puis referme l'avertissement. « Annuler » → referme sans retenir.
  - [x] **Aucune allergie** → choisir retient **directement** (chemin 5.1 inchangé, AC5).
  - [x] `RecettesSection.test.tsx` : (a) avec allergie → clic « Choisir » n'appelle PAS `retenirPlat`, l'avertissement nomme le prénom, puis « Valider » appelle `retenirPlat` ; (b) « Annuler » n'appelle pas `retenirPlat` ; (c) sans allergie → clic « Choisir » appelle `retenirPlat` directement (non-régression).

- [x] **Tâche 3 — Validations** (AC: 6, 7)
  - [x] `npm run test`, `lint`, `typecheck`, `SKIP_ENV_VALIDATION=1 build` → tout vert. A11y de l'avertissement (role alert, clavier).

## Dev Notes

### ⚠️ Pièges critiques (lire avant de coder)

1. **Human-in-the-loop (FR16) : la validation est OBLIGATOIRE quand une allergie existe.** `retenirPlat` ne doit JAMAIS être appelé sans confirmation explicite dans ce cas. C'est le filet de sécurité humain — le tester rigoureusement (le clic « Choisir » seul ne doit pas persister).

2. **L'avertissement COMPLÈTE, ne remplace pas.** Le mur (Epic 4) a déjà exclu les plats à risque détecté ; l'avertissement reconnaît que la détection n'est pas infaillible et demande une vérification humaine. La microcopy doit le dire (« notre détection a déjà écarté… mais vérifie quand même »). Ne PAS laisser entendre que le plat est dangereux (il a passé le mur) ni que tout est garanti.

3. **Ne pas casser le chemin sans allergie (AC5).** Si `prenomsAvecAllergie` est vide, « Choisir ce plat » retient directement (comportement 5.1). Pas d'étape de confirmation inutile.

4. **`/core` et le mur ne changent pas.** 5.3 est purement présentation + un flag serveur dérivé des restrictions. Aucune logique de sécurité algorithmique ici.

5. **Pas d'allergène nommé (sobriété/donnée sensible).** L'avertissement nomme le **participant** (« Léa a déclaré une allergie »), pas l'allergène. Conforme à la microcopy EXPERIENCE.md. (NFR6 = pas de **log** de donnée de santé ; l'affichage à l'organisateur est l'objet même du human-in-the-loop.)

6. **État local de l'avertissement.** Mémoriser le plat en attente dans un `useState` (`{ ref, titre } | null`). « Valider » → mutation + reset ; « Annuler » → reset. Réutiliser le `Banner` danger existant (role `alert`, icône + texte).

### État réel du projet (vérifié — acquis 5.1/5.2)

- **`genererPourRepas`** (`generation.ts`) : a accès à `repas.participants` (REPONDU, `prenom` + `restrictions` avec `type`). Renvoie `ResultatGeneration` GENERE = `{ statut, force, nonCouverts, resolution, genantsParConvive }` (5.2). **5.3 ajoute `prenomsAvecAllergie`.**
- **`RecettesSection`** (5.1/5.2, client) : bouton « Générer » → `genererRecettes` ; succès → `SafeBadge`/`Banner` dégradation + liste `RecipeCard` ; `choisir(ref, titre)` appelle aujourd'hui `retenirPlat` **directement** (+ `router.refresh()`). **C'est `choisir` que 5.3 fait passer par la confirmation** quand il y a des allergies.
- **`retenirPlat`** (`organisateur.ts`) : mutation protégée, ownership, persiste `platRetenuRef`/`platRetenuTitre`. **Inchangée.**
- **`RecipeCard`** (5.1/5.2) : `onChoisir` déclenche `choisir`. **Inchangée** (l'interception est dans `RecettesSection`).
- **`Banner`** (`src/components/ui/Banner.tsx`) : variante `danger` (role `alert`, `bg-danger-soft`, icône ⚠ + texte) — à réutiliser.
- Tests : RTL (jsdom), `~/trpc/react` mocké via `vi.hoisted` (`genererData.value`, `retenirMutate`) — voir `RecettesSection.test.tsx`.

### Périmètre — hors de cette story

- **État de génération en cours** (attente habillée) → **5.4**.
- **Échec explicatif** (contraintes bloquantes), **régénérer**, **génération forcée** (UI des non-couverts) → ultérieur.
- **Validation côté serveur** que le plat retenu vient bien d'une génération (déjà hors périmètre depuis 5.1).

### Décisions tranchées

- **Flag serveur `prenomsAvecAllergie`** (REPONDU × `ALLERGIE`), `/core` intact.
- **Confirmation inline** (Banner danger + Valider/Annuler) plutôt qu'une modale (plus simple, accessible, suffisant pour le human-in-the-loop).
- **Nommer le participant, pas l'allergène.**
- **Pas de friction sans allergie** (retient direct).

### Testing standards

- **Vitest + RTL** (jsdom) pour `RecettesSection` ; **node** pour `generation.test.ts`.
- Couvrir : flag serveur (présence/absence) ; gate de confirmation (clic « Choisir » ⇏ `retenirPlat` ; « Valider » ⇒ `retenirPlat` ; « Annuler » ⇏) ; non-régression sans allergie (retient direct) ; a11y (role alert).

### Definition of Done manuelle (utilisateur, hors agent)

1. `npm run test`/`lint` verts.
2. Parcours : repas avec ≥1 répondant allergique → générer → « Choisir » → l'avertissement s'affiche (nomme le prénom) → « Valider » retient ; « Annuler » ne retient pas. Repas sans allergie → « Choisir » retient direct.

### Project Structure Notes

- **Modifiés** : `src/server/generation.ts` (+`prenomsAvecAllergie`) + `generation.test.ts` ; `src/components/organisateur/RecettesSection.tsx` (gate de validation) + `RecettesSection.test.tsx`.
- **Inchangés** : `/core`, le schéma, `retenirPlat`, `RecipeCard`.
- **Aucune** migration, **aucune** dépendance.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 5.3] (avertissement + validation explicite ; complète la détection, ne la remplace pas)
- [Source: _bmad-output/planning-artifacts/ux-designs/.../EXPERIENCE.md] (microcopy « ⚠️ Léa a déclaré une allergie. Vérifie bien les ingrédients avant de valider ce plat. » ; « Valider un plat » = action finale précédée de l'avertissement ; banner danger en danger-soft)
- [Source: _bmad-output/implementation-artifacts/5-1-consulter-la-liste-choisir-un-plat.md] (`choisir` → `retenirPlat`, à intercaler)
- [Source: src/server/generation.ts] (`ResultatGeneration`, accès aux restrictions REPONDU)
- [Source: src/components/ui/Banner.tsx] (variante danger, role alert)

## Dev Agent Record

### Agent Model Used

claude-opus-4-8 (bmad-dev-story)

### Debug Log References

- Suite complète : **281/281** ✅ (277 → 281, +4 : `prenomsAvecAllergie` serveur ×2, gate validation RecettesSection ×2). `lint` ✅, `typecheck` ✅, `build` ✅.
- `/core` **non touché**. Changement additif → tests 5.1/5.2 verts (mocks complétés de `prenomsAvecAllergie: []`).

### Completion Notes List

- ✅ **Serveur** : `genererPourRepas` calcule `prenomsAvecAllergie` (répondants ayant ≥1 restriction `ALLERGIE`, dédup) et l'ajoute à la variante `GENERE`. `/core` intact. Le non-aimé seul **ne** compte **pas** comme allergie (testé).
- ✅ **Human-in-the-loop (FR16)** : dans `RecettesSection`, « Choisir ce plat » **n'appelle plus directement** `retenirPlat` quand `prenomsAvecAllergie` non vide → état `aValider` + **`Banner` danger** (role `alert`, icône + texte) nommant le(s) convive(s) + « Valider ce plat » / « Annuler ». Confirmation **obligatoire** avant persistance (testé : clic « Choisir » seul ⇏ `retenirPlat`).
- ✅ **Complète, ne remplace pas** : microcopy « notre détection a déjà écarté les plats à risque connus, **mais vérifie les ingrédients** avant de valider ».
- ✅ **Aucune friction sans allergie** (AC5) : retient directement (chemin 5.1 inchangé, testé).
- ✅ A11y : Banner danger `role="alert"`, boutons clavier (≥44px via `Button`). Accord singulier/pluriel (« a »/« ont »).
- **Hors périmètre** : attente habillée → 5.4 ; échec/régénérer/forcée → ultérieur.
- **DoD utilisateur** : `npm run test`/`lint` verts ; parcours allergie → « Choisir » → avertissement → « Valider »/« Annuler ».

### File List

- `src/server/generation.ts` (MODIFIÉ — `prenomsAvecAllergie`) + `generation.test.ts`
- `src/components/organisateur/RecettesSection.tsx` (MODIFIÉ — gate de validation) + `RecettesSection.test.tsx`

### Change Log

- 2026-06-28 : Story 5.3 implémentée — avertissement allergie & validation (FR16). Serveur : flag `prenomsAvecAllergie` (répondants allergiques), `/core` intact. UI : confirmation explicite obligatoire (Banner danger + Valider/Annuler) en amont de `retenirPlat` quand une allergie existe ; retient direct sinon. Avertissement complète la détection (ne la remplace pas). 281/281, lint/typecheck/build verts. Statut → review. **Human-in-the-loop de sécurité en place (FR16).**
