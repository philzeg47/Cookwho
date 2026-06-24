---
baseline_commit: f27b0499b3fcbc621d8377653ec11bb732cd8787
---

# Story 1.5: Socle d'accessibilité

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As an utilisateur (organisateur ou participant),
I want une app utilisable au clavier, au lecteur d'écran et avec un bon contraste,
so that personne n'est laissé de côté — y compris une personne en situation de handicap.

(ajoutée suite à la revue UX — NFR8, UX-DR6)

## Acceptance Criteria

1. **Given** la palette Cocon (tokens de `globals.css`), **When** j'audite le contraste texte, **Then** chaque paire texte/fond effectivement utilisée respecte **WCAG AA** (≥ 4.5:1 texte normal ; ≥ 3:1 texte large / éléments d'UI) — vérifié par un **test automatisé** (gate de CI).
2. **Given** une non-conformité détectée par l'audit, **When** je la corrige, **Then** la paire fautive est mise en conformité sans dénaturer le thème (palette abricot/sauge auditée).
3. **Given** tous les écrans existants (`/`, `/connexion`, `/connexion/verifier`, `/repas`), **When** je navigue **au clavier**, **Then** l'ordre de tabulation est logique, le focus est visible partout, et un **lien d'évitement** (« Aller au contenu ») permet de sauter la navigation.
4. **Given** un lecteur d'écran, **When** je parcours les pages, **Then** la langue est déclarée (`lang="fr"`), les repères ARIA/landmarks sont présents (`main`, en-tête), et aucune information n'est portée par la **seule couleur** (icône + libellé) — NFR8/UX-DR6.
5. **Given** les validations, **When** je lance `npm run test`, `npm run lint`, `npm run typecheck`, `build`, **Then** tout reste vert (le test de contraste inclus).

## Tasks / Subtasks

- [x] **Tâche 1 — Audit de contraste automatisé (gate CI)** (AC: 1)
  - [x] `src/lib/contrast.ts` : `relativeLuminance(hex)` + `contrastRatio(hex1, hex2)` purs (formule WCAG 2.x, linéarisation sRGB).
  - [x] `src/lib/contrast.test.ts` : lit `globals.css`, extrait les `--color-*`, asserte 9 paires texte/fond ≥ 4.5:1 (gate CI).
- [x] **Tâche 2 — Corriger la paire non conforme révélée par l'audit** (AC: 2)
  - [x] Token `--color-accent-strong: #8a5410` ajouté dans `globals.css` ; Chip `non-aime` bascule sur `text-accent-strong` (≈ 5.5:1 sur `accent-soft`, vs 3.24:1 avant).
  - [x] Test du Chip inchangé (assertion sur `bg-accent-soft`, toujours valide).
- [x] **Tâche 3 — Lien d'évitement & landmarks** (AC: 3, 4)
  - [x] `src/app/layout.tsx` : lien d'évitement « Aller au contenu » (`sr-only focus:not-sr-only`) en début de `<body>`.
  - [x] `id="contenu"` ajouté sur le `<main>` des 4 pages (`/`, `/connexion`, `/connexion/verifier`, `/repas`).
  - [x] Focus visible : déjà assuré par les `focus-visible:ring-*` des composants 1.2 (bouton primaire avec `ring-offset-2`).
- [x] **Tâche 4 — Vérifier la règle « icône + texte »** (AC: 4)
  - [x] Vérifié : `SafeBadge` (✓ + texte), `Banner` danger (⚠) / info (ℹ) + texte, `Chip` (libellé texte). Déjà couvert par les tests 1.2 ; aucun manque, aucun nouveau code.
- [x] **Tâche 5 — Tests & checklist manuelle** (AC: 1, 5)
  - [x] `npm run test` → 30/30 ✅ (dont `contrast.test.ts`).
  - [x] Checklist de vérification manuelle consignée (Completion Notes).
- [x] **Tâche 6 — Validations** (AC: 5)
  - [x] `npm run test` ✅ · `npm run lint` ✅ · `npm run typecheck` ✅.
  - [x] `SKIP_ENV_VALIDATION=1 npm run build` ✅.

## Dev Notes

### ⚠️ Cadrage (lire avant de coder)
- **Story transverse d'audit + correctifs**, pas de nouvelle fonctionnalité métier. Le livrable central est un **gate de contraste automatisé** + la correction de la paire non conforme.
- **Pas de nouvelle dépendance** : implémenter le calcul WCAG en pur (ne PAS ajouter `axe`/`jest-axe` sans accord — si tu juges `axe` utile, HALT pour validation utilisateur).
- L'audit lit `globals.css` comme **source de vérité** — ne pas dupliquer les hex en dur dans le test (sinon dérive).

