---
title: CookWho — Identité visuelle
status: final
created: 2026-06-19
updated: 2026-06-19
sources:
  - prd: ../../prds/prd-CookWho-2026-06-19/prd.md
  - brief: ../../briefs/brief-CookWho-2026-06-07/brief.md
colors:
  background: "#FBF4EC"
  surface: "#FFFFFF"
  surface-muted: "#F2E9DD"
  primary: "#EF9F27"
  primary-strong: "#854F0B"
  primary-soft: "#FAEEDA"
  accent: "#BA7517"
  accent-soft: "#FAEEDA"
  safe: "#5DCAA5"
  safe-text: "#04342C"
  safe-soft: "#E1F5EE"
  danger: "#E24B4A"
  danger-strong: "#791F1F"
  danger-soft: "#FCEBEB"
  text-primary: "#2C2C2A"
  text-secondary: "#5F5E5A"
  text-on-primary: "#633806"
  border: "#E0D4C2"
typography:
  font-display: "Nunito"
  font-body: "Nunito"
  weight-regular: 400
  weight-medium: 600
  weight-bold: 700
rounded:
  sm: "8px"
  md: "10px"
  lg: "16px"
  pill: "999px"
spacing:
  base: "4px"
  scale: [4, 8, 12, 16, 24, 32, 48]
components: [button, input, quick-select, chip, recipe-card, participant-row, stepper, tolerance-slider, banner, safe-badge]
---

# CookWho — Identité visuelle

## Brand & Style

CookWho, c'est un **minimalisme chaleureux, doux et rassurant**. L'app doit donner envie (cuisine, partage) tout en rassurant immédiatement (la sécurité des allergies). Le ton visuel : épuré, aéré, jamais corporate ni clinique.

- **Direction retenue : « Cocon »** — abricot doux + sauge, sur un fond crème chaud. Calme, réconfortant, accueillant.
- **Personnalité :** réconfortant, accueillant, léger. On rassure, on n'impressionne pas.
- **Ludique sans enfantin :** la légèreté passe par les coins arrondis, la palette douce, de petites illustrations/pictos (légumes, ustensiles) et un ton complice — pas par de la surcharge.
- **La sécurité se voit :** les états « sûr / pris en compte » (sauge) et les avertissements allergènes (rouge) ont un traitement visuel clair et constant (voir Components).

## Colors

Palette crème et chaude. L'abricot est la couleur d'action ; la sauge (teal doux) porte la réassurance (« pris en compte / compatible ») ; le rouge est réservé aux avertissements allergènes.

| Rôle | Token | Hex |
|---|---|---|
| Fond de page | `background` | `#FBF4EC` |
| Surface (cartes) | `surface` | `#FFFFFF` |
| Surface atténuée | `surface-muted` | `#F2E9DD` |
| Primaire (action) | `primary` | `#EF9F27` |
| Primaire fort (hover/texte) | `primary-strong` | `#854F0B` |
| Primaire doux (fonds) | `primary-soft` | `#FAEEDA` |
| Accent (goûts / ingrédient gênant) | `accent` | `#BA7517` |
| Accent doux | `accent-soft` | `#FAEEDA` |
| Sûr / pris en compte (fond) | `safe` | `#5DCAA5` |
| Sûr (texte) | `safe-text` | `#04342C` |
| Sûr doux (fond) | `safe-soft` | `#E1F5EE` |
| Danger / allergène (texte/bord) | `danger` | `#E24B4A` |
| Danger fort | `danger-strong` | `#791F1F` |
| Danger doux (fond) | `danger-soft` | `#FCEBEB` |
| Texte principal | `text-primary` | `#2C2C2A` |
| Texte secondaire | `text-secondary` | `#5F5E5A` |
| Texte sur primaire | `text-on-primary` | `#633806` |
| Bordure | `border` | `#E0D4C2` |

**Règles :** le rouge `danger` ne sert *qu'*aux allergènes / avertissements de sécurité, jamais en décoration. La sauge `safe` ne sert qu'aux confirmations « pris en compte / compatible ». L'abricot `primary` étant clair, le texte des boutons primaires est foncé (`text-on-primary`). `[ASSUMPTION: V1 en mode clair uniquement ; mode sombre différé.]`

