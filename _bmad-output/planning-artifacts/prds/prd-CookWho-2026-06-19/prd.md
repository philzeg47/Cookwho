---
title: CookWho
status: final
created: 2026-06-19
updated: 2026-06-19
---

# PRD : CookWho
*Titre de travail — à confirmer.*

## 0. Objet du document

Ce PRD s'adresse au PM (Philippe) et aux étapes BMAD aval — UX, architecture, épopées & stories. Il s'appuie sur le Product Brief CookWho (`_bmad-output/planning-artifacts/briefs/brief-CookWho-2026-06-07/brief.md`) qu'il prolonge sans le dupliquer. Le vocabulaire est ancré dans le Glossaire (§3) et utilisé tel quel partout ; les fonctionnalités sont regroupées avec des exigences numérotées globalement (FR-1 à FR-N, identifiants stables) ; les hypothèses sont taguées `[ASSUMPTION]` inline et rassemblées au §13. Les choix techniques (mécanisme de détection des allergènes, source de recettes) vivent dans l'addendum, destiné à l'architecture — pas ici.

## 1. Vision

CookWho est une application web qui aide à organiser des repas de groupe où **personne n'est laissé de côté**. Dès que des convives ont des contraintes alimentaires différentes — allergies, régimes, dégoûts — l'organisation vire au casse-tête : les contraintes se disent puis s'oublient, quelqu'un finit par ne pas manger, le malaise s'installe, et parfois l'organisateur renonce. CookWho devient l'endroit fiable où vivent les contraintes de tout le groupe et s'en sert pour proposer des plats que chacun peut manger.

Le produit repose sur un principe fondateur — **le mur et le curseur** : ce qui ne se négocie jamais (la sécurité : allergies, régimes fermes) est séparé de ce qui s'optimise (le plaisir : les goûts). La sécurité prime toujours et reste maîtrisée en interne, jamais déléguée à une source externe ; le plaisir se cherche ensuite. L'expérience est sans friction des deux côtés : l'organisateur obtient en quelques secondes des plats sûrs sans rien arbitrer ; le participant déclare ses contraintes une seule fois, sans compte, et repart rassuré.

Là où les apps de recettes filtrent pour un seul utilisateur, CookWho est le premier à traiter le repas comme un **problème de groupe**. C'est sa raison d'être, et le point de départ d'une ambition plus large : devenir, à terme, un assistant repas du quotidien — en groupe comme en solo. La promesse ne changera jamais : un repas qui convient à tous, la sécurité d'abord, le plaisir ensuite.

## 2. Utilisateurs cibles

### 2.1 Jobs To Be Done

**Organisateur (utilisateur principal V1) :**
- *Fonctionnel :* obtenir rapidement des plats compatibles avec tout mon groupe, sans avoir à recenser et croiser les contraintes moi-même.
- *Social :* recevoir sans que personne ne se sente mis à l'écart à table.
- *Émotionnel :* être tranquille — ne pas avoir fait un effort « pour rien », ne pas redouter le malaise.

**Participant :**
- *Fonctionnel :* déclarer mes contraintes une seule fois, vite, sans créer de compte ni installer d'app.
- *Social :* être sûr qu'on me prend en compte sans avoir à insister ni à créer de gêne.
- *Émotionnel (allergique sévère) :* avoir la preuve visible que ma contrainte vitale est prise au sérieux — la confiance avant le confort.

### 2.2 Non-utilisateurs (V1)

- **Le cuisinier solo** (préparer un repas pour soi) — relève de la vision, pas de la V1, qui est 100 % groupe.
- **Le participant « actif »/récurrent** — en V1 le participant reste passif (2 min via un lien) ; on ne cherche pas à le fidéliser ni à lui ouvrir un espace persistant.
- **L'utilisateur d'app mobile native** — la V1 est web (utilisable sur navigateur mobile) ; l'app native viendra plus tard.

### 2.3 Parcours utilisateurs clés

**UJ-1. Sami organise un déjeuner sans gérer le casse-tête des contraintes.**
- **Persona + contexte :** Sami, organisateur débordé, veut réunir 5 collègues autour d'un déjeuner sans que personne ne reste sur sa faim.
- **État d'entrée :** Sami a un compte organisateur léger ; il ouvre CookWho sur le web.
- **Parcours :**
  1. Il crée un **repas** et y renseigne les infos (lieu, date, heure) + ajoute ses **participants** (au moins un prénom, email optionnel).
  2. CookWho génère un **lien d'invitation** par participant ; Sami le diffuse au choix — envoi par email via CookWho, ou copie du lien qu'il transmet lui-même.
  3. Chaque participant **remplit ses restrictions** (voir UJ-2).
  4. Quand tout le monde a répondu, Sami **découvre les recettes proposées**, compatibles avec tout le groupe. Réalise UJ-1.
