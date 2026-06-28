---
baseline_commit: 5abb2089873df8e7cdbe9928c9cdc59f02f1fd25
---

# Story 3.2b : Assistant restrictions — contenu des 3 étapes

Status: done

## Story

As a participant,
I want déclarer concrètement mon régime, mes allergies et mes aliments non-aimés (avec un seuil de tolérance),
so that l'organisateur choisira un plat qui me convient. (FR6, NFR1)

## Acceptance Criteria

1. **Given** l'étape 1 de l'assistant, **When** elle s'affiche, **Then** je peux sélectionner **un ou plusieurs régimes** parmi des choix courants (végétarien, vegan, sans gluten, sans lactose…) — cumul possible (ex. vegan **+** sans gluten) — ou n'en choisir aucun ; chaque sélection est dé-sélectionnable.
2. **Given** l'étape 2, **When** elle s'affiche, **Then** je peux sélectionner **plusieurs allergènes** parmi les **14 allergènes réglementaires UE** (+ ajout libre), avec un traitement visuel **danger** (rouge `danger-soft`/`danger`) **et** une icône + libellé (jamais la couleur seule), et un ton **posé/sérieux** distinct de l'étape suivante.
3. **Given** l'étape 3, **When** elle s'affiche, **Then** je peux ajouter des **aliments non-aimés** (saisie libre → chips supprimables) **et** régler **un seul curseur de tolérance global** (strict ↔ souple), affiché **en clair sans chiffre**. Le curseur n'apparaît/ne s'applique **qu'aux aliments non-aimés**.
4. **Given** l'étape allergies et l'étape aliments non-aimés, **When** je les compare, **Then** elles sont **visuellement et narrativement distinctes** (« ceci peut me mettre en danger » ≠ « ceci, bof ») — la gravité allergène n'est **jamais** banalisée (couleur danger + ton net pour les allergies ; couleur accent + ton léger pour les non-aimés).
5. **Given** n'importe quelle étape, **When** je ne sélectionne rien, **Then** je peux quand même valider (**aucune restriction n'est obligatoire**) — l'enregistrement réussit et le statut passe à `REPONDU` (comportement de 3.2a inchangé).
6. **Given** mes sélections réelles, **When** je valide à l'étape 3, **Then** elles sont enregistrées en `Restriction` typées via `enregistrerRestrictions` : un `REGIME` **par régime choisi**, un `ALLERGIE` par allergène, un `NON_AIME` par aliment non-aimé **portant le seuil global**.
7. **Given** le parcours, **When** je l'utilise, **Then** il est **bouclable en moins de 2 min**, **au clavier** et **au lecteur d'écran** (quick-select et curseur ont des libellés explicites, cibles ≥ 44px) (NFR1, NFR8, UX-DR6).
8. **Given** les validations CI, **When** je lance `npm run test`, `lint`, `typecheck`, `SKIP_ENV_VALIDATION=1 npm run build`, **Then** tout reste vert ; chaque composant d'étape et les nouveaux composants UI sont testés.

## Tasks / Subtasks

- [x] **Tâche 1 — Constantes & données de référence** (AC: 1, 2, 3)
  - [x] Créer `src/lib/restrictions.ts` exportant :
    - `REGIMES_COURANTS: string[]` — ex. `["Végétarien", "Vegan", "Pescétarien", "Sans gluten", "Sans lactose", "Sans porc", "Halal", "Casher"]`
    - `ALLERGENES_UE: string[]` — les **14** : `["Gluten", "Crustacés", "Œufs", "Poisson", "Arachides", "Soja", "Lait", "Fruits à coque", "Céleri", "Moutarde", "Sésame", "Sulfites", "Lupin", "Mollusques"]`
    - `TOLERANCE_LABELS: string[]` — étiquettes du curseur (ex. `["Strict", "Plutôt strict", "Équilibré", "Plutôt souple", "Souple"]`, index 0-4)
    - `SEUIL_TOLERANCE_DEFAUT = 2` (index « Équilibré », neutre) — **doit rester dans 0-5** (borne serveur)
  - [x] Test `restrictions.test.ts` : `ALLERGENES_UE.length === 14` (gate de conformité), `SEUIL_TOLERANCE_DEFAUT` dans `[0, TOLERANCE_LABELS.length-1]`