### Tokens Cocon réels (source : `src/styles/globals.css`)
```
background #fbf4ec · surface #ffffff · surface-muted #f2e9dd
primary #ef9f27 · primary-strong #854f0b · primary-soft #faeeda
accent #ba7517 · accent-soft #faeeda
safe #5dcaa5 · safe-text #04342c · safe-soft #e1f5ee
danger #e24b4a · danger-strong #791f1f · danger-soft #fcebeb
ink #2c2c2a · ink-soft #5f5e5a · on-primary #633806 · edge #e0d4c2
```

### Paires texte/fond à auditer (issues des composants 1.2 + pages)
| Usage | Texte | Fond | Ratio | Seuil | Verdict |
|---|---|---|---|---|---|
| Corps de page | `ink #2c2c2a` | `background #fbf4ec` | ~12:1 | 4.5 | ✅ |
| Texte secondaire | `ink-soft #5f5e5a` | `background #fbf4ec` | ~6.0:1 | 4.5 | ✅ |
| Bouton primaire | `on-primary #633806` | `primary #ef9f27` | ~4.6:1 | 4.5 | ✅ (juste) |
| Lien/texte fort | `primary-strong #854f0b` | `background #fbf4ec` | ~6.2:1 | 4.5 | ✅ |
| Banner info | `primary-strong #854f0b` | `primary-soft #faeeda` | ~5.8:1 | 4.5 | ✅ |
| Banner danger / Chip allergie | `danger-strong #791f1f` | `danger-soft #fcebeb` | ~9.0:1 | 4.5 | ✅ |
| SafeBadge / Chip régime | `safe-text #04342c` | `safe #5dcaa5` / `safe-soft #e1f5ee` | ~6.8:1 | 4.5 | ✅ |
| **Chip non-aimé** | **`accent #ba7517`** | **`accent-soft #faeeda`** | **~3.24:1** | **4.5** | **❌ → corriger (Tâche 2)** |

> Le test doit asserter **toutes** ces paires (≥ 4.5 pour le texte normal). Après la Tâche 2, la dernière ligne devient `accent-strong #8a5410` sur `accent-soft` ≈ 5.5:1 ✅.

### Formule WCAG (rappel pour `contrast.ts`)
- Canal linéarisé : `c/255` → si ≤ 0.03928 : `/12.92` ; sinon `((c+0.055)/1.055)^2.4`.
- Luminance relative : `0.2126*R + 0.7152*G + 0.0722*B`.
- Contraste : `(Lclair + 0.05) / (Lsombre + 0.05)`. AA texte normal ≥ 4.5 ; AA texte large / UI ≥ 3.

### État réel & conventions
- **Layout racine** [`src/app/layout.tsx`] : déjà `lang="fr"`, `bg-background text-ink font-sans` sur `<body>`. AC4 (langue déclarée) déjà partiellement satisfait — il manque le lien d'évitement et les `id` de cible.
- `sr-only` / `focus:not-sr-only` sont fournis par Tailwind v4 (utilitaires standard) — pas de CSS custom à écrire.
- Composants 1.2 : focus rings en place ; bouton primaire corrigé en revue (`ring-offset-2`, `ring-primary-strong`).
- Pages avec `<main>` : `src/app/page.tsx`, `src/app/connexion/page.tsx`, `src/app/connexion/verifier/page.tsx`, `src/app/(organisateur)/repas/page.tsx`.
- `src/lib/` est autorisé (la règle ESLint de boundaries ne vise que `src/core/**`). Pas d'impact sur `/core`.

### Périmètre — hors de cette story
- Composants participant (stepper, tolerance-slider, quick-select) → Epic 3 (leur a11y sera vérifiée à leur création).
- Audit a11y exhaustif outillé (axe/Lighthouse CI) → amélioration ultérieure possible ; ici, gate de contraste maison + checklist manuelle.
- Démo T3 `Post` : laissée en l'état.

### Testing standards
- **Vitest** : `contrast.test.ts` en env node (lecture de fichier + calcul pur), co-localisé dans `src/lib/`.
- Réutiliser RTL pour tout ajustement de composant (Chip).
- La navigation clavier/lecteur d'écran réelle = **checklist manuelle** consignée (non automatisée sans dépendance).

