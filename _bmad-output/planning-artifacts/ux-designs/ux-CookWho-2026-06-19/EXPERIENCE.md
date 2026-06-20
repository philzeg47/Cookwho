---
title: CookWho — Expérience
status: final
created: 2026-06-19
updated: 2026-06-19
sources:
  - prd: ../../prds/prd-CookWho-2026-06-19/prd.md
  - brief: ../../briefs/brief-CookWho-2026-06-07/brief.md
  - design: ./DESIGN.md
---

# CookWho — Expérience

> L'identité visuelle (couleurs, typo, composants) vit dans [DESIGN.md](./DESIGN.md) ; ce document référence ses tokens via `{path.to.token}`. En cas de conflit avec une maquette, les deux spines font foi.

## Foundation

- **Forme :** application **web**. Côté organisateur : navigateur desktop ou mobile (compte léger). Côté participant : page web ouverte depuis un lien reçu par message — **pensée mobile d'abord**.
- **Pas de système UI tiers** : identité propre définie dans DESIGN.md.
- **Deux univers étanches :** l'organisateur voit et choisit les recettes ; le participant ne voit *jamais* les recettes (FR-15). Toute l'expérience préserve cette frontière.
- **Principe directeur :** « la simplicité ou la mort » — un objectif clair par écran, surtout côté participant (cible profil < 2 min).

## Information Architecture