- [x] **Tâche 2 — Composant UI `QuickSelect`** (AC: 1, 2, 7 ; UX-DR2)
  - [x] Créer `src/components/ui/QuickSelect.tsx` : liste de boutons-puces (de)sélectionnables.
  - [x] Props : `{ options: string[], selection: string[], onToggle: (valeur: string) => void, variant?: "primary" | "danger", mode?: "single" | "multi" }`
  - [x] Non sélectionné = contour (`border-edge`) ; sélectionné `primary` = `bg-primary-soft border-primary` + ✓ ; sélectionné `danger` = `bg-danger-soft border-danger text-danger-strong` + ⚠ (icône + libellé, pas couleur seule).
  - [x] Chaque puce = `<button type="button">`, `aria-pressed={selectionné}`, `min-h-11` (≥44px).
  - [x] Test `QuickSelect.test.tsx` : rend les options, `aria-pressed` reflète la sélection, click appelle `onToggle(valeur)`, variante danger porte ⚠ + libellé.

- [x] **Tâche 3 — Composant UI `ToleranceSlider`** (AC: 3, 7 ; UX-DR2)
  - [x] Créer `src/components/ui/ToleranceSlider.tsx` : `<input type="range">` `min=0 max={labels.length-1} step=1`.
  - [x] Props : `{ valeur: number, onChange: (v: number) => void, labels: string[] }`
  - [x] Affiche le **libellé courant en clair** (`labels[valeur]`) — **jamais le chiffre** ; extrémités étiquetées (« Strict » … « Souple »).
  - [x] `aria-valuetext={labels[valeur]}` + `aria-label` explicite (lecteur d'écran annonce le libellé, pas le nombre). `min-h-11` sur la zone interactive.
  - [x] Test `ToleranceSlider.test.tsx` : affiche le libellé courant, `fireEvent.change` appelle `onChange` avec le nombre, `aria-valuetext` = libellé.

- [x] **Tâche 4 — Faire évoluer `DonneesRestrictions` + `versRestrictions`** (AC: 5, 6)
  - [x] Dans `AssistantRestrictions.tsx`, refondre le type (résout le *drift* relevé en revue 3.2a ; `regime` passe en **multi-select**) :
    ```ts
    export type DonneesRestrictions = {
      regimes: string[];           // multi-select (cumul possible)
      allergenes: string[];
      nonAimes: string[];          // libellés seulement
      seuilNonAimes: number;       // curseur GLOBAL appliqué à tous les non-aimés
    };
    ```
  - [x] `DONNEES_INITIALES = { regimes: [], allergenes: [], nonAimes: [], seuilNonAimes: SEUIL_TOLERANCE_DEFAUT }`
  - [x] `versRestrictions` : chaque `regimes[i]` → 1 `REGIME` ; chaque `allergenes[i]` → 1 `ALLERGIE` ; chaque `nonAimes[i]` → 1 `NON_AIME` avec `seuilTolerance: donnees.seuilNonAimes`. **Trim + filtrer le vide** côté client (résout un report 3.2b) ; **dédupliquer** par `(type, valeur)` (résout un report 3.2b).
  - [x] Rendre l'état mutable : `const [donnees, setDonnees] = useState(...)` (3.2a l'avait figé en lecture seule).

- [x] **Tâche 5 — Composants d'étape** (AC: 1, 2, 3, 4)
  - [x] `src/components/participant/EtapeRegime.tsx` : `QuickSelect mode="multi" variant="primary"` sur `REGIMES_COURANTS` ; microcopy légère. Multi-select → `regimes: string[]` (cumul possible).
  - [x] `src/components/participant/EtapeAllergenes.tsx` : `QuickSelect mode="multi" variant="danger"` sur `ALLERGENES_UE` + champ d'ajout libre (`Input` + bouton « Ajouter »). **Ton posé/sérieux** (microcopy EXPERIENCE : « Tes allergies : on ne plaisante pas avec ça. Sélectionne tout ce qui te concerne. »). Bandeau ou libellé portant icône ⚠ + texte.
  - [x] `src/components/participant/EtapeNonAimes.tsx` : champ d'ajout libre → liste de `Chip variant="non-aime"` supprimables ; `ToleranceSlider` **affiché uniquement s'il y a ≥1 non-aimé** ; ton léger (« ceci, bof »). Accent (`accent`), pas danger.
  - [x] Chaque composant reçoit la tranche de `donnees` qui le concerne + des callbacks (`onChange`). Pas d'appel API ici (la persistance reste centralisée dans `AssistantRestrictions`).