- **Climax :** une liste de plats sûrs pour tous s'affiche — Sami n'a rien eu à arbitrer lui-même.
- **Résolution :** il choisit un plat, l'esprit tranquille.
- **Cas limite :** si un participant ne répond jamais, Sami peut **forcer la génération** avec les réponses reçues. CookWho ne garantit alors la compatibilité que pour les participants ayant répondu (les manquants ne sont pas couverts — choix assumé, signalé à Sami).

**UJ-2. Léa déclare son allergie sévère en moins de deux minutes et repart rassurée.**
- **Persona + contexte :** Léa, participante de Sami, allergique sévère. L'enjeu pour elle n'est pas le confort mais la confiance.
- **État d'entrée :** elle reçoit le lien, clique — **pas de compte, pas d'app**. Elle arrive sur une **page personnelle déjà à son prénom** (saisi par Sami).
- **Parcours (guidé, multi-étapes) :**
  1. **Régime particulier** — sélection (végétarien, vegan, sans gluten…).
  2. **Allergies** — sélection.
  3. **Aliments non-aimés** — sélection, avec un **seuil de tolérance** (strict ↔ souple) qui pilote le curseur.
- **Climax :** à la validation, elle voit le **récapitulatif de tout ce qu'elle a sélectionné** + la **confirmation de prise en compte** (« ✓ pris en compte »). La confiance naît de cette transparence visible.
- **Résolution :** c'est enregistré ; elle ne voit jamais le menu. Elle peut **revenir modifier** ses restrictions via le même lien.

## 3. Glossaire

- **Organisateur** — utilisateur qui crée un repas, invite les participants et choisit le plat. Dispose d'un compte léger. Seul à voir les recettes proposées.
- **Participant** — invité d'un repas. Accède via un lien personnel sans compte ; déclare ses restrictions ; ne voit jamais les recettes.
- **Repas** — événement créé par un organisateur (lieu, date, heure) regroupant des participants. Unité autour de laquelle CookWho génère des recettes.
- **Lien d'invitation** — URL personnelle, propre à un participant d'un repas, donnant accès à sa page de saisie des restrictions (et à leur modification ultérieure).
- **Restriction alimentaire** — contrainte déclarée par un participant. Trois types : Régime, Allergie (→ le mur), Aliment non-aimé (→ le curseur).
- **Régime** — régime alimentaire ferme (végétarien, vegan, sans gluten…). Non-négociable (mur).
- **Allergie** — allergène à exclure absolument. Non-négociable (mur), enjeu de sécurité.
- **Aliment non-aimé** — aliment que le participant préfère éviter. Négociable selon son seuil de tolérance (curseur).
- **Seuil de tolérance** — réglage par participant (strict ↔ souple) déterminant à quel point CookWho respecte ses aliments non-aimés.
- **Le mur** — ensemble des contraintes non-négociables du groupe (régimes + allergies). Jamais franchi, même en dégradation.
- **Le curseur** — couche d'optimisation des goûts (aliments non-aimés), arbitrée selon les seuils de tolérance.
- **Recette / Plat** — proposition de plat principal issue d'une source de recettes, filtrée par le moteur de compatibilité.
- **Couche allergènes** — composant interne CookWho (dictionnaire ingrédient → allergènes/dérivés) qui détecte les allergènes dans la liste d'ingrédients d'une recette.
- **Source de recettes** — fournisseur externe de recettes + ingrédients, branché derrière une couche d'abstraction + cache (amorçage : `marmiton-api`).
- **Génération** — production par CookWho de la liste de recettes compatibles avec le groupe d'un repas.

## 4. Fonctionnalités

### 4.1 Gestion de repas & invitations

**Description :** l'organisateur crée un repas, y ajoute ses participants et leur diffuse un lien d'invitation personnel. Il suit qui a répondu. Réalise UJ-1 (étapes 1-2).

**Functional Requirements :**

