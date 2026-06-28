---
baseline_commit: b84c66a14f6ac121f0f4809a70514d714650bb5a
---

# Story 5.2 : Signalement des ingrédients gênants

As an organisateur,
I want voir clairement les ingrédients qui posent problème en dégradation,
so that je peux décider de substituer. (FR10, présentation)

Status: review

## Acceptance Criteria

1. **Given** une génération en **mode dégradation** (`resolution.mode === "DEGRADATION"`), **When** je consulte la liste, **Then** un **message d'explication** indique que les goûts ne sont pas tous satisfaits — **la sécurité (mur) reste, elle, garantie** (FR10).
2. **Given** une recette concernée (avec `ingredientsGenants`), **When** je l'affiche, **Then** ses **ingrédients gênants sont visuellement distingués** dans la `recipe-card` : **icône + libellé + qui ils gênent** (prénoms des convives qui ont déclaré cet aliment non-aimé).
3. **Given** l'attribution « qui », **When** un ingrédient gênant est listé, **Then** les **prénoms** concernés viennent d'un **mapping serveur** `valeur → prénoms` (`genantsParConvive`), construit à partir des restrictions `NON_AIME` des participants **REPONDU**. `/core` (resoudre/curseur) **reste inchangé**.
4. **Given** NFR8 (accessibilité), **When** un ingrédient gênant est signalé, **Then** la distinction **ne repose pas sur la seule couleur** : icône (`aria-hidden`) **+ texte** explicite.
5. **Given** un succès plein (`TOUS_CONTENTS`), **When** la liste s'affiche, **Then** **aucun** bloc « ingrédients gênants » n'apparaît (ces recettes ont une pénalité nulle → `ingredientsGenants` vide) — comportement 5.1 inchangé.
6. **Given** NFR5, **When** j'enrichis le retour serveur, **Then** `genererRecettes`/`retenirPlat` restent dans `organisateurRouter` (protégé) et **aucune** donnée recette/gênant n'est exposée côté participant.
7. **Given** la non-régression + CI, **When** je lance `npm run test`, `lint`, `typecheck`, `SKIP_ENV_VALIDATION=1 build`, **Then** tout reste vert ; 5.1 (liste, badge, choix persisté) n'est pas cassé.

## Tasks / Subtasks

- [x] **Tâche 1 — Serveur : attribution `genantsParConvive`** (AC: 2, 3, 6)
  - [x] `src/server/generation.ts` : dans `genererPourRepas`, construire `genantsParConvive: Record<string, string[]>` = pour chaque participant **REPONDU**, pour chaque restriction `NON_AIME`, ajouter `prenom` sous la clé `valeur` (dédupliqué/ordre stable). Ajouter ce champ à la variante **`GENERE`** de `ResultatGeneration` : `{ statut: "GENERE"; force; nonCouverts; resolution; genantsParConvive }`.
  - [x] **`/core` inchangé** : on n'enrichit que l'enveloppe serveur (le mapping vient des restrictions, pas de `resoudre`).
  - [x] `generation.test.ts` : en dégradation, `genantsParConvive` mappe le non-aimé → le(s) prénom(s) ayant déclaré.

- [x] **Tâche 2 — `RecipeCard` : bloc ingrédients gênants** (AC: 2, 4)
  - [x] `src/components/ui/RecipeCard.tsx` : ajouter une prop `genants?: { valeur: string; genePar: string[] }[]`. Si non vide, afficher un bloc distinct : icône (`aria-hidden`) + intitulé « Ingrédients qui gênent » + liste « {valeur} — gêne {prénoms} » (ou « {valeur} » si `genePar` vide). **Icône + texte** (NFR8), pas la couleur seule.
  - [x] `RecipeCard.test.tsx` : un `genants` non vide rend l'ingrédient + le(s) prénom(s) ; `genants` vide/absent → pas de bloc.

- [x] **Tâche 3 — `RecettesSection` : message dégradation + câblage** (AC: 1, 2, 5)
  - [x] `src/components/organisateur/RecettesSection.tsx` : en **succès `DEGRADATION`**, afficher un message (Banner info) « Aucun plat ne plaît à tout le monde côté goûts — voici ceux qui froissent le moins. La sécurité, elle, reste garantie. » Remplacer le `TODO 5.2`.
  - [x] Pour chaque recette, résoudre `genants = ingredientsGenants.map(v => ({ valeur: v, genePar: genantsParConvive[v] ?? [] }))` et le passer à `RecipeCard`. `TOUS_CONTENTS` → `ingredientsGenants` vide → aucun bloc (AC5).
  - [x] `RecettesSection.test.tsx` : mode DEGRADATION avec un gênant attribué → message + ingrédient + prénom rendus.