- [x] **Tâche 6 — Brancher les étapes dans `AssistantRestrictions`** (AC: 1-7)
  - [x] Remplacer les 3 `<section id="etape-*">` vides (coquille 3.2a) par le rendu conditionnel des composants d'étape selon `etape`.
  - [x] Câbler les setters (`setDonnees`) ; conserver `aria-label`, focus sur le titre d'étape, et la navigation Précédent/Suivant/Valider de 3.2a.
  - [x] `handleValider` appelle `enregistrerRestrictions` avec `versRestrictions(donnees)` (déjà en place) — aucune modif du router nécessaire.

- [x] **Tâche 7 — Tests** (AC: 5, 6, 7, 8)
  - [x] Tests unitaires des 3 composants d'étape (sélection régime, toggle allergène + ajout libre, ajout/suppression non-aimé + slider visible conditionnellement).
  - [x] Étendre `AssistantRestrictions.test.tsx` : parcours complet avec sélections réelles → `mutate` appelé avec le bon tableau `restrictions` (1 REGIME + N ALLERGIE + M NON_AIME portant le seuil global) ; cas « rien sélectionné » → `restrictions: []` (AC5 conservé).
  - [x] `restrictions.test.ts`, `QuickSelect.test.tsx`, `ToleranceSlider.test.tsx` (cf. tâches 1-3).
  - [x] Mock `~/trpc/react` comme en 3.2a.

- [x] **Tâche 8 — Validations** (AC: 8)
  - [x] `npm run test`, `lint`, `typecheck`, `SKIP_ENV_VALIDATION=1 npm run build` → tout vert.

## Dev Notes

### ⚠️ Pièges critiques (lire avant de coder)

1. **Le curseur de tolérance est UNIQUE et GLOBAL** (EXPERIENCE.md : « un seul curseur pour les aliments non-aimés »), **pas un seuil par aliment**. C'est la décision UX qui tranche le *drift* `seuilTolerance` relevé à la revue 3.2a. Conséquence : `DonneesRestrictions` porte `seuilNonAimes: number` (global) et `versRestrictions` recopie ce seuil sur **chaque** ligne `NON_AIME`. Le modèle `Restriction.seuilTolerance` (par ligne) supporte ça sans changement de schéma.