**Côté organisateur** (avec compte) :
1. Connexion / inscription (compte léger).
2. Mes repas (accueil, liste).
3. Créer un repas (lieu, date, heure).
4. Détail du repas (participants, état des réponses, ajout, liens d'invitation).
5. Recettes proposées (liste 3-10, régénérer, dégradation, échec explicatif, génération forcée, avertissement allergie + validation).
6. Détail d'une recette (ingrédients, choix).

**Côté participant** (sans compte, via lien) :
1. Page perso (prénom pré-rempli, contexte du repas).
2. Étape 1 — Régime. → 3. Étape 2 — Allergies. → 4. Étape 3 — Aliments non-aimés + seuil de tolérance.
5. Récap + confirmation de prise en compte.
6. Retour via le même lien pour modifier.

*Clôture des surfaces : chaque besoin du PRD aboutit à un écran, chaque écran sert un parcours (validé).*

## Voice and Tone

Chaleureux, simple, complice — jamais corporate. On parle comme un ami qui rassure, pas comme un formulaire. **Exception : sur la sécurité (allergies), le ton se fait clair et net, jamais désinvolte.**

- **Accueil participant :** « Sami t'invite à déjeuner 🍽️ Dis-nous ce qui n'est pas pour toi, ça prend 2 minutes. »
- **Confirmation (participant) :** « ✓ C'est pris en compte. Sami ne choisira que des plats qui te conviennent. » *(rassure sans dévoiler le menu — FR-7)*
- **Étape allergies :** ton plus posé — « Tes allergies : on ne plaisante pas avec ça. Sélectionne tout ce qui te concerne. »
- **Avertissement allergie (organisateur) :** direct et responsabilisant — « ⚠️ Léa a déclaré une allergie. Vérifie bien les ingrédients avant de valider ce plat. » *(FR-16)*
- **Échec explicatif (organisateur) :** utile, pas culpabilisant — « Aucun plat ne convient à tout le monde : l'allergie X de Léa et le régime Y de Paul ne laissent pas d'option commune. Tu peux envisager un repas en plusieurs versions. » *(FR-11)*
- **Génération forcée :** transparent — « 2 invités n'ont pas répondu. Les plats proposés ne tiennent pas compte d'eux. » *(FR-12)*
- **Micro-copies :** courtes, à la 2e personne, un emoji bien placé, jamais de jargon.

## Component Patterns (comportemental)

*(Specs visuelles dans DESIGN.md → Components.)*

- **Quick-select** ({components.quick-select}) — toucher pour (dé)sélectionner ; les choix courants en premier, recherche/ajout libre en dessous. Sélection immédiate, pas de validation intermédiaire.
- **Tolerance-slider** ({components.tolerance-slider}) — un seul curseur pour les aliments non-aimés : « strict » (je respecte tout) ↔ « souple » (je suis flexible). Valeur lisible en clair, pas de chiffre.
- **Recipe-card** ({components.recipe-card}) — révèle les ingrédients à la demande ; en dégradation, les ingrédients gênants sont signalés ({colors.accent}) avec mention de qui ils gênent.
- **Participant-row** ({components.participant-row}) — statut répondu/en attente toujours visible ; action « copier le lien » en un geste, et « envoyer par email » si email connu.
- **Safe-badge** ({components.safe-badge}) — réutilisé partout où il faut rassurer : confirmation participant, et côté orga « X plats compatibles avec tout le groupe ».
- **Banner** ({components.banner}) — info (génération forcée, explications) en {colors.primary-soft} ; danger (allergie) en {colors.danger-soft}.

## State Patterns

- **Chargement (génération) :** état d'attente court (cible < 5 s) avec message léger (« On cherche des plats pour tout le monde… »).
- **Vide — pas encore de repas :** accueil orga invite à créer le premier repas.
- **En attente de réponses :** le détail du repas montre la progression (X/Y ont répondu) ; la génération est possible mais signale les manquants (FR-12).
- **Succès — recettes trouvées :** liste 3-10, safe-badge « compatibles avec tout le groupe ».
- **Dégradation (curseur) :** ≥3 plats, ingrédients gênants signalés, message expliquant que les goûts ne sont pas tous satisfaits (le mur reste, lui, garanti — FR-10).
- **Échec dur (mur impossible) :** pas de liste ; message explicatif nommant les contraintes en conflit (FR-11).
- **Avertissement allergie :** bandeau/modale danger avant validation d'un plat quand une allergie existe (FR-16).
- **Confirmation participant :** récap complet + safe-badge (FR-7).

## Interaction Primitives

- **Assistant 3 étapes** (participant) avec stepper {components.stepper} ; retour en arrière possible, progression sauvegardée.
- **Régénérer** : recharge une autre sélection de plats (FR-9), dans la mesure du possible.
- **Copier le lien / envoyer par email** : double mode de diffusion d'invitation (FR-3), feedback « lien copié ✓ ».
- **Modifier ses restrictions** : rouvrir le lien réaffiche et permet l'édition (FR-8).
- **Valider un plat** : action finale orga, précédée de l'avertissement allergie si applicable.

## Accessibility Floor

- Contraste texte conforme (voir DESIGN.md ; vérifier `text-primary`/`text-secondary` sur `background` et `surface`).
- **La sécurité ne repose jamais sur la seule couleur :** allergènes et confirmations portent toujours une icône + un libellé texte, pas seulement le rouge/vert (daltonisme).
- Cibles tactiles ≥ 44px (participant mobile).
- Parcours participant entièrement utilisable au clavier et compatible lecteur d'écran ; libellés explicites sur quick-select et slider.
- Langage simple, phrases courtes — accessibilité cognitive, « utilisable fatigué ».

## Key Flows

**Flow A — Sami obtient des plats sûrs (UJ-1).**
Sami se connecte → crée un repas (lieu/date/heure) → ajoute 5 collègues (prénoms) → copie/envoie les liens → suit les réponses arriver (X/Y) → **climax : il lance la génération et voit 3-10 plats marqués « compatibles avec tout le groupe »**, sans avoir rien arbitré → si une allergie existe, il reçoit l'avertissement et valide en conscience → choisit son plat, tranquille.

**Flow B — Léa déclare et repart rassurée (UJ-2).**
Léa ouvre le lien sur son téléphone → page à son prénom, « Sami t'invite » → Étape Régime → Étape Allergies (ton plus posé) → Étape Aliments non-aimés + curseur de tolérance → **climax : récap complet + « ✓ pris en compte, Sami ne choisira que des plats qui te conviennent »** → elle ferme, sereine, sans avoir vu le menu ni créé de gêne. Elle pourra rouvrir le lien pour ajuster.

## Safety & Reassurance patterns *(spécifique CookWho)*

La confiance est le pilier produit ; ces motifs sont transverses et non négociables :
- **Transparence côté participant :** toujours montrer le récap de ce qui a été pris en compte (la confiance naît du visible, pas d'une promesse).
- **Réassurance sans fuite :** rassurer le participant sans jamais lui montrer le menu (frontière étanche).
- **Double rempart côté organisateur :** sécurité algorithmique (exclusion) + avertissement humain explicite sur les allergies (FR-13 + FR-16).
- **Honnêteté des limites :** la génération forcée et l'échec dur disent clairement ce qui n'est pas couvert, plutôt que de masquer.

## Responsive & Platform

- **Participant : mobile d'abord** (lien ouvert depuis un message). Colonne unique, gros boutons, stepper compact.
- **Organisateur : web responsive** — confortable sur desktop (gestion de repas, liste de recettes) et utilisable sur mobile.
- App mobile native : hors V1 (vision).
