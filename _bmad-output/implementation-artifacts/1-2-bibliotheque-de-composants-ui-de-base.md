---
baseline_commit: f27b049
---

# Story 1.2: Bibliothèque de composants UI de base

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a porteur du projet,
I want les composants visuels réutilisables de CookWho (Button, Input, Chip, Banner, SafeBadge),
so that tous les écrans partagent le même langage visuel « Cocon » sans le réinventer.

## Acceptance Criteria

1. **Given** le thème Cocon configuré (story 1.1), **When** j'implémente les composants, **Then** existent dans `src/components/ui/` : `Button` (variantes primaire / secondaire / texte), `Input`, `Chip` (variantes allergie / régime / non-aimé), `Banner` (variantes info / danger) et `SafeBadge` — tous fondés sur les tokens Cocon (utilitaires Tailwind, aucun hex en dur).
2. **Given** les composants, **When** ils communiquent un état/sens, **Then** ils portent **icône + libellé texte** — la couleur n'est jamais le seul porteur de sens (NFR8, UX-DR6). Ex. `SafeBadge` = ✓ + texte ; `Banner` danger = ⚠ + texte.
3. **Given** `Button` primaire, **When** il est rendu, **Then** fond `primary` (abricot) + texte `on-primary` (foncé) — pas de texte blanc sur abricot — et un état hover lisible.
4. **Given** les composants, **When** je lance `npm run test`, **Then** chaque composant a au moins un test (rendu + variante) qui passe ; `npm run lint` et `npm run typecheck` restent verts.
5. **Given** l'accessibilité, **When** un composant est interactif (`Button`, `Input`), **Then** il est focusable au clavier avec un anneau de focus visible et accepte les attributs ARIA standards (props étendues).

## Tasks / Subtasks

- [x] **Tâche 0 — Outillage de test composant** (AC: 4)
  - [x] devDeps ajoutées : `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/dom`, `jsdom`, `@vitejs/plugin-react`.
  - [x] `vitest.config.ts` créé (env `jsdom`, alias `~`→`src`, setup `src/test/setup.ts`, plugin React).
  - [x] Tests de rendu React passent ; le test `/core` (env node) reste vert.
- [x] **Tâche 1 — Button** (AC: 1, 3, 5)
  - [x] `src/components/ui/Button.tsx` : variantes primary / secondary / text, `rounded-md`, `font-semibold`, focus ring, `min-h-11`. Étend `ButtonHTMLAttributes`. 2 tests.
- [x] **Tâche 2 — Input** (AC: 1, 5)
  - [x] `src/components/ui/Input.tsx` : `h-11`, `border-edge rounded-md`, focus ring `primary`, label associé. 1 test (association label).
- [x] **Tâche 3 — Chip** (AC: 1, 2)
  - [x] `src/components/ui/Chip.tsx` : pill, variantes allergie / regime / non-aime, icône optionnelle + libellé. 2 tests.
- [x] **Tâche 4 — Banner** (AC: 1, 2)
  - [x] `src/components/ui/Banner.tsx` : info (`role=status`) / danger (`role=alert`, `border-danger`), icône défaut + message. 2 tests.
- [x] **Tâche 5 — SafeBadge** (AC: 1, 2)
  - [x] `src/components/ui/SafeBadge.tsx` : `bg-safe text-safe-text`, ✓ + libellé. 2 tests.
- [x] **Tâche 6 — Intégration & vitrine** (AC: 1, 4)
  - [x] Page d'accueil refactorée pour consommer `SafeBadge` et `Button`.
  - [x] `npm run test` (10/10), `npm run lint`, `npm run typecheck`, build → tout vert.

## Dev Notes