- [x] **Tâche 4 — Validations** (AC: 4, 7)
  - [x] `npm run test`, `lint`, `typecheck`, `SKIP_ENV_VALIDATION=1 build` → tout vert. A11y : bloc gênants lisible (icône + texte).

## Dev Notes

### ⚠️ Pièges critiques (lire avant de coder)

1. **`/core` ne change PAS.** L'attribution « qui » se fait au **serveur** (`generation.ts`) à partir des restrictions des participants — pas dans `resoudre`/`curseur`/`genants`. `ingredientsGenants` (la liste des aliments présents) reste produit par `/core` ; le serveur y ajoute juste le mapping `valeur → prénoms`. Ne pas threader des prénoms dans `/core` (le garderait impur et inutilement couplé).

2. **Le mapping vient des REPONDU uniquement.** Cohérent avec la génération (seuls les REPONDU influent). `genantsParConvive[valeur]` = prénoms des REPONDU ayant ce `NON_AIME`. Plusieurs convives → plusieurs prénoms (dédup/ordre stable).

3. **Clés = valeurs exactes.** `ingredientsGenants` contient les `valeur` originales des non-aimés (via `genants`, story 4.5), et le mapping est indexé par ces mêmes `valeur`. La correspondance est donc directe (pas de re-tokenisation côté UI). Si une `valeur` n'a pas d'entrée (cas improbable), `genePar = []` → on affiche l'ingrédient sans « qui » (repli sûr).

4. **NFR8 — jamais la couleur seule.** Le bloc gênants porte **icône + texte** (« ⚠ Ingrédients qui gênent », « Champignons — gêne Paul »). La couleur (accent) est un plus, pas le signal.

5. **TOUS_CONTENTS = pas de gênants.** Ces recettes ont une pénalité nulle → `ingredientsGenants` vide → aucun bloc, aucun message de dégradation. Ne pas régresser le chemin 5.1.