#### FR-1 : Créer un repas
L'organisateur (compte léger) peut créer un repas en renseignant lieu, date et heure.
**Conséquences (testables) :**
- Un repas créé possède un identifiant unique et appartient à son organisateur.
- Lieu, date, heure sont enregistrés et réaffichés à l'organisateur.

#### FR-2 : Ajouter des participants
L'organisateur peut ajouter des participants à un repas, chacun avec au minimum un prénom (email optionnel).
**Conséquences (testables) :**
- Un participant peut être créé avec un prénom seul (sans email).
- Le prénom saisi est celui affiché sur la page personnelle du participant.

#### FR-3 : Générer et diffuser les invitations
Pour chaque participant, CookWho génère un lien d'invitation personnel que l'organisateur diffuse, au choix, par email (envoyé par CookWho) ou en copiant le lien pour le transmettre lui-même.
**Conséquences (testables) :**
- Chaque participant a un lien unique, non devinable.
- Si un email est renseigné, l'envoi par CookWho est proposé ; sinon, seule la copie du lien est proposée.

#### FR-4 : Suivre l'état des réponses
L'organisateur peut voir, par repas, quels participants ont rempli leurs restrictions et lesquels manquent.
**Conséquences (testables) :**
- L'état de chaque participant est visible (a répondu / n'a pas répondu).
- L'accès à la génération reflète cet état (voir FR-9 / FR-12).

### 4.2 Saisie des restrictions (participant)

**Description :** le participant ouvre son lien et déclare ses restrictions via un parcours guidé en trois étapes, sans créer de compte, puis reçoit une confirmation rassurante. Il peut revenir modifier. Réalise UJ-2. Le participant ne voit jamais les recettes.

**Functional Requirements :**

#### FR-5 : Accès sans compte via lien personnel
Le participant accède à sa page personnelle via son lien, sans création de compte ni installation ; la page est pré-remplie avec son prénom.
**Conséquences (testables) :**
- Ouvrir le lien n'exige aucune authentification.
- Le prénom affiché correspond à celui saisi par l'organisateur (FR-2).

#### FR-6 : Déclarer ses restrictions en trois étapes
Le participant déclare, dans l'ordre : (1) son régime (végétarien, vegan, sans gluten…), (2) ses allergies, (3) ses aliments non-aimés assortis d'un seuil de tolérance (strict ↔ souple).
**Conséquences (testables) :**
- Les trois types de restriction sont saisissables ; aucune n'est obligatoire (un participant sans contrainte peut valider).
- Le seuil de tolérance ne s'applique qu'aux aliments non-aimés (curseur), jamais aux régimes ni aux allergies (mur).
- Le parcours est conçu pour être bouclé en moins de deux minutes (voir NFR transverses).

#### FR-7 : Récapitulatif et confirmation de prise en compte
À la validation, le participant voit le récapitulatif complet de ses sélections et une confirmation explicite de prise en compte.
**Conséquences (testables) :**
- Le récapitulatif liste l'intégralité des restrictions saisies.
- La confirmation (« ✓ pris en compte ») n'apparaît qu'après enregistrement effectif.

#### FR-8 : Modifier ses restrictions
Le participant peut rouvrir son lien pour consulter et modifier ses restrictions.
**Conséquences (testables) :**
- Rouvrir le lien réaffiche les restrictions précédemment saisies.
- Une modification est prise en compte par les générations ultérieures.

### 4.3 Moteur de compatibilité (mur & curseur)

**Description :** cœur de CookWho. Le moteur croise les restrictions de tout le groupe, exclut sans exception le mur (régimes + allergies), puis optimise le curseur (aliments non-aimés selon les seuils). Réalise UJ-1 (étape 4 / climax). **Principe fondateur : la sécurité prime, le plaisir s'optimise ensuite — le mur n'est jamais franchi, même en dégradation.**

**Functional Requirements :**

#### FR-9 : Générer des recettes compatibles
Quand les participants ont répondu, l'organisateur peut générer une liste de **3 à 10 recettes de plats principaux** qui ne violent aucun mur du groupe et respectent les curseurs (quand aucune recette ne les satisfait tous, voir la dégradation FR-10). Il peut régénérer pour obtenir une autre liste. Réalise UJ-1.
**Conséquences (testables) :**
- Aucune recette proposée ne contient un allergène ou ne viole un régime déclaré par un participant couvert.
- La liste contient entre 3 et 10 recettes quand assez de plats compatibles existent.
- « Régénérer » produit une liste différente quand d'autres plats compatibles existent.