## Typography

- **Police :** Nunito (sans-serif arrondie, chaleureuse, très lisible). Display et corps partagent la même famille pour la simplicité. `[ASSUMPTION: Nunito comme défaut Google Fonts, à confirmer.]`
- **Échelle :** Titre 24px/700 · Sous-titre 18px/700 · Corps 16px/400 · Petit 14px/400 · Label 13px/600.
- **Interligne corps :** 1.6. Lisibilité « même fatigué » prioritaire.
- **Casse :** phrase (sentence case) partout. Jamais de TOUT EN MAJUSCULES.

## Layout & Spacing

- **Échelle d'espacement :** 4 / 8 / 12 / 16 / 24 / 32 / 48.
- **Aéré par défaut :** marges généreuses, peu d'éléments par écran (un objectif par étape côté participant).
- **Largeur de contenu :** colonne unique centrée ; côté participant pensé mobile d'abord (lien ouvert sur téléphone).

## Elevation & Depth

Design plat. Pas d'ombres décoratives ni de dégradés. La hiérarchie naît des surfaces blanches sur fond crème, des bordures fines (`border`) et de l'espace. Ombres réservées, le cas échéant, aux superpositions fonctionnelles (modale d'avertissement allergie).

## Shapes

- **Coins arrondis et généreux** (md 10px sur les éléments, lg 16px sur les cartes, pill 999px sur les chips/badges) — porteurs du côté amical.
- **Pictos / illustrations** au trait doux, arrondis, cohérents avec la typo.

## Components

- **Button**
  - *Primaire :* fond `primary` (abricot), texte foncé `text-on-primary`, radius md, gras 600 ; hover `primary-strong`. (ex. « Voir les recettes », « Valider »).
  - *Secondaire :* contour `border`, texte `text-primary`, fond transparent ; hover fond `surface-muted`.
  - *Texte/lien :* `primary-strong`, souligné au survol.
- **Input** — champ 44px, bord `border`, radius md, focus anneau `primary`. Labels clairs au-dessus.
- **Quick-select** — boutons-puces cliquables pour régimes/allergies courants (sélection rapide) : non sélectionné = contour ; sélectionné = fond `primary-soft` + bord `primary` + ✓. Allergènes sélectionnés = fond `danger-soft` + bord `danger`.
- **Chip** — étiquette d'une restriction saisie (pill). Visuellement distinctes : allergie en `danger`, régime en `safe`, aliment non-aimé en `accent`.
- **Recipe-card** — carte blanche : titre du plat, accès aux ingrédients, et le cas échéant les **ingrédients gênants signalés** (en dégradation) en `accent`/badge. Bouton « Choisir ».
- **Participant-row** — ligne : prénom + statut (a répondu = badge `safe` ✓ / en attente = puce `text-secondary`) + action (copier le lien / renvoyer).
- **Stepper** — indicateur de progression 3 étapes (Régime → Allergies → Goûts) côté participant.
- **Tolerance-slider** — curseur strict ↔ souple pour les aliments non-aimés. Extrémités étiquetées clairement.
- **Banner** — bandeau contextuel : *info* (`primary-soft`) pour la génération forcée / explications ; *danger* (`danger-soft` + bord `danger`) pour l'avertissement allergie.
- **Safe-badge** — pastille « ✓ pris en compte » / « compatible » : fond `safe`, texte `safe-text`, pill. Élément de confiance récurrent.

## Do's and Don'ts

- ✅ Garder un seul objectif clair par écran côté participant.
- ✅ Réserver le rouge aux allergènes/sécurité ; la sauge aux confirmations.
- ✅ Utiliser les illustrations/pictos pour réchauffer, avec parcimonie.
- ❌ Pas de dégradés, d'ombres décoratives, de surcharge visuelle.
- ❌ Ne jamais banaliser un avertissement allergène (pas de gris, pas de discret).
- ❌ Pas de jargon ni de ton corporate ; rester simple et complice.
