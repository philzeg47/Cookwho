---
baseline_commit: 57699bac5dc930c9d8b06e18ffb90db8009f5407
---

# Story 5.4 : État de génération en cours

As an organisateur,
I want un retour rassurant pendant que CookWho cherche des plats,
so that l'attente ne devient pas de l'angoisse. (UX-DR4)

Status: review

## Acceptance Criteria

1. **Given** que je lance une génération, **When** le moteur travaille (jusqu'à quelques secondes), **Then** un **état d'attente habillé et narratif** s'affiche (ex. « On vérifie chaque assiette… ») à la place d'un vide.
2. **Given** cet état d'attente, **When** la génération se termine, **Then** il **disparaît** et l'écran se résout vers l'un des états existants : **succès**, **dégradation**, **échec** ou **attente de réponses** (5.1/5.2/5.3 inchangés).
3. **Given** l'accessibilité (NFR6/UX-DR6), **When** l'attente s'affiche, **Then** elle est annoncée aux lecteurs d'écran (région `role="status"` / `aria-live="polite"`, `aria-busy`) — icône/picto **+ texte**, jamais la couleur seule.
4. **Given** le ton (Voice & Tone, UX-DR5), **When** un message s'affiche, **Then** il est **chaleureux et rassurant** (pas technique), cohérent avec la microcopy FR du produit.
5. **Given** la non-régression + CI, **When** je termine, **Then** 5.1/5.2/5.3 ne régressent pas ; `npm run test`, `lint`, `typecheck`, `SKIP_ENV_VALIDATION=1 build` restent verts. **Aucun** changement serveur ni `/core`.

## Tasks / Subtasks

- [x] **Tâche 1 — Composant `EtatGenerationEnCours`** (AC: 1, 3, 4)
  - [x] `src/components/organisateur/EtatGenerationEnCours.tsx` (`"use client"`) : bloc d'attente habillé — picto doux (`aria-hidden`) + message **narratif rassurant**. Région `role="status"`, `aria-live="polite"`, `aria-busy="true"`. **Rotation** de quelques messages (ex. « On vérifie chaque assiette… », « On compare avec les contraintes du groupe… », « Presque prêt… ») via `useEffect`+`setInterval` (nettoyage au démontage) ; premier message déterministe.
  - [x] Test RTL : rend `role="status"`, affiche le premier message narratif.

- [x] **Tâche 2 — Câblage dans `RecettesSection`** (AC: 1, 2)
  - [x] `src/components/organisateur/RecettesSection.tsx` : quand `generer.isPending`, afficher `<EtatGenerationEnCours />` (remplace le commentaire `TODO 5.4`). Les blocs de résultat restent gated sur `resultat` (donc l'attente disparaît à la résolution). Garder le texte du bouton « On cherche des plats… ».
  - [x] Test RTL : `isPending: true` → l'état d'attente est rendu ; `isPending: false` + data → il a disparu (non-régression 5.1/5.2/5.3).

- [x] **Tâche 3 — Validations** (AC: 3, 5)
  - [x] `npm run test`, `lint`, `typecheck`, `SKIP_ENV_VALIDATION=1 build` → tout vert.

## Dev Notes

### ⚠️ Pièges critiques (lire avant de coder)

1. **UI pure — zéro serveur, zéro /core.** 5.4 n'ajoute qu'un état visuel pendant `generer.isPending`. Ne toucher ni à `generation.ts`, ni au router, ni au moteur.
2. **L'attente doit se résoudre proprement (AC2).** Les blocs de résultat de `RecettesSection` sont déjà gated sur `resultat` (= `generer.data`), undefined pendant le `pending`. Afficher l'attente UNIQUEMENT sur `generer.isPending` garantit la transition automatique vers succès/dégradation/échec/attente-réponses sans logique supplémentaire.
3. **Nettoyer l'intervalle.** La rotation des messages utilise `setInterval` dans un `useEffect` → **toujours** `clearInterval` au démontage (sinon fuite/`act` warnings en test). Le composant n'est monté que pendant le `pending`, donc l'intervalle s'arrête à la résolution.
4. **A11y (AC3).** Région `role="status"` + `aria-live="polite"` + `aria-busy` pour annoncer l'attente ; picto `aria-hidden` ; signal porté par le **texte**, pas la couleur.
5. **Ton (AC4).** Messages chaleureux/rassurants (« On vérifie chaque assiette… »), pas techniques (« Appel API en cours… »). Cohérent avec la Voice & Tone du produit (EXPERIENCE.md).
6. **Tests & timers.** Si la rotation est testée, utiliser `vi.useFakeTimers()` + `act` ; sinon tester seulement le premier message + `role="status"` (suffisant pour les ACs). Éviter les `act` warnings.

### État réel du projet (vérifié — acquis 5.1/5.2/5.3)

- **`RecettesSection`** (client) : bouton « Générer » → `genererRecettes.useMutation()`. `generer.isPending` est déjà utilisé pour le libellé du bouton (« On cherche des plats… »). Les blocs résultat sont gated sur `resultat = generer.data`. Un commentaire **`{/* TODO 5.4 : état d'attente habillé et narratif. */}`** marque l'emplacement.
- **Composants UI dispo** : `Banner` (status/alert), `SafeBadge`, `Button`, `RecipeCard`. Palette Cocon (Tailwind). Pas de spinner dédié (à créer simplement, CSS/emoji).
- **Tests** : RTL (jsdom), `~/trpc/react` mocké via `vi.hoisted` (voir `RecettesSection.test.tsx` — `genererData.value`, et on peut piloter `isPending` en étendant le mock).
- **NFR8/UX-DR6** : distinctions jamais sur la seule couleur ; clavier/lecteur d'écran.

### Périmètre — hors de cette story

- **Échec explicatif** (présentation des contraintes bloquantes), **régénérer**, **génération forcée** (UI des non-couverts) → itérations ultérieures d'Epic 5 (les replis neutres de 5.1 restent).
- Animations élaborées / illustrations riches → un picto doux suffit (UX-DR7, minimal).

### Décisions tranchées

- **Composant dédié `EtatGenerationEnCours`** (testable) plutôt qu'inline.
- **Rotation légère de messages** (narratif), premier message déterministe.
- **Aucun** changement serveur/`/core`.

### Testing standards

- **Vitest + RTL** (jsdom). Couvrir : état d'attente rendu sur `isPending` (role status + message) ; absent quand non-pending ; non-régression du chemin résultat.

### Definition of Done manuelle (utilisateur, hors agent)

1. `npm run test`/`lint` verts.
2. Parcours : cliquer « Générer » → un message d'attente chaleureux s'affiche le temps de la recherche, puis laisse place aux plats (ou à l'état d'échec/attente).

### Project Structure Notes

- **Nouveau** : `src/components/organisateur/EtatGenerationEnCours.tsx` (+ test).
- **Modifié** : `src/components/organisateur/RecettesSection.tsx` (rendu de l'attente) + `RecettesSection.test.tsx`.
- **Aucune** migration, **aucune** dépendance, **aucun** changement serveur.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 5.4] (état d'attente habillé et narratif ; se résout vers succès/dégradation/échec)
- [Source: _bmad-output/planning-artifacts/ux-designs/.../EXPERIENCE.md] (Chargement (génération) : état d'attente court < 5 s, message léger « On cherche des plats pour tout le monde… » ; UX-DR4/UX-DR5)
- [Source: src/components/organisateur/RecettesSection.tsx] (TODO 5.4, `generer.isPending`)

## Dev Agent Record

### Agent Model Used

claude-opus-4-8 (bmad-dev-story)

### Debug Log References

- Suite complète : **284/284** ✅ (281 → 284, +3 : `EtatGenerationEnCours` ×1, attente affichée/masquée dans `RecettesSection` ×2). `lint` ✅, `typecheck` ✅, `build` ✅.
- UI pure : **aucun** changement serveur ni `/core`.
- Mock `RecettesSection.test.tsx` étendu (`genererState.isPending` pilotable + `beforeEach` de reset).

### Completion Notes List

- ✅ **`EtatGenerationEnCours`** (nouveau) : bloc d'attente habillé, picto `aria-hidden` + message **narratif rassurant** en rotation (`useEffect`+`setInterval`, `clearInterval` au démontage). Région `role="status"`, `aria-live="polite"`, `aria-busy` (a11y).
- ✅ **Câblage** : rendu dans `RecettesSection` sur `generer.isPending` (remplace le `TODO 5.4`). Les blocs résultat restant gated sur `resultat`, l'attente **disparaît à la résolution** → succès/dégradation/échec/attente-réponses (testé affiché + masqué).
- ✅ **Ton** chaleureux (« On vérifie chaque assiette pour tout le monde… »), pas technique.
- ✅ **Zéro régression** 5.1/5.2/5.3 ; aucun changement serveur/`/core`.
- **DoD utilisateur** : `npm run test`/`lint` verts ; cliquer « Générer » → message d'attente puis résolution.

### File List

- `src/components/organisateur/EtatGenerationEnCours.tsx` + `EtatGenerationEnCours.test.tsx` (NOUVEAUX)
- `src/components/organisateur/RecettesSection.tsx` (MODIFIÉ — rendu de l'attente) + `RecettesSection.test.tsx` (mock `isPending` + tests)

### Change Log

- 2026-06-28 : Story 5.4 implémentée — état de génération en cours. Composant `EtatGenerationEnCours` (attente narrative, a11y `role=status`/`aria-busy`, rotation de messages nettoyée) rendu pendant `generer.isPending` dans `RecettesSection` ; se résout automatiquement vers les états existants. UI pure (zéro serveur/`/core`). 284/284, lint/typecheck/build verts. Statut → review. **Dernière story du MVP — périmètre fonctionnel complet.**