#### FR-10 : Dégradation élégante (curseur)
Quand aucune recette ne satisfait *tous* les curseurs du groupe, CookWho propose quand même **au moins 3 recettes** — celles qui froissent le moins de préférences — en signalant clairement les ingrédients gênants, à charge pour l'organisateur de substituer.
**Conséquences (testables) :**
- En dégradation, les ingrédients à l'origine du conflit de goût sont explicitement signalés sur chaque recette.
- **Aucune recette proposée en dégradation ne franchit le mur** (allergie / régime), même signalée.

#### FR-11 : Échec explicatif quand le mur est impossible
Quand aucune recette ne peut satisfaire tous les murs du groupe à la fois, CookWho n'affiche rien d'incompatible : il explique quelle(s) contrainte(s) bloque(nt), pour que l'organisateur puisse décider de la suite.
**Conséquences (testables) :**
- Le message identifie la ou les contraintes en conflit (ex. allergie de X + régime de Y).
- Aucune recette violant le mur n'est jamais proposée comme repli.

#### FR-12 : Génération forcée (réponses partielles)
L'organisateur peut forcer la génération avant que tous les participants aient répondu ; CookWho génère avec les réponses reçues et signale que les participants manquants ne sont pas couverts.
**Conséquences (testables) :**
- La génération forcée n'utilise que les restrictions des participants ayant répondu.
- Un avertissement nomme les participants non couverts.

### 4.4 Couche allergènes interne

**Description :** la détection des allergènes est un composant interne CookWho, indépendant des étiquettes des sources externes. C'est le garant de la sécurité (voir §8). *Le mécanisme (dictionnaire ingrédient → allergènes/dérivés) relève de l'architecture — détaillé dans l'addendum.*

**Functional Requirements :**

#### FR-13 : Détecter les allergènes d'une recette en interne
CookWho analyse la liste d'ingrédients d'une recette et en déduit les allergènes présents (dérivés et traces inclus), de façon indépendante de la source, en appliquant la règle « dans le doute, on exclut ».
**Conséquences (testables) :**
- Couvre au moins les 14 allergènes réglementaires UE.
- Un ingrédient ambigu ou inconnu est traité comme potentiellement allergène (exclusion par défaut).
- La détection ne dépend pas de l'étiquetage fourni par la source de recettes.

### 4.5 Source de recettes (abstraction + cache)

**Description :** CookWho récupère recettes et listes d'ingrédients auprès d'une source externe, branchée derrière une couche d'abstraction + cache pour rester interchangeable. *Amorçage avec `marmiton-api` — choix de source détaillé dans l'addendum (voir aussi §10).*

**Functional Requirements :**

#### FR-14 : Fournir des recettes via une source interchangeable
CookWho récupère des recettes (titre, ingrédients) via une source externe, en cache les résultats, et isole cette source derrière une abstraction permettant d'en changer sans réécrire le moteur.
**Conséquences (testables) :**
- Le moteur consomme les recettes via une interface stable, indépendante de la source concrète.
- Une recette déjà récupérée est servie depuis le cache sans nouvel appel à la source.

### 4.6 Présentation des recettes (organisateur)

**Description :** l'organisateur consulte la liste générée, voit les éventuels ingrédients signalés (en dégradation), et choisit un plat. Réalise UJ-1 (climax / résolution).

**Functional Requirements :**

#### FR-15 : Consulter la liste et choisir un plat
L'organisateur voit la liste de recettes générées (titre + accès aux ingrédients), avec signalement des ingrédients gênants le cas échéant, et peut sélectionner le plat retenu.
**Conséquences (testables) :**
- Chaque recette affiche au minimum son titre et permet d'accéder à sa liste d'ingrédients.
- Les ingrédients signalés en dégradation (FR-10) sont visuellement distingués.
- Seul l'organisateur accède à cette vue ; aucun participant n'y a accès.

#### FR-16 : Avertissement allergie & validation par l'organisateur
Lorsqu'un participant du repas a déclaré au moins une allergie, CookWho affiche à l'organisateur un avertissement explicite et lui demande de vérifier/valider le plat avant de le retenir (human-in-the-loop, responsabilité partagée — idée « dernier rempart »). `[ASSUMPTION: la V1 ne sous-classifie pas la gravité des allergies — toute allergie déclenche le garde-fou, pour éviter la friction d'une auto-évaluation peu fiable côté participant.]`
**Conséquences (testables) :**
- Si au moins une allergie existe dans le groupe, un avertissement est présenté avant la confirmation du plat.
- La validation explicite de l'organisateur est requise pour retenir le plat dans ce cas.
- L'avertissement complète la sécurité algorithmique (FR-13), il ne la remplace pas.