2. **« Pas de chiffre » sur le curseur** (EXPERIENCE.md). L'utilisateur voit « Strict … Souple », jamais « 3/5 ». Le nombre n'existe que dans la donnée. `aria-valuetext` doit annoncer le **libellé**, pas la valeur numérique (sinon le lecteur d'écran lit « 2 »).

3. **Borne serveur `seuilTolerance` = 0-5** (Zod en 3.2a). Garder `TOLERANCE_LABELS.length - 1 <= 5`. Avec 5 libellés (index 0-4), on est bon. Ne pas dépasser.

4. **Frontière étanche inchangée (NFR5).** Cette story est 100 % côté participant/UI. **Aucune** lecture de recette, aucun autre participant. Le router `participant` n'est **pas** modifié (la persistance `enregistrerRestrictions` de 3.2a suffit).

5. **Allergies ≠ non-aimés — distinction non négociable (AC4, UX Do/Don't).** Allergies = `danger` (rouge) + icône ⚠ + libellé + ton net. Non-aimés = `accent` (`accent-soft`/`accent-strong`) + ton léger. **Jamais** banaliser l'allergène (pas de gris, pas de discret). La couleur seule ne porte jamais le sens → toujours icône + texte (daltonisme, NFR8).

6. **Aucune restriction obligatoire (AC5).** Ne mettre **aucune** validation bloquante. `versRestrictions` doit produire `[]` si rien n'est saisi, et `enregistrerRestrictions([])` réussit déjà (testé en 3.2a). Ne pas casser ce contrat.

7. **Régime = multi-select** (décision produit du 2026-06-26). `DonneesRestrictions.regimes: string[]` **remplace** le `regime: string | null` de la coquille 3.2a (ce champ n'était jamais peuplé — l'état était figé). Un participant peut cumuler (vegan **+** sans gluten) → chaque régime devient une ligne `REGIME`. Le récap 3.3 devra lister N régimes.

8. **`'use client'` partout.** Les composants d'étape et les nouveaux composants UI manipulent des événements → `'use client'`. `AssistantRestrictions` l'est déjà. Tests RTL/jsdom, mock `~/trpc/react`.

9. **Hygiène de saisie libre (résout 2 reports de la revue 3.2a).** `trim` + rejet du vide côté client avant d'ajouter un allergène/non-aimé (évite l'aller-retour Zod). Dédupliquer la sélection (pas deux fois « Arachides »).

### État réel du projet (vérifié — acquis 3.1 + 3.2a)

- **`AssistantRestrictions.tsx`** (3.2a) : 3 vues (accueil → stepper → confirme), `DonneesRestrictions` exporté, `versRestrictions()` déjà en place, navigation + focus + `enregistrerRestrictions` câblés. **Cette story remplit les conteneurs d'étape vides** et fait évoluer le type/le mapper.
- **`Restriction` + `enregistrerRestrictions`** (3.2a) : types `REGIME`/`ALLERGIE`/`NON_AIME`, `seuilTolerance Int?` (0-5), `.refine` interdisant le seuil hors NON_AIME, plafond `.max(50)`. **Aucune modif router dans cette story.**
- **Composants UI existants** (`~/components/ui/`) : `Button` (`min-h-11`, variant primary/secondary/text), `Input`, `Chip` (variant `allergie`/`regime`/`non-aime` déjà câblé aux bonnes couleurs), `Banner` (info/danger), `SafeBadge`. **`QuickSelect` et `ToleranceSlider` n'existent pas → à créer** (UX-DR2).
- **Tokens dispo** (`globals.css`) : `primary-soft`, `danger`/`danger-soft`/`danger-strong`, `accent`/`accent-soft`/`accent-strong`, `safe-soft`, `edge`. Tout le nécessaire est présent.
- **Pattern test composant client** : `vi.mock("~/trpc/react", ...)`, RTL `fireEvent`, `act(() => onSuccess())` pour la confirmation (cf. `AssistantRestrictions.test.tsx`).

### UX / Microcopy (EXPERIENCE.md — Voice & Tone)

- **Étape Régime** (léger) : « Un régime particulier ? » — sélection rapide, optionnelle.
- **Étape Allergies** (posé, net) : « Tes allergies : on ne plaisante pas avec ça. Sélectionne tout ce qui te concerne. » Icône ⚠ + libellé sur chaque allergène sélectionné.
- **Étape Non-aimés** (léger) : « Des aliments que tu préfères éviter ? » + curseur « À quel point ? Strict ↔ Souple ».
- **Confirmation** (déjà en 3.2a) : « C'est pris en compte. » Les chips de récap détaillés arrivent en **story 3.3** (récap complet) — ne pas dupliquer ici.

### Périmètre — hors de cette story

- **Récapitulatif complet** des sélections avant/après validation → **story 3.3** (la vue « confirme » reste sobre ici).
- **Modification** (rouvrir un lien déjà REPONDU et réafficher ses saisies) → **story 3.4** (nécessite `statut` + lecture des `Restriction` existantes dans `monAcces` — non fait ici).
- **États expiré/repas clos** → **story 3.5** (inclut le filtre `expiresAt` déféré de la revue 3.1/3.2a).
- **Détection d'allergènes dans les recettes** (dictionnaire UE) → **Epic 4** : ici on ne fait que **déclarer** des allergènes, on n'en détecte aucun.

### Accessibilité (NFR8, UX-DR6 — gate du projet)

- Quick-select : `<button aria-pressed>` + `min-h-11` ; libellé textuel toujours présent.
- Slider : `aria-label` + `aria-valuetext` = libellé (pas le nombre) ; utilisable au clavier (flèches natives de `input[range]`).
- Allergènes : icône ⚠ **et** texte (jamais la couleur seule).
- Focus déplacé sur le titre d'étape à chaque transition (déjà en 3.2a).
- Parcours clavier complet, phrases courtes (accessibilité cognitive, « utilisable fatigué »).

### Testing standards

- **Vitest + RTL/jsdom** ; co-localiser les `.test.tsx`.
- **Gate de conformité** : `ALLERGENES_UE.length === 14` (test explicite — couvre ≥14 allergènes UE déclarables).
- Tester la **distinction allergie/non-aimé** : l'étape allergènes rend ⚠ + classe `danger`, l'étape non-aimés rend l'accent — pas de couleur danger.
- Tester le **mapping** `versRestrictions` (trim, dédup, seuil global recopié) en isolation si extrait, sinon via le parcours `AssistantRestrictions`.

### Definition of Done manuelle (utilisateur, hors agent)

1. `npx prisma db push` déjà fait (table `Restriction` créée en 3.2a).
2. Ouvrir `/p/{token}` → « Déclarer mes restrictions » → étape 1 choisir « Végétarien » → étape 2 cocher « Arachides » (rouge ⚠) + ajout libre → étape 3 ajouter « Champignons », régler le curseur → Valider.
3. Vérifier en DB (`prisma studio`) : 1 `REGIME` Végétarien, 1 `ALLERGIE` Arachides (+ l'ajout libre), 1 `NON_AIME` Champignons avec `seuilTolerance` = valeur du curseur ; `Participant.statut = REPONDU`.
4. Vérifier au clavier + (si possible) lecteur d'écran : l'étape allergies est nettement distincte de l'étape non-aimés ; le curseur annonce un libellé, pas un chiffre.

### Project Structure Notes

- **Nouveaux** : `src/lib/restrictions.ts` (+ test), `src/components/ui/QuickSelect.tsx` (+ test), `src/components/ui/ToleranceSlider.tsx` (+ test), `src/components/participant/EtapeRegime.tsx`, `EtapeAllergenes.tsx`, `EtapeNonAimes.tsx` (+ tests).
- **Modifié** : `src/components/participant/AssistantRestrictions.tsx` (type `DonneesRestrictions`, `versRestrictions`, état mutable, rendu des étapes) + son test.
- **Aucune** modif du router `participant`, du schéma Prisma, ni de migration. Aucune nouvelle dépendance.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 3.2] (énoncé, AC, distinction allergie/non-aimé, note découpage)
- [Source: _bmad-output/planning-artifacts/ux-designs/.../DESIGN.md#Components] (quick-select, chip, tolerance-slider, palette danger/accent/safe)
- [Source: _bmad-output/planning-artifacts/ux-designs/.../EXPERIENCE.md#Component Patterns / Voice and Tone] (curseur unique « pas de chiffre », ton allergies posé)
- [Source: _bmad-output/planning-artifacts/prds/.../prd.md] (3 étapes : régime/allergies/non-aimés + seuil ; 14 allergènes UE)
- [Source: _bmad-output/implementation-artifacts/3-2a-assistant-restrictions-coquille.md] (coquille, `DonneesRestrictions`, `versRestrictions`, Review Findings résolus ici : drift seuil, trim, dédup)

## Dev Agent Record

### Agent Model Used

claude-opus-4-8 (bmad-dev-story)

### Debug Log References

- Suite complète : **103/103** ✅ (83 → 103, +20). `lint` ✅ · `typecheck` ✅ · `SKIP_ENV_VALIDATION=1 build` ✅ (`/p/[token]` = 4.77 kB).
- 1 échec transitoire corrigé : `ToleranceSlider.test.tsx` — à `valeur=0`, « Strict » apparaissait deux fois (libellé courant + extrémité gauche) → test des extrémités rendu avec une valeur médiane.
- `mode` retiré de `QuickSelect` : le régime étant passé en multi-select (décision produit), plus aucun usage `single` → prop devenue morte, supprimée.

### Completion Notes List

- ✅ **Données de référence** (`src/lib/restrictions.ts`) : `REGIMES_COURANTS`, `ALLERGENES_UE` (14, **gate de test** `length === 14`), `TOLERANCE_LABELS` (5 libellés, index 0-4 ⊂ borne serveur 0-5), `SEUIL_TOLERANCE_DEFAUT = 2`.
- ✅ **`QuickSelect`** (UI) : boutons-puces `aria-pressed`, `min-h-11` ; variante `danger` (allergènes) = `danger-soft`/`danger` + ⚠ **et** libellé (jamais la couleur seule, NFR8).
- ✅ **`ToleranceSlider`** (UI) : `input[range]`, affiche le **libellé en clair** (jamais le chiffre), `aria-valuetext` = libellé, extrémités étiquetées, clavier natif.
- ✅ **3 composants d'étape** : `EtapeRegime` (multi-select régimes), `EtapeAllergenes` (14 UE + ajout libre, ton posé + Banner ⚠, chips supprimables), `EtapeNonAimes` (ajout libre → chips accent, **curseur global affiché seulement s'il y a ≥1 non-aimé**).
- ✅ **`AssistantRestrictions` refondu** : `DonneesRestrictions` = `{ regimes[], allergenes[], nonAimes[], seuilNonAimes }` (résout le *drift* `seuilTolerance` de la revue 3.2a) ; état mutable + handlers ciblés ; `versRestrictions` **trim + rejet du vide + dédup `(type, valeur)`** (résout 2 reports de la revue 3.2a) ; multi-régime → N lignes `REGIME` ; seuil global recopié sur chaque `NON_AIME`.
- ✅ **Décision produit (2026-06-26)** : régime **multi-select** (cumul vegan + sans gluten). Le récap **3.3** devra lister N régimes.
- ✅ **Distinction allergie/non-aimé (AC4)** : allergies = danger + ⚠ + ton net ; non-aimés = accent + ton léger. Testé.
- ✅ **AC5 préservé** : aucune restriction obligatoire ; `versRestrictions([]) → []` toujours valide (test « tableau vide » conservé).
- **Aucune** modif du router/schéma/migration. **Aucune** nouvelle dépendance.
- **À faire par l'utilisateur (DoD)** : ouvrir `/p/{token}`, parcourir les 3 étapes avec sélections réelles, Valider → vérifier en DB N `REGIME` + N `ALLERGIE` + N `NON_AIME` (seuil = curseur) et `statut = REPONDU`.

### File List

**Nouveaux**
- `src/lib/restrictions.ts` + `restrictions.test.ts`
- `src/components/ui/QuickSelect.tsx` + `QuickSelect.test.tsx`
- `src/components/ui/ToleranceSlider.tsx` + `ToleranceSlider.test.tsx`
- `src/components/participant/EtapeRegime.tsx` + `EtapeRegime.test.tsx`
- `src/components/participant/EtapeAllergenes.tsx` + `EtapeAllergenes.test.tsx`
- `src/components/participant/EtapeNonAimes.tsx` + `EtapeNonAimes.test.tsx`

**Modifiés**
- `src/components/participant/AssistantRestrictions.tsx` (type `DonneesRestrictions`, `versRestrictions`, état mutable + handlers, rendu des 3 étapes)
- `src/components/participant/AssistantRestrictions.test.tsx` (+ parcours complet multi-régime + seuil global)

### Change Log

- 2026-06-26 : Story 3.2b implémentée — contenu des 3 étapes (régime multi-select, 14 allergènes UE + ajout libre, aliments non-aimés + curseur de tolérance global). Nouveaux composants UI `QuickSelect`/`ToleranceSlider`. Refonte de `DonneesRestrictions`/`versRestrictions` (résout drift seuil + trim + dédup de la revue 3.2a). Tests 103/103, lint/typecheck/build verts. Statut → review.

## Questions ouvertes (revue post-rédaction)

- **Régime simple vs multiple ?** ✅ **Tranché le 2026-06-26 : MULTI-SELECT** (`regimes: string[]`). Un participant peut cumuler plusieurs régimes (vegan + sans gluten). Intégré aux ACs 1 & 6, au type `DonneesRestrictions`, à `versRestrictions` et à `EtapeRegime`. Impact à répercuter dans le récap **story 3.3** (lister N régimes).
- **Seuil global vs par aliment ?** L'UX impose un curseur global (retenu). Si tu voulais un seuil *par* aliment non-aimé, ce serait un autre design (slider par chip) — non retenu, conforme à EXPERIENCE.md.
