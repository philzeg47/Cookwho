# Story 1.2: Bibliothèque de composants UI de base

Status: ready-for-dev

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

- [ ] **Tâche 0 — Outillage de test composant** (AC: 4)
  - [ ] Ajouter devDeps : `@testing-library/react`, `@testing-library/jest-dom`, `jsdom`.
  - [ ] Créer `vitest.config.ts` (environnement `jsdom`, alias `~` → `src`, setup `@testing-library/jest-dom`).
  - [ ] Vérifier qu'un test de rendu React passe.
- [ ] **Tâche 1 — Button** (AC: 1, 3, 5)
  - [ ] `src/components/ui/Button.tsx` : variantes `primary` (bg-primary text-on-primary hover:bg-primary-strong hover:text-white), `secondary` (border border-edge text-ink hover:bg-surface-muted), `text` (text-primary-strong, soulignement au survol). `rounded-md`, `font-semibold`, focus ring visible.
  - [ ] Étend `ButtonHTMLAttributes` (type, onClick, aria-*). Test : rendu des 3 variantes + classe attendue.
- [ ] **Tâche 2 — Input** (AC: 1, 5)
  - [ ] `src/components/ui/Input.tsx` : hauteur 44px (`h-11`), `border-edge rounded-md`, focus ring `primary`, label associé (`htmlFor`/`id`). Étend `InputHTMLAttributes`.
  - [ ] Test : rendu + association label/champ.
- [ ] **Tâche 3 — Chip** (AC: 1, 2)
  - [ ] `src/components/ui/Chip.tsx` : pill (`rounded-pill`), variantes `allergie` (bg-danger-soft text-danger-strong), `regime` (bg-safe-soft text-safe-text), `non-aime` (bg-accent-soft text-accent). Slot icône optionnel + libellé obligatoire.
  - [ ] Test : chaque variante rend la bonne classe + le libellé.
- [ ] **Tâche 4 — Banner** (AC: 1, 2)
  - [ ] `src/components/ui/Banner.tsx` : variantes `info` (bg-primary-soft text-primary-strong) et `danger` (bg-danger-soft text-danger-strong, `border border-danger`). Icône (défaut ⚠ pour danger) + message. `role="status"` (info) / `role="alert"` (danger).
  - [ ] Test : variante danger porte rôle alert + icône + texte.
- [ ] **Tâche 5 — SafeBadge** (AC: 1, 2)
  - [ ] `src/components/ui/SafeBadge.tsx` : `bg-safe text-safe-text rounded-pill`, ✓ + libellé (défaut « pris en compte »).
  - [ ] Test : rend l'icône ✓ + le libellé.
- [ ] **Tâche 6 — Intégration & vitrine** (AC: 1, 4)
  - [ ] (Optionnel) refactorer la page d'accueil pour consommer `SafeBadge` et `Button` au lieu du markup inline de 1.1.
  - [ ] Lancer `npm run test` + `npm run lint` + `npm run typecheck` → tout vert.

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

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

- Ultimate context engine analysis completed — comprehensive developer guide created.

### File List