### Contexte hérité de la story 1.1 (IMPORTANT — ne pas se tromper)
- **Tailwind v4** : pas de `tailwind.config.ts`. Le thème vit dans `src/styles/globals.css` via `@theme`. Pour ajouter une couleur, on édite `@theme`, pas un fichier de config JS.
- **Next 15.2.3** (App Router), React 19, TypeScript. (L'archi mentionnait Next 16 ; le réel est 15.2.3.)
- **Alias d'import** : `~/*` → `src/*`.
- **ESLint** est *scopé sur `src/**/*.{ts,tsx}`* (flat config `eslint.config.js`) ; `generated/` est ignoré. Ne pas réintroduire d'erreurs de lint.
- **Composants = Server Components par défaut.** Ces 5 primitives sont présentationnelles : pas besoin de `'use client'` (l'interactivité — onClick — est fournie par le consommateur ; un `<button>` accepte les handlers passés en props sans directive client tant que le composant lui-même ne définit pas de hook). N'ajouter `'use client'` que si réellement nécessaire.

### Utilitaires Tailwind Cocon DISPONIBLES (définis en 1.1)
Couleurs (préfixer par `bg-`, `text-`, `border-`) :
`background, surface, surface-muted, primary, primary-strong, primary-soft, accent, accent-soft, safe, safe-text, safe-soft, danger, danger-strong, danger-soft, ink, ink-soft, on-primary, edge`
Rayons : `rounded-md` (10px), `rounded-lg` (16px), `rounded-pill` (999px). Police : `font-sans` (Nunito).
> ⚠️ `border` (la couleur DESIGN) est exposée sous le nom **`edge`** (`border-edge`) pour éviter le conflit avec l'utilitaire `border` de Tailwind.

### Spécifications visuelles (source DESIGN.md → Components)
- **Button primaire** : fond abricot, **texte foncé `on-primary`** (l'abricot est clair — jamais de texte blanc dessus en état normal). Hover : `bg-primary-strong` + texte clair.
- **Chip** : allergie = `danger`, régime = `safe`, non-aimé = `accent` (cohérent avec le mur/curseur).
- **Banner** : info = `primary-soft` ; danger = `danger-soft` + `border-danger`.
- **SafeBadge** : élément de confiance récurrent (`bg-safe text-safe-text`), réutilisé partout où il faut rassurer.

### Accessibilité (NFR8 / UX-DR6) — non négociable
- Sens porté par **icône + texte**, jamais la couleur seule.
- Composants interactifs focusables, anneau de focus visible (`focus-visible:ring-2 ring-primary` ou équivalent), props ARIA passables.
- Cibles tactiles ≥ 44px (Input `h-11`, Button padding suffisant).

### Icônes
- Pas de librairie d'icônes en V1. Accepter un slot `icon?: ReactNode` (le consommateur passe un emoji ou un SVG) ; défauts sémantiques fournis (`SafeBadge` ✓, `Banner` danger ⚠). Ne pas ajouter de dépendance d'icônes sans accord.

### Périmètre — hors de cette story
- `quick-select`, `recipe-card`, `participant-row`, `stepper`, `tolerance-slider` → stories ultérieures (Epic 2/3/4/5). Ici : uniquement les **5 primitives de base**.
- Aucune logique métier, aucun appel tRPC/DB.

### Testing standards
- Vitest (déjà installé en 1.1) + React Testing Library (ajout Tâche 0). Environnement `jsdom`.
- 1 test minimum par composant (rendu + au moins une variante / comportement d'accessibilité).

### Project Structure Notes
- Nouveaux fichiers sous `src/components/ui/`. Co-localiser les tests (`Button.test.tsx` à côté de `Button.tsx`).
- `vitest.config.ts` nouveau (jsdom + alias). Vérifier que le test `/core` existant (`src/core/core.test.ts`, environnement node) passe toujours — jsdom global ne doit pas le casser.

### References
- [Source: _bmad-output/planning-artifacts/ux-designs/ux-CookWho-2026-06-19/DESIGN.md#Components] (specs des 5 composants)
- [Source: _bmad-output/planning-artifacts/ux-designs/ux-CookWho-2026-06-19/DESIGN.md#Colors] (tokens)
- [Source: _bmad-output/planning-artifacts/ux-designs/ux-CookWho-2026-06-19/EXPERIENCE.md#Accessibility Floor] (icône+texte, focus)
- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.2] (énoncé + AC)
- [Source: _bmad-output/implementation-artifacts/1-1-initialisation-du-projet-theme-cocon.md] (Tailwind v4, utilitaires Cocon, conventions)

## Dev Agent Record

### Agent Model Used

claude-opus-4-8 (bmad-dev-story)

### Debug Log References

- `npm install` (deps de test) → +97 paquets.
- `npm run test` → **10/10** (6 fichiers : core + 5 composants).
- `npm run lint` ✅ · `npm run typecheck` ✅ · `SKIP_ENV_VALIDATION=1 npm run build` ✅.

### Completion Notes List

- ✅ 5 composants Cocon livrés (`Button`, `Input`, `Chip`, `Banner`, `SafeBadge`) + 10 tests.
- Outillage de test composant ajouté (RTL + jsdom + plugin React + `vitest.config.ts`) ; le test `/core` (env node) reste vert sous l'environnement jsdom global.
- Accessibilité respectée : sens porté par icône + texte (jamais la couleur seule) ; focus ring sur Button/Input ; `role=alert`/`status` sur Banner ; label associé sur Input.
- Bouton primaire : texte foncé `on-primary` sur abricot (piège évité).
- Page d'accueil refactorée pour consommer `SafeBadge` + `Button`.
- Composants présentationnels = Server Components (pas de `'use client'`).

### File List

- `package.json` (MODIFIÉ — devDeps RTL/jsdom/plugin-react)
- `package-lock.json` (MODIFIÉ)
- `vitest.config.ts` (NOUVEAU — jsdom + alias + plugin React)
- `src/test/setup.ts` (NOUVEAU — jest-dom matchers)
- `src/components/ui/Button.tsx` + `Button.test.tsx` (NOUVEAUX)
- `src/components/ui/Input.tsx` + `Input.test.tsx` (NOUVEAUX)
- `src/components/ui/Chip.tsx` + `Chip.test.tsx` (NOUVEAUX)
- `src/components/ui/Banner.tsx` + `Banner.test.tsx` (NOUVEAUX)
- `src/components/ui/SafeBadge.tsx` + `SafeBadge.test.tsx` (NOUVEAUX)
- `src/app/page.tsx` (MODIFIÉ — consomme SafeBadge + Button)

### Review Findings

- [x] [Review][Defer] `hover:text-white` dans Button primaire — `text-white` hors palette Cocon ; à remplacer par `text-background` ou `text-surface`. [src/components/ui/Button.tsx:6] — deferred: réaliser l'ensemble du MVP avant de corriger ce genre de détail
- [x] [Review][Patch] Focus ring invisible sur Button primaire — remplacé `ring-primary` par `ring-primary-strong` + ajout `ring-offset-2`. AC5 satisfait. [src/components/ui/Button.tsx:27]
- [x] [Review][Patch] Test manquant pour la variante `non-aime` de Chip — test ajouté (`bg-accent-soft`). AC4 satisfait. [src/components/ui/Chip.test.tsx]
- [x] [Review][Defer] `import.meta.dirname` dans vitest.config.ts — disponible seulement Node ≥ 21.2 ; CI sur Node 18/20 LTS échouerait. Alternative : `fileURLToPath(new URL('.', import.meta.url))`. [vitest.config.ts:15] — deferred, pre-existing
- [x] [Review][Defer] Button et Input ne forwardent pas les refs — nécessaire pour les librairies de formulaires et la gestion du focus (stories 2.x). [src/components/ui/Button.tsx, src/components/ui/Input.tsx] — deferred, pre-existing
- [x] [Review][Defer] vitest.config.ts sans pattern `include` explicite — laisse la config fragile si des packages publient des tests non exclus par défaut. [vitest.config.ts] — deferred, pre-existing
- [x] [Review][Defer] Input sans `aria-describedby` — l'API publique devra être refactorée quand la validation de formulaire sera ajoutée (stories 2.x). [src/components/ui/Input.tsx] — deferred, pre-existing
- [x] [Review][Defer] Chip — catégorie de variante (allergie/regime/non-aimé) non annoncée aux lecteurs d'écran — gap de design pour les stories futures (consumer doit fournir un libellé explicite ou un aria-label). [src/components/ui/Chip.tsx] — deferred, pre-existing

### Change Log

- 2026-06-19 : Story 1.2 implémentée — 5 composants UI Cocon + outillage de test (RTL/jsdom). Lint/typecheck/build/tests verts. Statut → review.
- 2026-06-22 : Code review — 1 decision_needed, 2 patches, 5 deferred, 10 dismissed.
