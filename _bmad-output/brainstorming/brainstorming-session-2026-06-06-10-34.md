---
stepsCompleted: [1, 2, 3, 4]
session_active: false
workflow_completed: true
inputDocuments: []
session_topic: 'CookWho — application d''organisation de repas de groupe en 3 phases (création de groupe, saisie des restrictions alimentaires, génération de plats compatibles à partir de sites de recettes existants comme Marmiton, Cuisine AZ, 750g)'
session_goals: 'Générer des idées de fonctionnalités, des solutions aux défis techniques (notamment la phase 3 : agrégation/filtrage de recettes externes), et des cas d''usage'
selected_approach: 'ai-recommended'
techniques_used: ['What If Scenarios', 'Role Playing', 'First Principles Thinking']
ideas_generated: 15
context_file: ''
---

# Résultats de la session de brainstorming

**Facilitateur :** Philippe
**Date :** 2026-06-06

## Aperçu de la session

**Thème :** CookWho — application d'organisation de repas de groupe, articulée en 3 phases :
1. Création d'un groupe de convives
2. Saisie des restrictions alimentaires de chaque invité
3. Génération de plats compatibles avec toutes les restrictions, les recettes provenant de sites existants (Marmiton, Cuisine AZ, 750g…)

**Objectifs :**
- Idées de fonctionnalités (sur l'ensemble du parcours)
- Solutions aux défis techniques (en particulier la phase 3 : récupération et filtrage fiable/légal des recettes externes)
- Cas d'usage et situations limites

### Configuration de la session

_Portée : les 3 phases, avec une attention particulière au moteur de génération (phase 3), cœur différenciant du produit._

## Sélection des techniques

**Approche :** Techniques recommandées par l'IA

**Séquence retenue :**
- **What If / Scénarios hypothétiques** (créative) → ouvrir le champ des fonctionnalités
- **Jeu de rôles / Perspectives des parties prenantes** (collaborative) → faire émerger les cas d'usage
- **Pensée par premiers principes** (créative/profonde) → casser le défi technique de la phase 3

**Justification :** chaque technique cible un objectif distinct de la session, du plus divergent au plus convergent.

## Idées générées

### Technique 1 — What If / Scénarios hypothétiques

**[Fonctionnalités #1] — « Dis-le, c'est noté »**
- *Concept :* L'invité énonce ses contraintes à l'oral et l'IA les structure en restrictions exploitables.
- *Nouveauté :* Zéro formulaire — supprime la friction de saisie.

**[Fonctionnalités #2] — « Par l'amour, pas par l'interdit »**
- *Concept :* L'invité déclare ses plats préférés ; CookWho en déduit le terrain de jeu et croise avec les contraintes des autres.
- *Nouveauté :* Inversion de l'UX — on part du plaisir, données positives plutôt qu'exclusions.

**[Logique produit #3] — « Le mur et le curseur »**
- *Concept :* Deux niveaux de contraintes — non-négociables (allergies, médical, religieux) = mur infranchissable ; préférences (goûts) = curseur négociable.
- *Nouveauté :* Hiérarchie explicite dans le moteur : la sécurité prime, le plaisir s'optimise ensuite.

**[Logique produit #4] — « La base commune comme filet de sécurité »**
- *Concept :* Le repas modulaire (base partagée + variantes) est le recours quand aucun plat unique ne convient à tous, pas le plan A systématique.
- *Nouveauté :* Dégradation élégante — l'app cherche d'abord le consensus, bascule en modulaire seulement si nécessaire.

**[Sécurité #5] — « Le filtre d'ingrédients gardien »**
- *Concept :* Analyse de la liste d'ingrédients complète et blocage auto des recettes contenant un allergène déclaré ou ses dérivés.
- *Nouveauté :* Sécurité algorithmique et systématique, pas basée sur la seule étiquette du site source.

**[Sécurité #6] — « L'organisateur, dernier rempart »**
- *Concept :* Avertissement explicite à l'organisateur pour les allergies graves ; il valide le plat avant envoi au groupe.
- *Nouveauté :* Human-in-the-loop sur le risque critique — responsabilité partagée.

### Technique 2 — Jeu de rôles / Perspectives des parties prenantes

**Persona : Sami, l'organisateur débordé**

**[Cas d'usage #7] — « Invitation sans friction »**
- *Concept :* Inviter ses convives en un geste (lien, QR, SMS) sans que les invités créent un compte ni téléchargent l'app.
- *Nouveauté :* Accès au profil via simple lien ; l'organisateur ne dépend pas de l'adoption par les autres.

**[Principe UX #8] — « La simplicité ou la mort »**
- *Concept :* Toute complexité = abandon immédiat ; l'app doit être utilisable fatigué, entre deux réunions.
- *Nouveauté :* La simplicité comme critère de survie, guidant chaque décision de design.

**[Cas d'usage #9] — « Profil express < 2 min »**
- *Concept :* Création du profil + saisie des restrictions en moins de 2 min via parcours guidé (boutons rapides + vocal).
- *Nouveauté :* Budget temps explicite comme objectif de design mesurable.

**Persona : Léa, l'invitée allergique sévère**

**[Confiance #10] — « Transparence des exclusions »**
- *Concept :* Quand Léa saisit son allergie, l'app affiche la liste complète des ingrédients exclus (allergène + dérivés + traces).
- *Nouveauté :* La confiance naît de la transparence visible, pas d'une promesse abstraite.

**[Tension UX #11] — « Rassurer sans dévoiler le menu »**
- *Concept :* L'invité ne voit pas les plats générés (réservés à l'organisateur) ; comment rassurer Léa sans lui montrer le menu ?
- *Nouveauté :* Arbitrage de design entre la vue invité et la vue organisateur.

**[Confiance #12] — « L'accusé de réception rassurant »**
- *Concept :* L'app confirme à Léa « ✓ ton allergie est prise en compte, l'organisateur ne choisira que des plats sûrs pour toi », sans dévoiler le menu ; côté organisateur, un badge « X plats compatibles avec tout le groupe ».
- *Nouveauté :* Résout la tension #11 — garantie pour l'invité, contrôle pour l'organisateur, sans fuite d'information.

### Technique 3 — Premiers principes (défi technique de la phase 3)

**Cadrage :** le vrai problème n'est pas « d'où viennent les recettes » mais « comment obtenir une liste d'ingrédients fiable pour garantir la sécurité ». 3 briques fondamentales : (1) réservoir de recettes, (2) liste d'ingrédients structurée/fiable, (3) étiquetage allergènes/régimes. Les sites externes ne couvrent que 1+2.

**Décision de direction :** utiliser des API (officielles ou non) pour les recettes.

**Évaluation de `marmiton-api` (https://sotrxii.github.io/marmiton-api/) :**
- Scraper non-officiel, paquet npm JS/TS, côté serveur. Renvoie ingrédients en texte brut, sans allergènes ni quantités séparées.
- ✅ Gratuit, immédiat, filtres intégrés, idéal pour amorcer un MVP.
- ⚠️ Pas d'allergènes, texte libre, non-officiel, licence non précisée (zone grise + fragile).

**[Technique #13] — « marmiton-api pour amorcer »**
- *Concept :* Utiliser le scraper npm non-officiel pour récupérer vite des recettes + ingrédients dès le MVP.
- *Nouveauté :* Démarrage sans accord officiel — vélocité maximale pour valider le concept.

**[Technique #14] — « La couche allergènes maison »**
- *Concept :* CookWho construit son propre dictionnaire ingrédient → allergènes/dérivés et l'applique au texte des ingrédients (filtre gardien #5).
- *Nouveauté :* La sécurité ne dépend d'aucune source externe — elle est dans le moteur CookWho.

**[Architecture #15] — « Source interchangeable + cache »**
- *Concept :* Couche d'abstraction entre CookWho et la source de recettes + cache local. Si marmiton-api casse, on branche une autre source sans tout réécrire.
- *Nouveauté :* La fragilité de la source est neutralisée par l'architecture — jamais prisonnier d'une source.

## Organisation et priorisation des idées

### Organisation thématique

**🟦 Thème A — Saisie sans friction** (l'invité ne sent jamais qu'il « utilise une app »)
- #7 Invitation sans compte · #9 Profil < 2 min · #1 Saisie vocale · #2 Par les plats préférés · #8 Simplicité = survie

**🟥 Thème B — Sécurité & confiance allergies** (le pilier non-négociable)
- #3 Le mur et le curseur · #5 Filtre d'ingrédients gardien · #14 Couche allergènes maison · #6 Organisateur dernier rempart · #10 Transparence des exclusions

**🟩 Thème C — Moteur de compatibilité** (trouver le consensus du groupe)
- #4 Base commune en filet de sécurité (+ le curseur #3 qui arbitre plaisir vs contrainte)

**🟨 Thème D — Architecture & sources de recettes**
- #13 marmiton-api pour amorcer · #15 Source interchangeable + cache · #14 (sécurité interne)

**🟪 Thème E — Frontière invité / organisateur**
- #11 Rassurer sans dévoiler le menu · #12 L'accusé de réception rassurant

**💎 Concepts breakthrough :** #2 (inversion par le plaisir) · #3 (mur & curseur, principe fondateur) · #15 (source jetable, valeur interne).

### Résultats de la priorisation (MVP)

| Priorité | Idées | Justification |
|---|---|---|
| 🥇 Cœur du MVP | #3, #5, #14, #7, #9, #13, #15 | Le minimum pour un produit sûr et utilisable : moteur de sécurité + onboarding fluide + source de recettes |
| 🥈 Quick wins | #10, #12, #8 | Faciles à ajouter, gros effet sur la confiance |
| 🥉 Plus tard / différenciants | #2, #1, #4 | Forte valeur mais demandent plus de travail (IA, modulaire) |

## Plan d'action

### Chantier 1 — Moteur de sécurité (Thème B) 🥇
- **Pourquoi :** c'est le pilier non-négociable de CookWho ; sans confiance, pas d'usage.
- **Prochaines étapes :**
  1. Lister les allergènes à couvrir (au moins les 14 allergènes réglementaires UE).
  2. Construire un dictionnaire « ingrédient → allergènes/dérivés » (ex. arachide → huile d'arachide, cacahuète, traces).
  3. Implémenter le filtre gardien (#5) + le modèle mur/curseur (#3 : dur vs négociable) avec la règle « en cas de doute, on exclut ».
- **Indicateur de succès :** 0 faux négatif sur un jeu de test de recettes piégées.

### Chantier 2 — Source de recettes (Thème D) 🥇
- **Pourquoi :** alimente le moteur ; à amorcer vite mais sans dépendance rigide.
- **Prochaines étapes :**
  1. Tester `marmiton-api` (spike technique : recherche + récupération d'ingrédients).
  2. Définir une interface d'abstraction `SourceDeRecettes` (#15) pour rendre la source interchangeable.
  3. Mettre en cache les recettes récupérées.
- **Indicateur de succès :** récupérer et mettre en cache N recettes filtrables, source remplaçable sans réécriture.

### Chantier 3 — Onboarding fluide (Thème A) 🥇
- **Pourquoi :** « la simplicité ou la mort » ; conditionne l'adoption par les invités.
- **Prochaines étapes :**
  1. Concevoir le parcours invité via lien partageable, sans création de compte (#7).
  2. Viser un profil + restrictions en < 2 min (#9) avec boutons rapides pour restrictions courantes.
  3. Plus tard : ajouter la saisie vocale (#1) et l'entrée par plats préférés (#2).
- **Indicateur de succès :** un invité teste le parcours en moins de 2 minutes, sans aide.

## Synthèse et enseignements

**Réalisations clés :**
- 15 idées générées et organisées en 5 thèmes, 3 chantiers MVP prioritaires définis.
- Une direction technique tranchée pour la phase 3 : API (marmiton-api pour amorcer) + couche de sécurité maison + architecture à source interchangeable.

**ADN de CookWho dégagé :**
- Friction zéro pour les invités (jamais le sentiment d'« utiliser une app »).
- La sécurité (allergies) est non-négociable et **maîtrisée en interne**, jamais déléguée à une source externe.
- Le plaisir s'optimise par-dessus la sécurité (le « mur et le curseur »).

**Décisions prises :**
- Utiliser des API (officielles ou non) comme source de recettes ; démarrer avec `marmiton-api`.
- Isoler la source derrière une couche d'abstraction + cache.
- La détection d'allergènes est un composant interne CookWho, pas une donnée importée.

**Prochaine étape BMAD recommandée :** rédiger le **Product Brief** (`bmad-product-brief`) en s'appuyant sur cette session.