6. **NFR5 intacte.** L'enrichissement reste dans `organisateurRouter` ; rien de tout cela n'atteint le participant. Pas de nouveau test de garde requis (5.1 l'a posé), mais ne rien exposer ailleurs.

### État réel du projet (vérifié — acquis 5.1)

- **`RecetteRetenue`** (`/core`) : `{ ref, titre, ingredients, ingredientsGenants: string[], incertain, raisonsIncertitude, penalite }`. `ingredientsGenants` = aliments non-aimés **présents** (dédup), produit par `genants` (4.5).
- **`genererPourRepas`** (`generation.ts`) : a déjà accès à `repas.participants` (REPONDU, chacun `prenom` + `restrictions` avec `type/valeur/seuilTolerance`). Renvoie `ResultatGeneration` = `{ statut:"ATTENTE_REPONSES"; nonCouverts }` | `{ statut:"GENERE"; force; nonCouverts; resolution }`. **5.2 ajoute `genantsParConvive` à la variante GENERE.**
- **`RecipeCard`** (5.1) : props `{ titre, ingredients, selectionne?, onChoisir? }`. Disclosure ingrédients. **À étendre** avec `genants?`. Un `TODO 5.2` est déjà balisé.
- **`RecettesSection`** (5.1) : affiche la liste + `SafeBadge` (TOUS_CONTENTS) ; un `TODO 5.2` marque l'emplacement du traitement dégradation. Mutations `genererRecettes`/`retenirPlat`.
- **`Banner`** (`src/components/ui/Banner.tsx`) : variantes info/danger (réutiliser pour le message de dégradation — info).
- Tests : RTL (jsdom) ; mocks `~/trpc/react` (voir `RecettesSection.test.tsx` 5.1, `data` injecté via `vi.hoisted`).

### Périmètre — hors de cette story

- **Avertissement allergie + validation** avant de retenir → **5.3**.
- **État de génération en cours** (attente habillée) → **5.4**.
- **Échec explicatif** (contraintes bloquantes), **régénérer**, **génération forcée** (UI des non-couverts) → ultérieur.
- **Substitution effective** d'un ingrédient → hors V1 (5.2 aide seulement à *décider*).

### Décisions tranchées

- **Attribution par prénom** (fidèle à l'AC) via `genantsParConvive` (serveur), `/core` intact.
- **Bloc gênants dans `RecipeCard`** (icône + libellé + qui), NFR8 (pas la couleur seule).
- **Message de dégradation** dans `RecettesSection` (la sécurité reste garantie — FR10).

### Testing standards

- **Vitest + RTL** (jsdom) pour `RecipeCard`/`RecettesSection` ; **node** pour `generation.test.ts`.
- Couvrir : `genantsParConvive` mappe non-aimé → prénoms (REPONDU) ; bloc gênants rendu (icône+libellé+qui) ; message dégradation ; TOUS_CONTENTS → aucun bloc (non-régression 5.1).

### Definition of Done manuelle (utilisateur, hors agent)

1. `npm run test`/`lint` verts.
2. Parcours : un repas où ≥1 répondant a un non-aimé présent dans des recettes → génération en dégradation → la carte montre « {ingrédient} — gêne {prénom} » + le message d'explication.

### Project Structure Notes

- **Modifiés** : `src/server/generation.ts` (+`genantsParConvive`) + `generation.test.ts` ; `src/components/ui/RecipeCard.tsx` (+`genants`) + `RecipeCard.test.tsx` ; `src/components/organisateur/RecettesSection.tsx` (message + câblage) + `RecettesSection.test.tsx`.
- **Inchangés** : tout `/core`, le schéma, `retenirPlat`.
- **Aucune** migration, **aucune** dépendance.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 5.2] (ingrédients gênants : icône + libellé + qui ils gênent ; pas la couleur seule)
- [Source: _bmad-output/planning-artifacts/ux-designs/.../EXPERIENCE.md] (recipe-card : en dégradation, ingrédients gênants signalés avec mention de qui ils gênent ; le mur reste garanti)
- [Source: _bmad-output/implementation-artifacts/5-1-consulter-la-liste-choisir-un-plat.md] (`RecipeCard`/`RecettesSection`, TODO 5.2 balisés)
- [Source: src/server/generation.ts] (`ResultatGeneration`, accès aux participants REPONDU)
- [Source: src/core/compatibilite/curseur.ts] (`genants` — origine des `ingredientsGenants`)

## Dev Agent Record

### Agent Model Used

claude-opus-4-8 (bmad-dev-story)

### Debug Log References

- Suite complète : **277/277** ✅ (273 → 277, +4 : genantsParConvive serveur ×1, bloc gênants RecipeCard ×2, message dégradation + attribution RecettesSection ×1). `lint` ✅, `typecheck` ✅, `build` ✅.
- `/core` **non touché** (attribution construite côté serveur depuis les restrictions). Changement additif → tests 5.1 verts (mocks complétés de `genantsParConvive: {}`).

### Completion Notes List

- ✅ **Serveur** : `genererPourRepas` construit `genantsParConvive: Record<valeur, prénoms[]>` (REPONDU × NON_AIME), ajouté à la variante `GENERE` de `ResultatGeneration`. `/core` intact.
- ✅ **`RecipeCard`** : prop `genants?: { valeur, genePar }[]` → bloc distinct « ⚠ Ingrédients qui gênent » + « {valeur} — gêne {prénoms} ». **Icône + texte** (NFR8), jamais la couleur seule. Repli sûr (`genePar` vide → ingrédient sans « qui »).
- ✅ **`RecettesSection`** : en mode **DEGRADATION**, `Banner` info « …voici ceux qui froissent le moins. La sécurité, elle, reste garantie. » (FR10) ; résolution `ingredientsGenants → genants` via `genantsParConvive` passée à chaque carte. Remplace le `TODO 5.2`.
- ✅ **Non-régression 5.1** : `TOUS_CONTENTS` → `ingredientsGenants` vide → aucun bloc, aucun message (testé).
- **Hors périmètre** : avertissement allergie + validation → 5.3 ; attente habillée → 5.4 ; échec/régénérer/forcée → ultérieur.
- **DoD utilisateur** : `npm run test`/`lint` verts ; parcours dégradation → carte montre « {ingrédient} — gêne {prénom} » + message.

### File List

- `src/server/generation.ts` (MODIFIÉ — `genantsParConvive`) + `generation.test.ts`
- `src/components/ui/RecipeCard.tsx` (MODIFIÉ — prop `genants` + bloc) + `RecipeCard.test.tsx`
- `src/components/organisateur/RecettesSection.tsx` (MODIFIÉ — Banner dégradation + câblage genants) + `RecettesSection.test.tsx`

### Change Log

- 2026-06-28 : Story 5.2 implémentée — signalement des ingrédients gênants. Serveur : mapping `genantsParConvive` (valeur→prénoms des répondants), `/core` intact. UI : bloc gênants dans `RecipeCard` (icône + libellé + qui, NFR8) + message d'explication en dégradation (`RecettesSection`). Non-régression 5.1 OK. 277/277, lint/typecheck/build verts. Statut → review. **L'organisateur voit quels ingrédients gênent et qui (FR10).**