### Project Structure Notes
- Nouveaux : `src/lib/contrast.ts`, `src/lib/contrast.test.ts`.
- Modifiés : `src/styles/globals.css` (token `accent-strong`), `src/components/ui/Chip.tsx` (+ `Chip.test.tsx` si besoin), `src/app/layout.tsx` (lien d'évitement), et les 4 `page.tsx` (`id="contenu"`).
- Aucune nouvelle dépendance, aucune migration.

### References
- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.5] (énoncé + AC)
- [Source: _bmad-output/planning-artifacts/ux-designs/ux-CookWho-2026-06-19/EXPERIENCE.md#Accessibility Floor] (icône+texte, focus, contraste)
- [Source: _bmad-output/planning-artifacts/architecture.md] (NFR8, Tailwind v4 thème via globals.css)
- [Source: _bmad-output/implementation-artifacts/1-1-initialisation-du-projet-theme-cocon.md] (tokens Cocon, `lang="fr"`, Tailwind v4)
- [Source: _bmad-output/implementation-artifacts/1-2-bibliotheque-de-composants-ui-de-base.md] (composants, focus rings, règle icône+texte déjà testée)

## Dev Agent Record

### Agent Model Used

claude-opus-4-8 (bmad-dev-story)

### Debug Log References

- RED : `contrast.test.ts` échoue d'abord sur « Chip non-aimé » (token `accent-strong` absent) → confirme la non-conformité ~3.24:1.
- GREEN : après ajout de `accent-strong` + bascule du Chip, `npm run test` → **30/30** ✅.
- `npm run lint` ✅ · `npm run typecheck` ✅ · `SKIP_ENV_VALIDATION=1 npm run build` ✅.

### Completion Notes List

- ✅ **Gate de contraste WCAG AA** : `src/lib/contrast.ts` (calcul pur) + `contrast.test.ts` qui lit `globals.css` (source de vérité) et asserte 9 paires texte/fond ≥ 4.5:1. Toute régression de token fera échouer la CI.
- ✅ **Non-conformité corrigée** : Chip « non-aimé » passait à ~3.24:1 (`accent` sur `accent-soft`) ; nouveau token `accent-strong #8a5410` → ~5.5:1.
- ✅ **Lien d'évitement** « Aller au contenu » dans le layout racine (visible au focus) + `id="contenu"` sur les 4 `<main>`.
- ✅ **Règle icône+texte (NFR8)** vérifiée sur les composants existants — déjà conforme, aucun changement.
- ✅ `lang="fr"` déjà en place (story 1.1).
- **Checklist de vérification manuelle (clavier + lecteur d'écran)** — à exécuter par l'utilisateur :
  1. Tab depuis le haut de page → le lien « Aller au contenu » apparaît en premier et saute au `<main>`.
  2. Tabulation sur `/connexion` : champ email → bouton, focus ring visible partout.
  3. Sur `/repas` (connecté) : en-tête → « Se déconnecter » atteignable au clavier.
  4. Lecteur d'écran : la langue française est annoncée ; les Banner danger/info sont annoncés via `role=alert`/`status` ; les badges/chips lisent leur libellé texte (pas seulement la couleur).

### File List

- `src/lib/contrast.ts` (NOUVEAU — calcul de contraste WCAG pur)
- `src/lib/contrast.test.ts` (NOUVEAU — gate de contraste, lit globals.css)
- `src/styles/globals.css` (MODIFIÉ — token `--color-accent-strong`)
- `src/components/ui/Chip.tsx` (MODIFIÉ — variante non-aime sur `text-accent-strong`)
- `src/app/layout.tsx` (MODIFIÉ — lien d'évitement)
- `src/app/page.tsx` (MODIFIÉ — `id="contenu"`)
- `src/app/connexion/page.tsx` (MODIFIÉ — `id="contenu"`)
- `src/app/connexion/verifier/page.tsx` (MODIFIÉ — `id="contenu"`)
- `src/app/(organisateur)/repas/page.tsx` (MODIFIÉ — `id="contenu"`)

### Review Findings (revue groupée 1.3–1.5, 2026-06-22)

- [x] [Review][Patch] CI lance `npm run build` (avec `SKIP_ENV_VALIDATION=1`) — AC « build verts » désormais garantie par la gate. [.github/workflows/ci.yml]
- [x] [Review][Patch] Anneau de focus de l'`Input` aligné sur le `Button` : `ring-primary-strong` + `ring-offset-2` (≥ 3:1, WCAG 1.4.11). [src/components/ui/Input.tsx]
- [x] [Review][Patch] Gate de contraste étendu — paires hover ajoutées : blanc sur `primary-strong` (bouton primaire) et `ink` sur `surface-muted` (bouton secondaire). [src/lib/contrast.test.ts]

### Change Log

- 2026-06-22 : Story 1.5 implémentée — gate de contraste WCAG AA (audit automatisé), correction de la paire « non-aimé » (token `accent-strong`), lien d'évitement + landmarks, vérification icône+texte. Tests 30/30, lint/typecheck/build verts. Statut → review.
- 2026-06-22 : Revue de code — `npm run build` ajouté à la CI, focus ring Input aligné (`primary-strong` + offset), gate de contraste étendu aux paires hover. Tests 34/34. Statut → done.
