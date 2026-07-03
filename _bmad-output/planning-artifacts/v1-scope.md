---
status: 'draft'
createdAt: '2026-07-03'
author: 'Philippe Zeganath'
theme: 'De la démo au produit de confiance'
inputs:
  - _bmad-output/planning-artifacts/epics.md (Epics 6/7/8 backlog V2)
  - MVP déployé en production (cookwho.fr)
  - Bugs de production corrigés post-MVP
---

# CookWho — Scope V1 (proposition)

## Contexte

Le **MVP est déployé** sur cookwho.fr (Vercel + Neon + Resend) et prouve le
parcours complet : créer un repas → inviter → déclarer ses restrictions →
générer un plat sûr. Plusieurs correctifs de prod ont déjà été livrés
(organisateur = convive, restrictions partagées sur tous ses repas, retrait
d'un participant, génération via bibliothèque locale de secours).

Trois fragilités bloquent un partage large en confiance :

1. **Le moteur de recettes est sur une roue de secours** — `recettesLocales`
   (~50 plats codés en dur), car le scraper Marmiton d'origine est cassé. C'est
   le facteur limitant de la valeur : dès 2-3 contraintes, la génération répond
   « rien ne correspond ».
2. **Pas de vitrine publique** — cookwho.fr tombe directement sur l'app ; un
   visiteur non connecté ne comprend pas le produit et ne trouve pas la connexion.
3. **Gestion repas encore rugueuse** — refresh manuel, pas d'édition de
   participant, lien d'invitation masqué.

## Thème V1

**« De la démo au produit de confiance »** — ce qu'il faut pour oser inviter de
vraies tablées, pas seulement tester soi-même.

## Périmètre V1

### Pilier 1 — Source de recettes durable (Epic 9) 🔴 (bloquant)

Remplacer la bibliothèque locale de secours (~50 recettes) par un **pool
statique, durable et en français de 200-300 plats**. Décision actée en party
mode (Winston/architecte, Amelia/dev, John/PM, Sally/UX) — cf. `epics.md` Epic 9.

- **Abandon du scraping live** (fragile par nature) au profit d'un **pool
  statique importé**. Pas de dépendance runtime à un site tiers, pas d'API LLM
  au runtime.
- **Source : Wikibooks Cookbook FR** (fr.wikibooks.org, CC-BY-SA 4.0) complétée
  par une **curation maison** ; préparation (étapes) affichée dans l'app.
- **Stockage** : table Postgres `RecetteSeed` (préparation en texte long) +
  artefact **NDJSON versionné dans Git** comme input du seed (traçabilité &
  revue d'attribution en diff de PR). `RecetteBrute` reste ce que `/core`
  consomme ; préparation/attribution vivent dans une couche présentation séparée
  (`RecettePresentation`).
- **3 stories, ordre non négociable** : 9.1 (socle données + contrat
  d'attribution) → 9.2 (pipeline d'ingestion Wikibooks) → 9.3 (curation maison
  jusqu'à la cible ; retire `recettesLocales.ts`).
- **Effort** : 3-5 journées, coût dominant éditorial (9.3).
- ⚠️ **Verrou juridique** (avant déploiement public de 9.2) : faire valider par
  quelqu'un de qualifié en droit que crédit + mention de licence + lien source +
  lien historique des auteurs suffisent comme attribution CC-BY-SA, et que les
  mentions légales portent l'obligation de partage à l'identique (SA). Validation
  possible **en parallèle** du dev — bloque le déploiement, pas le développement.

### Pilier 2 — Entrée publique & marque 🔴

- **6.1** Logo CookWho + favicon (palette Cocon).
- **6.2** Page vitrine publique sur cookwho.fr (proposition de valeur, aperçu
  du parcours ; orga connecté redirigé vers « Mes repas »).
- **6.3** Bouton « Se connecter » visible dans le header de la vitrine.

### Pilier 3 — Gestion repas sans friction 🟠

- **7.2** Liste des participants en temps réel (sans refresh manuel).
- **7.3** Éditer un participant (prénom, email) + info « invitation à renvoyer »
  si l'email change.
- **7.4** Afficher le lien d'invitation complet (`/p/{token}`) en clair.
- **7.5** Email de confirmation après création d'un repas (réutilise Resend).

### Pilier 4 — Comptes email + mot de passe 🟠

- **6.4** Connexion par email + mot de passe, en **complément** (pas en
  remplacement) du lien magique (orga) et du token d'invitation (participant).
  Mots de passe hashés.
- ⚠️ **Prérequis** : décision d'architecture Auth.js AVANT implémentation —
  coexistence des trois modes d'accès, impact sur NFR4 (lien participant
  non-devinable). À traiter via `bmad-create-architecture` en tête d'epic.

### Pilier 5 — Cohérence visuelle ciblée 🟡

- **8.1 (réduit)** Pass de polish sur les 5 écrans clés (accueil/vitrine, mes
  repas, création de repas, assistant participant, liste des recettes). Audit +
  ajustements espacement/hiérarchie/cohérence des composants — **pas** une
  refonte totale.

## Hors périmètre V1 → V2

- **7.1** Refonte du sélecteur calendrier/horaire (confort, non bloquant).
- **8.1 « total »** Refonte design de l'ensemble du site (on se limite aux 5
  écrans clés en V1).
- Historisation/statistiques des repas passés, notifications, multi-langue.

## Décisions & risques

| Sujet | État | Note |
|---|---|---|
| Source de recettes | ✅ Actée : pool statique Wikibooks + curation (Epic 9) | Verrou juridique CC-BY-SA avant déploiement de 9.2 |
| Comptes mot de passe (6.4) | ✅ Dans la V1 | Bloqué par décision d'archi Auth.js (prérequis) |
| Refonte design | Réduite aux 5 écrans clés | Éviter le trou sans fond |

## Prochaines étapes suggérées

1. **Trancher l'architecture Auth.js** pour 6.4 (`bmad-create-architecture`).
2. **Formaliser** ce scope dans `epics.md` : re-libeller les stories retenues
   (Epics 6/7 sélectionnés, 8.1 réduit, **Epic 9**) de « V2 — backlog » vers
   « V1 ». Epic 9 et ses 3 stories existent déjà — rien à créer côté source.
3. **Sprint planning** de la V1 (`bmad-sprint-planning`).
