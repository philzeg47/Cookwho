---
title: "Addendum technique — PRD CookWho"
status: final
created: 2026-06-19
updated: 2026-06-19
---

# Addendum technique — CookWho

Détails de « comment » sortis du PRD (qui décrit le « quoi ») et destinés à l'étape architecture. Issus de la session de brainstorming et des décisions du PRD.

## Couche allergènes interne (soutient FR-13)

- **Mécanisme :** dictionnaire maison `ingrédient → allergènes/dérivés` (ex. arachide → huile d'arachide, cacahuète, traces), appliqué au texte libre des ingrédients d'une recette.
- **Couverture cible :** au moins les 14 allergènes réglementaires UE.
- **Règle :** « dans le doute, on exclut » — ingrédient ambigu/inconnu = potentiellement allergène.
- **Indépendance :** ne dépend pas de l'étiquetage de la source ; la sécurité est dans le moteur CookWho, pas importée.

## Source de recettes (soutient FR-14)

- **Amorçage :** `marmiton-api` — scraper non-officiel (npm, JS/TS, côté serveur). Renvoie les ingrédients en texte brut, sans allergènes ni quantités séparées.
  - ✅ Gratuit, immédiat, filtres intégrés, idéal pour amorcer un MVP.
  - ⚠️ Pas d'allergènes, texte libre, non-officiel, licence non précisée (zone grise + fragile).
- **Architecture :** interface d'abstraction `SourceDeRecettes` + cache local. Si `marmiton-api` casse ou doit être abandonné (légal), on branche une autre source sans réécrire le moteur.
- **Implication moteur :** le moteur consomme une interface stable, jamais la source concrète.

## Pistes parquées héritées du brief

- **Retour post-repas in-app** (mesure de SM-1) — hors V1, cf addendum du brief.
- **Repas modulaire** (base commune + variantes) — recours possible quand le mur est impossible ; différé post-V1 (cf §6.2, NOTE FOR PM).