## 5. Non-objectifs (explicites)

- CookWho **n'est pas un site de recettes** : il s'appuie sur des sources existantes, il n'héberge pas son propre catalogue éditorial.
- CookWho **n'est pas un réseau social** ni une messagerie de groupe : pas de fil de discussion, pas de profils publics.
- CookWho **ne devient pas un outil de suivi nutritionnel** (calories, macros, équilibre alimentaire).
- CookWho **ne se substitue pas au jugement humain** sur les allergies graves : la sécurité algorithmique est doublée d'une validation de l'organisateur (FR-16), pas remplacée par elle.
- CookWho **ne gère pas la logistique du repas** (courses, quantités, budget) en V1.

## 6. Périmètre MVP

### 6.1 Dans le périmètre

- Application **web** (organisateur sur navigateur ; participant via lien).
- Création de repas + ajout de participants + génération/diffusion des liens d'invitation + suivi des réponses (F1).
- Saisie des restrictions par le participant en 3 étapes (<2 min), récap + confirmation, modification (F2).
- Moteur mur & curseur : génération 3-10 + régénération, dégradation élégante, échec explicatif, génération forcée (F3).
- Détection des allergènes en interne, ≥ 14 allergènes UE, « dans le doute on exclut » (F4).
- Source de recettes derrière abstraction + cache, amorçage `marmiton-api` (F5).
- Présentation des plats principaux à l'organisateur + avertissement/validation allergies (F6).

### 6.2 Hors périmètre MVP

- Menu complet entrée/plat/dessert — *V1 = plat principal seulement.*
- Génération de liste de courses.
- Application mobile native — *vision.*
- Saisie vocale des contraintes — *différé.*
- Entrée « par les plats préférés » — *différé.*
- Repas modulaire (base commune + variantes) — *différé.* `[NOTE FOR PM : filet de sécurité émotionnellement utile quand le mur est impossible ; à revisiter après V1.]`
- Retour post-repas in-app — *parqué (cf addendum du brief).*
- Comptes / espace persistant pour les participants.
- Sous-classification de la gravité des allergies.
- Règles de rétention / suppression RGPD (cf §12).
- Usage solo (cuisiner pour soi).

## 7. Métriques de succès

*Projet passion : succès jugé qualitativement en V1, pas de cible chiffrée de volume.*

**Primaires**
- **SM-1 : Repas réussis.** Des repas réellement organisés via CookWho, dont le groupe confirme *après coup* qu'ils convenaient à tous (personne mis à l'écart). Recueilli à la main auprès des testeurs en V1. Valide FR-9, FR-16.
- **SM-2 : Zéro faux négatif.** Sur un jeu de recettes « piégées » de test, **0 allergène manqué** — aucune recette dangereuse présentée comme sûre. Critère non-négociable, prime sur tout. Valide FR-13, FR-10.

**Secondaires**
- **SM-3 : Profil express.** Un participant boucle son profil **en moins de 2 min, sans aide**. Valide FR-6.
- **SM-4 : Les participants jouent le jeu.** Ils remplissent leur profil via le lien sans abandonner en route. Valide FR-5.

**Contre-métriques (à ne pas optimiser)**
- **SM-C1 :** ne pas optimiser le **nombre** de recettes proposées (FR-9) au détriment de la sécurité — mieux vaut 3 plats sûrs que 10 douteux. Contrebalance SM-1.
- **SM-C2 :** ne pas optimiser la **rapidité** du profil (SM-3) au point de pousser le participant à saisir des contraintes incomplètes ou imprécises. Contrebalance SM-3.

## 8. Garde-fous : sécurité allergènes

La sécurité est le pilier non-négociable de CookWho. Les garde-fous suivants priment sur toute autre considération (vélocité, richesse de l'offre, plaisir) :

- **Règle d'or : « dans le doute, on exclut ».** Tout ingrédient ambigu, inconnu, ou toute recette dont les ingrédients ne peuvent être vérifiés est écarté (FR-13).
- **Le mur n'est jamais franchi** — ni en génération normale (FR-9), ni en dégradation élégante (FR-10), ni en repli : aucune recette violant une allergie ou un régime n'est jamais proposée, même signalée.
- **Détection interne et indépendante** des étiquettes des sources externes (FR-13).
- **Human-in-the-loop** : pour toute allergie déclarée, avertissement explicite + validation de l'organisateur avant de retenir un plat (FR-16). La sécurité algorithmique est doublée, jamais remplacée.
- **Génération forcée transparente** : si l'organisateur génère avec des réponses partielles, CookWho signale nommément les participants non couverts (FR-12).
- `[NOTE FOR PM]` CookWho ne peut garantir la sécurité que sur la base des ingrédients fournis par la source. Une source incomplète ou erronée peut compromettre la détection — c'est précisément le rôle de filet de FR-16 et de la règle d'exclusion par défaut.

## 9. Plateforme

- **V1 : application web.** L'organisateur accède à CookWho au navigateur (desktop ou mobile).
- **Le participant ouvre son lien depuis un message** (email, messagerie) — donc le plus souvent sur mobile. La page participant doit être pleinement utilisable sur **navigateur mobile** (responsive). `[ASSUMPTION: le parcours participant est pensé « mobile-web d'abord », puisque le lien est ouvert depuis un message sur téléphone.]`
- **Hors V1 : application mobile native** (vision).

## 10. Source de recettes & contraintes légales

- **Amorçage : `marmiton-api`** (scraper non-officiel, npm), isolé derrière une couche d'abstraction + cache (FR-14) pour rester interchangeable.
- **Risques connus :** licence non précisée (zone grise légale), source non-officielle donc fragile (peut casser), pas d'allergènes fournis (d'où la couche interne F4).
- **Posture V1 :** acceptable pour amorcer un MVP entre testeurs proches et valider le concept. L'architecture à source interchangeable neutralise la fragilité technique.
- `[NOTE FOR PM]` **La clarification légale est une question ouverte bloquante pour la suite** (voir §12) : le droit d'usage de la source — ou le passage à une source officielle/licenciée — doit être tranché **avant tout usage public ou commercial**.

## 11. NFR transverses

- **Performance :** profil participant bouclable en < 2 min (objectif UX, SM-3) ; génération de recettes rapide — cible < 5 s. `[ASSUMPTION: cible de 5 s à confirmer selon la source de recettes et le cache.]`
- **Fiabilité de la sécurité (prioritaire) :** la détection allergènes (FR-13) prime sur la disponibilité de l'offre ; en cas d'incertitude sur les ingrédients, ne jamais proposer le plat.
- **Sécurité d'accès :** lien d'invitation non devinable ; la vue des recettes est strictement réservée à l'organisateur (aucun accès participant).
- **Confidentialité :** collecte minimisée (prénom + restrictions). Les restrictions (allergies) sont des **données de santé sensibles** — aucune règle de rétention définie en V1, traité comme question ouverte (§12).
- **Simplicité / lisibilité :** parcours participant utilisable « fatigué, entre deux réunions » — la simplicité est un critère de survie, pas un confort.

## 12. Questions ouvertes

1. **Légal — source de recettes :** clarifier le droit d'usage de `marmiton-api` ou identifier une source officielle/licenciée. *Bloquant avant usage public/commercial.* (cf §10)
2. **RGPD — données de santé :** définir minimisation, durée de conservation et suppression des restrictions (données sensibles) avant lancement public. (cf §11)
3. **Responsabilité juridique allergies :** faut-il un disclaimer formel en complément du garde-fou humain (FR-16) ?
4. **Gravité des allergies :** confirmer que la V1 ne sous-classifie pas la gravité (toute allergie déclenche FR-16).
5. **Cycle de vie des données d'un repas :** que deviennent repas et restrictions une fois le repas passé (archivage / suppression) ?
6. **Recette sans ingrédients exploitables :** comportement attendu si une source ne fournit pas de liste d'ingrédients fiable (présumé : exclusion par sécurité — à confirmer).

## 13. Index des hypothèses

- **§4.6 / FR-16** — la V1 ne sous-classifie pas la gravité des allergies : toute allergie déclarée déclenche l'avertissement + validation organisateur (pour éviter une auto-évaluation peu fiable côté participant). *À confirmer (cf §12.4).*
- **§9** — le parcours participant est pensé « mobile-web d'abord », le lien étant ouvert depuis un message sur téléphone.
- **§11** — cible de génération < 5 s, à confirmer selon la source de recettes et le cache.
