---
stepsCompleted: [1, 2, 3, 4]
status: 'complete'
completedAt: '2026-06-19'
inputDocuments:
  - _bmad-output/planning-artifacts/prds/prd-CookWho-2026-06-19/prd.md
  - _bmad-output/planning-artifacts/prds/prd-CookWho-2026-06-19/addendum.md
  - _bmad-output/planning-artifacts/architecture.md
  - _bmad-output/planning-artifacts/ux-designs/ux-CookWho-2026-06-19/DESIGN.md
  - _bmad-output/planning-artifacts/ux-designs/ux-CookWho-2026-06-19/EXPERIENCE.md
  - _bmad-output/planning-artifacts/briefs/brief-CookWho-2026-06-07/brief.md
---

# CookWho - Epic Breakdown

## Overview

Ce document décompose les exigences du PRD, de l'UX et de l'architecture de CookWho en epics et user stories implémentables, avec critères d'acceptation.

## Requirements Inventory

### Functional Requirements

- **FR1** : L'organisateur peut créer un repas (lieu, date, heure).
- **FR2** : L'organisateur peut ajouter des participants (prénom requis, email optionnel).
- **FR3** : CookWho génère un lien d'invitation par participant ; l'organisateur le diffuse par email (envoi CookWho) ou par copie du lien.
- **FR4** : L'organisateur suit l'état des réponses (qui a répondu / qui manque).
- **FR5** : Le participant accède à sa page personnelle via son lien, sans compte, prénom pré-rempli.
- **FR6** : Le participant déclare ses restrictions en 3 étapes (régime, allergies, aliments non-aimés + seuil de tolérance) ; aucune n'est obligatoire.
- **FR7** : À la validation, le participant voit le récapitulatif + une confirmation explicite de prise en compte.
- **FR8** : Le participant peut rouvrir son lien pour consulter/modifier ses restrictions.
- **FR9** : L'organisateur génère 3 à 10 recettes de plats principaux compatibles (mur respecté, curseur optimisé) ; il peut régénérer.
- **FR10** : Dégradation élégante — si aucune recette ne satisfait tous les goûts, proposer ≥3 plats froissant le moins de préférences, ingrédients gênants signalés ; le mur n'est jamais franchi.
- **FR11** : Échec explicatif — si le mur est impossible, expliquer la/les contrainte(s) bloquante(s), ne rien proposer d'incompatible.
- **FR12** : Génération forcée — générer avec les réponses reçues, en signalant les participants non couverts.
- **FR13** : Détecter les allergènes d'une recette en interne (≥14 allergènes UE, dérivés/traces, règle « dans le doute on exclut »), indépendamment de la source.
- **FR14** : Récupérer des recettes via une source externe interchangeable (abstraction) + cache persistant.
- **FR15** : L'organisateur consulte la liste des recettes (titre + ingrédients, ingrédients gênants distingués) et choisit un plat — vue réservée à l'organisateur.
- **FR16** : Avertissement allergie + validation par l'organisateur avant de retenir un plat (human-in-the-loop).

### NonFunctional Requirements

- **NFR1** : Profil participant bouclable en moins de 2 minutes, sans aide.
- **NFR2** : Génération des recettes rapide — cible < 5 s (via cache).
- **NFR3** : Sécurité prioritaire — zéro faux négatif sur la détection d'allergènes ; corpus d'or = gate de CI (faux négatif → build rouge).
- **NFR4** : Lien d'invitation non-devinable (token cryptographique 256 bits).
- **NFR5** : Frontière étanche — la vue des recettes est strictement réservée à l'organisateur ; le participant ne voit jamais le menu.
- **NFR6** : Confidentialité — minimisation des données ; pas de log de données de santé ; purge TTL des repas/restrictions (garde-fou RGPD).
- **NFR7** : Plateforme web ; parcours participant mobile-first ; organisateur responsive.
- **NFR8** : Accessibilité — la sécurité ne repose jamais sur la seule couleur (icône + libellé) ; cibles tactiles ≥ 44px ; clavier + lecteur d'écran ; langage simple.

### Additional Requirements

(Issues de l'architecture — impactent l'implémentation)

- **Starter (Epic 1, Story 1)** : initialiser avec `npm create t3-app@latest` (TypeScript, Tailwind, tRPC, Prisma, Auth.js, App Router).
- Noyau `/core` PUR (zéro I/O) pour `allergenes` et `compatibilite` ; règle ESLint de boundaries (`/core` n'importe pas `/server`,`/app`,`/db`).
- Schéma Prisma/PostgreSQL : `Organisateur`, `Repas` (avec `expiresAt`), `Participant` (avec `accessToken`, `statut`), `Restriction` (type, valeur, seuilTolerance?), `RecetteCache`.
- Auth.js v5 — connexion organisateur par lien magique email.
- Routers tRPC séparés : `organisateur` (protégé) et `participant` (scopé au token, sans accès recettes).
- Couche source : interface `SourceDeRecettes` + impl `marmitonSource` + cache Postgres.
- Déploiement Vercel + Postgres managé (Neon/Supabase) ; CI lint+tests avec gate corpus d'or.
- **Manque à traiter tôt** : envoi d'email des invitations (fournisseur type Resend/SMTP) ; job de purge planifié (Vercel Cron) pour le TTL RGPD.

### UX Design Requirements

- **UX-DR1** : Configurer le thème Tailwind à partir des tokens DESIGN.md (palette Cocon : fond crème, abricot primaire, sauge « sûr », rouge allergène ; police Nunito ; rayons arrondis md/lg/pill).
- **UX-DR2** : Implémenter les composants UI : `button` (primaire abricot texte foncé / secondaire / texte), `input`, `quick-select` (régimes/allergies), `chip` (restriction), `recipe-card`, `participant-row`, `stepper`, `tolerance-slider`, `banner` (info/danger), `safe-badge`.
- **UX-DR3** : Assistant participant en 3 étapes avec stepper, mobile-first, progression sauvegardée, retour arrière.
- **UX-DR4** : Couvrir les états : chargement (génération), vide (pas de repas), en attente de réponses, succès (3-10), dégradation (curseur), échec explicatif (mur impossible), avertissement allergie, confirmation participant.
- **UX-DR5** : Microcopy FR selon Voice & Tone (accueil participant, confirmation « ✓ pris en compte », avertissement allergie, échec explicatif, génération forcée) — chaleureux, sauf sécurité (net).
- **UX-DR6** : Accessibilité — allergènes/confirmations portent icône + texte (pas la couleur seule) ; cibles ≥ 44px ; navigation clavier + lecteur d'écran.
- **UX-DR7** : Petites illustrations / pictos doux (légumes, ustensiles) pour animer les écrans.
- **UX-DR8** : Frontière UI étanche — aucune vue/route participant n'expose les recettes ou le menu.

### FR Coverage Map

- FR1 : Epic 2 — créer un repas
- FR2 : Epic 2 — ajouter des participants
- FR3 : Epic 2 — générer/diffuser les invitations
- FR4 : Epic 2 — suivre l'état des réponses
- FR5 : Epic 3 — accès participant sans compte
- FR6 : Epic 3 — saisie des restrictions (3 étapes)
- FR7 : Epic 3 — récapitulatif + confirmation
- FR8 : Epic 3 — modification des restrictions
- FR9 : Epic 4 — génération 3-10 + régénérer
- FR10 : Epic 4 — dégradation élégante (curseur)
- FR11 : Epic 4 — échec explicatif (mur impossible)
- FR12 : Epic 4 — génération forcée
- FR13 : Epic 4 — détection allergènes interne
- FR14 : Epic 4 — source interchangeable + cache
- FR15 : Epic 5 — consultation & choix du plat
- FR16 : Epic 5 — avertissement allergie + validation

## Epic List

### Epic 1 : Socle & accès organisateur
Initialiser l'application et permettre à l'organisateur de se connecter et d'accéder à son espace « Mes repas ».
**FRs couvertes :** prérequis technique (init T3, thème Cocon, schéma de base, Auth.js lien magique, base UI) — soutient NFR4, NFR7, UX-DR1, UX-DR2.

### Epic 2 : Créer un repas & inviter
L'organisateur crée un repas (lieu/date/heure), ajoute ses participants, leur diffuse un lien d'invitation, et suit les réponses.
**FRs couvertes :** FR1, FR2, FR3, FR4 (+ token 256 bits NFR4, envoi email, `expiresAt`/purge RGPD NFR6).

### Epic 3 : Le participant déclare ses contraintes
Le participant remplit son profil sans compte, en moins de deux minutes, et repart rassuré (sans voir le menu).
**FRs couvertes :** FR5, FR6, FR7, FR8 (+ assistant 3 étapes UX-DR3, mobile-first NFR1/NFR7, microcopy UX-DR5, accessibilité NFR8/UX-DR6).

### Epic 4 : Moteur de sécurité & compatibilité
Détecter les allergènes en interne et générer des plats sûrs et compatibles avec tout le groupe. Cœur du produit, concentré sur `/core` + `/sources`.
**FRs couvertes :** FR13, FR14, FR9, FR10, FR11, FR12 (+ zéro faux négatif/corpus d'or NFR3, génération < 5 s NFR2).

### Epic 5 : Présentation & choix du plat (organisateur)
L'organisateur consulte les recettes générées, est averti en cas d'allergie, et choisit son plat.
**FRs couvertes :** FR15, FR16 (+ frontière étanche NFR5, recipe-card/états UX-DR2/UX-DR4, validation human-in-the-loop).

### Epic 6 : Identité de marque & site vitrine (V1)
Donner à CookWho une image publique professionnelle et un point d'entrée public pour se connecter.

### Epic 7 : Améliorations gestion du repas & des participants (V1 — sauf 7.1)
Fluidifier et compléter les écrans organisateur existants (Epic 2) suite aux retours d'usage. Story 7.1 (refonte calendrier) reste en V2.

### Epic 8 : Refonte du design global (V1 — périmètre réduit)
Pass de polish ciblé sur les 5 écrans clés (accueil/vitrine, mes repas, création de repas, assistant participant, liste des recettes) — pas une refonte totale.

### Epic 9 : Source de recettes durable (Wikibooks + curation) (V1)
Remplacer le scraper Marmiton cassé par un pool de recettes statique, durable et en français, adossé à Wikibooks Cookbook FR (CC-BY-SA) complété par une curation maison, avec préparation affichée dans l'app.

## Epic 1 : Socle & accès organisateur

Initialiser l'application et permettre à l'organisateur de se connecter et d'accéder à son espace.

### Story 1.1 : Initialisation du projet & thème Cocon

As a porteur du projet,
I want le squelette technique de CookWho en place avec son identité visuelle,
So that je peux développer les fonctionnalités sur une base saine et cohérente.

**Acceptance Criteria:**

**Given** un dépôt vide
**When** j'initialise avec `npm create t3-app@latest` (TypeScript, Tailwind, tRPC, Prisma, Auth.js, App Router)
**Then** l'app démarre en local et se déploie sur Vercel
**And** le thème Tailwind reflète les tokens DESIGN.md (palette Cocon, police Nunito, rayons arrondis md/lg/pill)
**And** la règle ESLint de boundaries interdit à `/core` d'importer `/server`, `/app`, `/db`.

### Story 1.2 : Bibliothèque de composants UI de base

As a porteur du projet,
I want les composants visuels réutilisables de CookWho,
So that tous les écrans partagent le même langage visuel.

**Acceptance Criteria:**

**Given** le thème Cocon configuré
**When** j'implémente les composants de base
**Then** `button` (primaire abricot texte foncé, secondaire, texte), `input`, `chip`, `banner` (info/danger) et `safe-badge` existent et respectent les tokens
**And** chaque état porte une icône + un libellé (la couleur n'est jamais le seul porteur de sens) (NFR8, UX-DR6).

### Story 1.3 : Connexion organisateur par lien magique

As an organisateur,
I want me connecter sans mot de passe,
So that j'accède à mon espace simplement et en sécurité.

**Acceptance Criteria:**

**Given** le modèle `Organisateur` et Auth.js configurés
**When** je saisis mon email
**Then** je reçois un lien magique de connexion par email
**And** cliquer sur le lien ouvre une session organisateur valide
**And** un transport email est configuré (fournisseur type Resend/SMTP + variables d'env) — réutilisable pour l'envoi des invitations (FR3) (revue technique)
**And** aucun mot de passe n'est stocké.

### Story 1.4 : Espace « Mes repas »

As an organisateur connecté,
I want une page d'accueil listant mes repas,
So that je retrouve mes repas et peux en créer un nouveau.

**Acceptance Criteria:**

**Given** une session organisateur active
**When** j'ouvre l'accueil
**Then** je vois la liste de mes repas (vide au départ, avec un appel à créer le premier)
**And** un bouton « Créer un repas » est présent
**And** l'état vide est accueillant (message d'onboarding, pas une page nue) (revue UX)
**And** un organisateur non connecté est redirigé vers la connexion.

### Story 1.5 : Socle d'accessibilité

As an utilisateur (organisateur ou participant),
I want une app utilisable au clavier, au lecteur d'écran et avec un bon contraste,
So that personne n'est laissé de côté — y compris une personne en situation de handicap. (ajoutée suite à la revue UX — NFR8, UX-DR6)

**Acceptance Criteria:**

**Given** les tokens et composants de base
**When** je vérifie l'accessibilité
**Then** le contraste texte respecte WCAG AA (palette Cocon abricot/sauge auditée)
**And** tous les parcours sont navigables au clavier et annoncés au lecteur d'écran
**And** la sécurité (allergènes/confirmations) porte toujours icône + libellé, jamais la couleur seule.

## Epic 2 : Créer un repas & inviter

L'organisateur crée un repas, ajoute ses participants, leur diffuse un lien d'invitation et suit les réponses.

### Story 2.1 : Créer un repas

As an organisateur,
I want créer un repas avec ses informations,
So that je peux commencer à organiser le déjeuner. (FR1)

**Acceptance Criteria:**

**Given** une session organisateur
**When** je renseigne lieu, date et heure et valide
**Then** un `Repas` est créé, rattaché à mon compte, avec un `expiresAt`
**And** il apparaît dans « Mes repas »
**And** lieu, date et heure sont réaffichés correctement.

### Story 2.2 : Ajouter des participants

As an organisateur,
I want ajouter mes convives au repas,
So that chacun pourra renseigner ses contraintes. (FR2)

**Acceptance Criteria:**

**Given** un repas créé
**When** j'ajoute un participant avec au moins un prénom (email optionnel)
**Then** le `Participant` est enregistré, rattaché au repas, statut « en attente »
**And** je peux ajouter plusieurs participants
**And** un participant sans email est accepté.

### Story 2.3 : Générer & diffuser les invitations

As an organisateur,
I want un lien d'invitation par participant,
So that chacun accède à sa page de saisie. (FR3, NFR4)

**Acceptance Criteria:**

**Given** un participant ajouté
**When** le participant est créé
**Then** un `accessToken` cryptographique non-devinable (256 bits) lui est attribué, formant l'URL `/p/{token}`
**And** si un email est renseigné, je peux déclencher l'envoi de l'invitation par CookWho
**And** dans tous les cas, je peux copier le lien pour le transmettre moi-même.

### Story 2.4 : Suivre l'état des réponses

As an organisateur,
I want voir qui a répondu,
So that je sais quand je peux générer les recettes. (FR4)

**Acceptance Criteria:**

**Given** un repas avec des participants
**When** j'ouvre le détail du repas
**Then** je vois pour chaque participant son statut (a répondu / en attente)
**And** un état « aucune réponse pour l'instant » est habillé et rassurant (revue UX)
**And** le statut passe à « a répondu » dès qu'un participant valide ses restrictions.

### Story 2.5 : Purge planifiée des repas expirés

As a responsable des données,
I want que les repas et restrictions expirés soient supprimés automatiquement,
So that on ne conserve pas de données de santé inutilement. (NFR6)

**Acceptance Criteria:**

**Given** des repas dont l'`expiresAt` est dépassé
**When** le job de purge planifié (Vercel Cron) s'exécute
**Then** les repas expirés et leurs participants/restrictions sont supprimés
**And** le job Vercel Cron est configuré (planification + variable d'env de la route protégée) (revue technique)
**And** la route de purge est protégée (non déclenchable publiquement).

## Epic 3 : Le participant déclare ses contraintes

Le participant remplit son profil sans compte, en moins de deux minutes, et repart rassuré.

### Story 3.1 : Accès participant par lien, sans compte

As a participant,
I want ouvrir mon lien et arriver sur ma page,
So that je renseigne mes contraintes sans créer de compte. (FR5)

**Acceptance Criteria:**

**Given** un lien d'invitation valide
**When** je l'ouvre (souvent sur mobile)
**Then** j'arrive sur ma page personnelle, pré-remplie de mon prénom, sans authentification
**And** la page est pleinement utilisable sur navigateur mobile (NFR7)
**And** un token invalide affiche un message clair, sans fuite d'information.

### Story 3.2 : Saisir ses restrictions en 3 étapes

As a participant,
I want déclarer mon régime, mes allergies et mes aliments non-aimés,
So that l'organisateur choisira un plat qui me convient. (FR6, NFR1)

**Acceptance Criteria:**

**Given** ma page personnelle
**When** je parcours l'assistant en 3 étapes (régime → allergies → aliments non-aimés avec seuil de tolérance)
**Then** mes sélections sont enregistrées (`Restriction` typées)
**And** le seuil de tolérance ne s'applique qu'aux aliments non-aimés
**And** aucune restriction n'est obligatoire (je peux valider sans contrainte)
**And** l'étape allergies est visuellement et narrativement distincte de l'étape aliments non-aimés (« ceci peut me mettre en danger » ≠ « ceci, bof ») — la gravité n'est jamais banalisée (revue UX)
**And** le parcours est bouclable en moins de 2 minutes, au clavier et au lecteur d'écran (NFR8).

> **Note (revue) :** story dense — découper en dev (`3.2a` coquille de l'assistant + navigation/état ; `3.2b` contenu des 3 étapes).

### Story 3.3 : Récapitulatif & confirmation de prise en compte

As a participant,
I want voir ce qui a été retenu et être rassuré,
So that j'ai confiance que ma contrainte sera respectée. (FR7)

**Acceptance Criteria:**

**Given** mes restrictions saisies
**When** je valide
**Then** je vois le récapitulatif complet de mes sélections
**And** une confirmation explicite « ✓ pris en compte » s'affiche après enregistrement effectif
**And** je ne vois jamais le menu ni les recettes (NFR5).

### Story 3.4 : Modifier ses restrictions

As a participant,
I want rouvrir mon lien pour ajuster mes réponses,
So that je corrige une erreur ou un changement. (FR8)

**Acceptance Criteria:**

**Given** un lien déjà utilisé
**When** je le rouvre
**Then** mes restrictions précédentes sont réaffichées et modifiables
**And** je suis accueilli par « On a déjà tes préférences ✓ — tu veux les modifier ? » plutôt que replongé de force dans les 3 étapes (revue UX)
**And** une modification est prise en compte par les générations ultérieures.

### Story 3.5 : États du lien participant (expiré, invalide, repas clos)

As a participant,
I want un message clair si mon lien ne fonctionne pas,
So that je ne tombe pas sur une page cassée et garde confiance. (ajoutée suite à la revue UX — NFR5, NFR8)

**Acceptance Criteria:**

**Given** un lien invalide, expiré, ou pointant vers un repas purgé/clos
**When** je l'ouvre
**Then** je vois un message habillé (ton Cocon), jamais un 404 brut ni une fuite d'information
**And** le message m'oriente (recontacter l'organisateur) sans exposer de données d'autrui.

## Epic 4 : Moteur de sécurité & compatibilité

Détecter les allergènes en interne et générer des plats sûrs et compatibles. Cœur du produit (`/core` + `/sources`).

### Story 4.0 : Dictionnaire ingrédient→allergène (source, schéma & seed)

As a moteur de sécurité,
I want un dictionnaire d'allergènes alimenté et tracé,
So that la détection a une base de vérité fiable et auditable. (FR13, NFR3 — story bloquante, ajoutée suite à la revue)

**Acceptance Criteria:**

**Given** le besoin de couvrir ≥14 allergènes UE et leurs dérivés
**When** je constitue le dictionnaire (schéma Prisma `Allergene` / `IngredientAllergene` ou fichier de données versionné)
**Then** chaque entrée `ingrédient → allergène(s)/dérivés` a une **provenance tracée** (source des données)
**And** un seed peuple le dictionnaire pour le dev et la CI
**And** la couverture des 14 allergènes UE est vérifiée par un test.
**And** *(provenance à trancher : dictionnaire maison vs enrichissement Open Food Facts — voir addendum PRD).*

### Story 4.1 : Détection des allergènes interne (corpus d'or)

As a moteur de sécurité,
I want détecter les allergènes dans une liste d'ingrédients en texte libre,
So that aucune recette dangereuse ne soit jamais présentée comme sûre. (FR13, NFR3)

> **Note (revue) :** story dense — à découper en dev (`4.1a normalize`, `4.1b detect+dictionnaire`, `4.1c corpus d'or & gate CI`). 4.1 travaille sur le **corpus d'or figé**, indépendamment de la source réelle (lève la dépendance à 4.2).

**Acceptance Criteria:**

**Given** une liste d'ingrédients en texte libre (du corpus d'or figé)
**When** `detect()` s'exécute (après `normalize()`)
**Then** il renvoie `{allergenes, ingredientsNonReconnus}` en couvrant ≥14 allergènes UE et leurs dérivés (via le dictionnaire de 4.0)
**And** un ingrédient ambigu/inconnu est traité comme potentiellement allergène (« dans le doute, on exclut »)
**And** le match se fait sur tokens délimités (pas de sous-chaîne : « ail » ≠ « volaille »)
**And** un corpus d'or annoté est vérifié avec assertion asymétrique — un faux négatif fait échouer la CI.

### Story 4.2 : Source de recettes interchangeable + cache

As a moteur,
I want récupérer des recettes via une source remplaçable et mise en cache,
So that le moteur fonctionne même si la source casse. (FR14)

**Acceptance Criteria:**

**Given** l'interface `SourceDeRecettes`
**When** une recette est demandée
**Then** `marmitonSource` la récupère (titre + ingrédients texte) derrière l'interface
**And** le résultat est mis en cache en Postgres et resservi sans nouvel appel
**And** changer de source ne nécessite pas de modifier le moteur.

### Story 4.3 : Filtre du mur (exclusion stricte)

As a moteur,
I want exclure strictement toute recette violant une contrainte non-négociable du groupe,
So that la sécurité prime toujours. (FR9, base)

**Acceptance Criteria:**

**Given** les restrictions du groupe et une recette (avec allergènes détectés par 4.1)
**When** `mur()` évalue la recette
**Then** toute recette contenant un allergène ou violant un régime d'un participant couvert est exclue
**And** une recette avec ingrédient non reconnu est exclue par défaut
**And** un invariant testé garantit qu'aucune recette retenue ne franchit le mur d'aucun participant.

### Story 4.4 : Générer 3-10 recettes compatibles + régénérer

As an organisateur,
I want obtenir une liste de plats sûrs et adaptés aux goûts,
So that je choisis un plat qui plaît au groupe. (FR9, NFR2)

**Acceptance Criteria:**

**Given** des recettes filtrées par le mur (4.3)
**When** je lance la génération
**Then** `resoudre()` renvoie entre 3 et 10 recettes, optimisées par le curseur (aliments non-aimés / seuils)
**And** « régénérer » produit une autre liste quand d'autres plats compatibles existent
**And** la génération vise < 5 s (via cache).

### Story 4.5 : Dégradation élégante (curseur)

As an organisateur,
I want quand même des propositions quand aucun plat ne plaît à tous,
So that je ne suis pas bloqué par les seuls goûts. (FR10)

**Acceptance Criteria:**

**Given** qu'aucune recette ne satisfait tous les curseurs
**When** la génération s'exécute
**Then** au moins 3 recettes sont proposées (celles froissant le moins de préférences), ingrédients gênants signalés
**And** aucune recette proposée en dégradation ne franchit le mur (allergie/régime).

### Story 4.6 : Échec explicatif (mur impossible)

As an organisateur,
I want comprendre pourquoi aucun plat n'est possible,
So that je peux décider de la suite. (FR11)

**Acceptance Criteria:**

**Given** qu'aucune recette ne peut satisfaire tous les murs du groupe
**When** la génération s'exécute
**Then** un `Result` d'échec nomme la/les contrainte(s) bloquante(s)
**And** aucune recette violant le mur n'est jamais proposée en repli.

### Story 4.7 : Génération forcée (réponses partielles)

As an organisateur,
I want générer avant que tous aient répondu,
So that je ne suis pas bloqué par un retardataire. (FR12)

**Acceptance Criteria:**

**Given** des participants n'ayant pas répondu
**When** je force la génération
**Then** seules les restrictions des participants ayant répondu sont utilisées
**And** un avertissement nomme les participants non couverts.

## Epic 5 : Présentation & choix du plat (organisateur)

L'organisateur consulte les recettes générées, est averti des allergies, et choisit son plat.

### Story 5.1 : Consulter la liste & choisir un plat

As an organisateur,
I want voir les recettes proposées et en choisir une,
So that j'arrête mon menu. (FR15, NFR5)

**Acceptance Criteria:**

**Given** une génération réussie
**When** j'ouvre l'écran des recettes
**Then** je vois chaque recette (titre + accès aux ingrédients) via `recipe-card`, avec le badge « X plats compatibles avec tout le groupe »
**And** je peux sélectionner le plat retenu
**And** aucune route/vue participant n'expose cette liste (frontière étanche).

### Story 5.2 : Signalement des ingrédients gênants

As an organisateur,
I want voir clairement les ingrédients qui posent problème en dégradation,
So that je peux décider de substituer. (FR10, présentation)

**Acceptance Criteria:**

**Given** une génération en mode dégradation
**When** je consulte une recette concernée
**Then** les ingrédients gênants sont visuellement distingués (icône + libellé + qui ils gênent)
**And** la distinction ne repose pas sur la seule couleur (NFR8).

### Story 5.3 : Avertissement allergie & validation

As an organisateur,
I want être averti et valider quand une allergie est en jeu,
So that je porte la responsabilité finale en connaissance de cause. (FR16)

**Acceptance Criteria:**

**Given** au moins une allergie déclarée dans le groupe
**When** je m'apprête à retenir un plat
**Then** un avertissement explicite s'affiche et me demande de vérifier les ingrédients
**And** ma validation explicite est requise pour retenir le plat
**And** l'avertissement complète la détection algorithmique, il ne la remplace pas.

### Story 5.4 : État de génération en cours

As an organisateur,
I want un retour rassurant pendant que CookWho cherche des plats,
So that l'attente ne devient pas de l'angoisse. (ajoutée suite à la revue UX — UX-DR4)

**Acceptance Criteria:**

**Given** que je lance une génération
**When** le moteur travaille (jusqu'à quelques secondes)
**Then** un état d'attente habillé et narratif s'affiche (ex. « On vérifie chaque assiette… »)
**And** l'attente se résout vers l'un des états : succès, dégradation, ou échec explicatif.

## Epic 6 : Identité de marque & site vitrine (V1)

Donner à CookWho une image publique professionnelle et un point d'entrée public pour se connecter.

### Story 6.1 : Logo CookWho

As a porteur du projet,
I want un logo CookWho,
So that l'application a une identité visuelle reconnaissable.

**Acceptance Criteria:**

**Given** la palette Cocon (DESIGN.md)
**When** le logo est intégré
**Then** il apparaît dans le header/navbar de l'app et sur la page d'accueil
**And** il est décliné en favicon.

### Story 6.2 : Page d'accueil style site vitrine (cookwho.fr)

As a visiteur non connecté,
I want découvrir CookWho sur une page d'accueil publique,
So that je comprends l'usage avant de me connecter. (nouvelle demande produit)

**Acceptance Criteria:**

**Given** l'URL racine cookwho.fr
**When** un visiteur non connecté y accède
**Then** il voit une page vitrine présentant CookWho (proposition de valeur, aperçu du parcours organisateur/participant)
**And** un appel à l'action mène vers la connexion
**And** un organisateur déjà connecté est redirigé vers « Mes repas » plutôt que la vitrine.

### Story 6.3 : Bouton de connexion visible sur la page d'accueil

As a visiteur,
I want trouver facilement comment me connecter,
So that je n'ai pas à deviner ou chercher l'URL de connexion.

**Acceptance Criteria:**

**Given** la page d'accueil vitrine (6.2)
**When** je consulte le header
**Then** un bouton « Se connecter » est visible et mène au formulaire de connexion.

### Story 6.4 : Gestion de compte par email + mot de passe (organisateur et participant)

As a utilisateur (organisateur ou participant),
I want pouvoir me connecter avec un email et un mot de passe,
So that je ne dépende pas uniquement d'un lien magique ou d'un lien d'invitation.

**Acceptance Criteria:**

**Given** le compte Organisateur existant (lien magique, story 1.3) et l'accès Participant existant (token d'invitation, story 3.1)
**When** j'active la connexion par mot de passe
**Then** un organisateur peut créer un mot de passe et se connecter par email + mot de passe (en complément du lien magique)
**And** un participant peut, s'il le souhaite, créer un compte pour retrouver ses repas sans dépendre uniquement de son lien
**And** les mots de passe sont stockés hashés (jamais en clair).

> **Note (à trancher) :** impact sur NFR4 (lien participant non-devinable) et sur la configuration Auth.js — nécessite une décision d'architecture avant implémentation (coexistence avec le lien magique / le token d'invitation, pas de remplacement).

## Epic 7 : Améliorations gestion du repas & des participants (V1 — sauf 7.1)

Fluidifier et compléter les écrans organisateur existants (Epic 2) suite aux retours d'usage. Stories 7.2 à 7.5 en V1 ; 7.1 reste en V2.

### Story 7.1 : Revoir le design du calendrier/horaire (V2)

As an organisateur,
I want un sélecteur de date/heure plus clair,
So that créer un repas est agréable et sans friction. (amélioration UX de la story 2.1)

**Acceptance Criteria:**

**Given** l'écran de création/édition d'un repas
**When** je choisis la date et l'heure
**Then** le composant de calendrier/horaire suit le thème Cocon et est utilisable au clavier/tactile (cibles ≥ 44px)
**And** la sélection reste lisible et facile sur mobile.

### Story 7.2 : Affichage des participants en temps réel (sans refresh)

As an organisateur,
I want voir un participant ajouté apparaître immédiatement dans la liste,
So that je n'ai pas besoin de recharger la page. (amélioration UX de la story 2.2)

**Acceptance Criteria:**

**Given** l'écran de gestion des participants d'un repas
**When** j'ajoute un participant
**Then** il apparaît dans la liste sans rechargement manuel de la page.

### Story 7.3 : Éditer un participant (prénom, email)

As an organisateur,
I want corriger le prénom ou l'email d'un participant déjà ajouté,
So that je peux réparer une erreur de saisie sans le supprimer puis le recréer.

**Acceptance Criteria:**

**Given** un participant existant dans un repas
**When** je modifie son prénom et/ou son email et valide
**Then** les nouvelles valeurs sont enregistrées et réaffichées
**And** si une invitation avait déjà été envoyée à l'ancien email, je suis informé qu'il faudra la renvoyer.

### Story 7.4 : Afficher le lien d'invitation complet

As an organisateur,
I want voir le lien d'invitation complet d'un participant,
So that je peux le vérifier ou le transmettre par un autre canal que le seul bouton copier. (amélioration UX de la story 2.3)

**Acceptance Criteria:**

**Given** un participant avec un `accessToken` généré
**When** je consulte sa fiche
**Then** l'URL complète `/p/{token}` est affichée en clair, en plus du bouton « copier ».

### Story 7.5 : Email de confirmation après création d'un repas

As an organisateur,
I want recevoir un email après avoir créé un repas,
So that j'ai une trace et un rappel des informations saisies.

**Acceptance Criteria:**

**Given** un repas créé avec succès
**When** la création est confirmée
**Then** un email de confirmation est envoyé à l'organisateur (récapitulatif lieu/date/heure)
**And** l'envoi réutilise le transport email déjà configuré (story 1.3).

## Epic 8 : Refonte du design global (V1 — périmètre réduit)

Auditer et retravailler le design pour un rendu plus épuré. En V1, le pass de polish est **borné aux 5 écrans clés** (accueil/vitrine, mes repas, création de repas, assistant participant, liste des recettes) — pas une refonte totale du site.

### Story 8.1 : Audit et refonte du design pour un rendu plus clean

As a porteur du projet,
I want un design plus épuré sur l'ensemble du site,
So that CookWho paraisse plus professionnel et agréable à utiliser.

**Acceptance Criteria:**

**Given** l'état actuel des écrans (organisateur et participant)
**When** l'audit design est mené
**Then** une liste des écarts par rapport à un rendu « clean » cohérent est produite (espacement, hiérarchie visuelle, cohérence des composants)
**And** les tokens DESIGN.md sont mis à jour si nécessaire
**And** les écrans clés (accueil, mes repas, création de repas, assistant participant, liste des recettes) sont retravaillés en conséquence.

## Epic 9 : Source de recettes durable (Wikibooks + curation) (V1)

Remplacer le scraper Marmiton cassé (`marmiton-api`, correctif temporaire `recettesLocales.ts` à ~50 recettes) par un pool de recettes statique, durable, en français, de 200-300 plats. Source retenue : Wikibooks Cookbook FR (fr.wikibooks.org, licence CC-BY-SA 4.0), complétée par une curation maison. La préparation (étapes) est affichée **dans l'app** (usage « devant la cuisinière »), texte intégral pour les recettes Wikibooks.

> **Contexte de décision (party mode — Winston/architecte, Amelia/dev, John/PM, Sally/UX) :**
> - **Abandon du scraping live** (fragile par nature) au profit d'un pool statique importé.
> - **Pas d'API LLM en runtime.** Un LLM comme aide-rédaction *hors runtime* pour la curation maison est acceptable si Philippe le valide ; le contenu reste relu à la main.
> - **Wikibooks « Plat principal » = ~110 recettes** seulement (desserts 157, soupes 57, accompagnements 45, entrées 31). Élargir aux autres catégories est recommandé (volume + variété + menus complets futurs).
> - **Storage (position combinée retenue)** : table Postgres `RecetteSeed` (texte de préparation long, évite un gros JSON parsé au cold start Vercel, réutilise Prisma/`RecetteCache`) **+** artefact NDJSON versionné dans Git comme *input* du seed (traçabilité & revue d'attribution en diff PR).
> - **`RecetteBrute` reste ce que `/core` consomme** (titre + `ingredientsTexte`) — la préparation et l'attribution vivent dans un type/couche présentation séparé (type `RecettePresentation`, union discriminée `{origine:'wikibooks';sourceUrl}` | `{origine:'curation-maison'}` rendant `sourceUrl` obligatoire au niveau du type pour Wikibooks).
> - **CC-BY-SA = attribution par recette, visible sur la fiche** (crédit + licence nommée/liée + lien vers l'historique des contributeurs), pas un footer légal global.
> - **Ordre des stories non négociable** : 9.1 (contrat d'attribution) avant 9.2 (ingestion sous licence) avant 9.3 (curation, dimensionnée au rendement réel de Wikibooks). Effort estimé : **3-5 journées**, coût dominant éditorial (story 9.3).

### Story 9.1 : Socle données de recettes + attribution

As a moteur / porteur du projet,
I want une table de recettes seed avec les métadonnées d'attribution, lisible derrière `SourceDeRecettes`,
So that le contrat légal et technique est posé avant qu'un seul octet de contenu tiers n'entre.

**Acceptance Criteria:**

**Given** l'interface `SourceDeRecettes` et le cache `RecetteCache` existants
**When** je pose le socle de données
**Then** une migration Prisma crée `RecetteSeed` (`source`, `sourceRef`, `sourceUrl?`, `titre`, `ingredientsTexte[]`, `preparation @db.Text`, `licence?`, `auteursUrl?`, `@@unique([source, sourceRef])` pour un seed idempotent)
**And** `RecetteBrute` reste ce que `/core` consomme (titre + `ingredientsTexte`) ; préparation & attribution transitent par une couche présentation séparée (`RecettePresentation`, union discriminée wikibooks/curation)
**And** une nouvelle implémentation `SourceDeRecettes` lit `RecetteSeed`, branchée derrière le cache
**And** un `prisma db seed` idempotent (upsert) charge une recette de test de bout en bout
**And** la fiche recette affiche un bloc attribution conditionnel (si `licence != null` : crédit + licence CC BY-SA 4.0 liée + lien historique des auteurs).

### Story 9.2 : Pipeline d'ingestion Wikibooks

As a porteur du projet,
I want un script qui importe les recettes de Wikibooks Cookbook FR en artefact versionné,
So that le pool est alimenté de façon traçable et rejouable, sans dépendance runtime à un site tiers.

**Acceptance Criteria:**

**Given** le socle `RecetteSeed` (9.1) et la licence CC-BY-SA à respecter
**When** j'exécute le pipeline d'ingestion (hors runtime)
**Then** il récupère les pages de la catégorie « Plat principal » (+ catégories complémentaires pour viser le volume) via l'API MediaWiki
**And** il parse le wikitexte en `titre` / `ingredientsTexte` / `preparation` / `sourceUrl` / `auteursUrl` (URL `?action=history`), avec nettoyage des balises internes
**And** il produit un artefact NDJSON **versionné dans Git** (input du seed), et charge `RecetteSeed` via le seed de 9.1
**And** ~110 plats principaux (au minimum) sont ingérés et affichables préparation + attribution comprises
**And** la revue d'attribution est possible en diff de PR (chaque republication de texte Wikibooks est visible dans l'artefact versionné).

> **Note (revue) :** story à plus forte incertitude — hétérogénéité des pages wikitexte, qualité de parsing au cas par cas.

### Story 9.3 : Complément curation maison & atteinte de la cible

As a porteur du projet,
I want compléter le pool avec des recettes maison rédigées,
So that on atteint 200-300 recettes avec une expérience homogène quelle que soit l'origine.

**Acceptance Criteria:**

**Given** le rendement réel de Wikibooks connu (après 9.2)
**When** je complète le pool
**Then** les recettes manquantes pour atteindre 200-300 sont rédigées/curées avec `source="curation"`, **préparation rédigée incluse** (uniformité produit — pas d'expérience à deux vitesses)
**And** le pool couvre une répartition suffisante par régime/allergène (cible ≥ 15-20 recettes par catégorie : vegan, sans gluten, sans lactose, sans les 14 allergènes majeurs), vérifiée par un test appelant le détecteur `/core`
**And** l'aide-rédaction LLM hors-runtime, si validée par Philippe, peut accélérer — le contenu reste relu à la main
**And** `recettesLocales.ts` (correctif temporaire) est retiré une fois le pool à la cible.

> **Contrat de test du pool (Amelia)** : taille ≥ 200 ; unicité `sourceRef` & titre ; `ingredientsTexte` non vide ; `preparation` non vide + garde-fou anti-stub ; `origine` valide ; `sourceUrl` présent + domaine `wikibooks.org` **ssi** origine wikibooks, absent en curation ; bijection `sourceRef` entre couche source et couche présentation (pas d'orphelin) ; unicité des `sourceUrl`.

> **Verrou juridique (avant déploiement de 9.2)** : faire valider par quelqu'un de qualifié en droit que (1) crédit + mention de licence + lien `sourceUrl` + lien historique des auteurs suffisent comme attribution CC-BY-SA 4.0 pour de la republication de texte intégral, et (2) les mentions légales / ToU de l'app portent bien l'obligation de partage à l'identique (SA) sur le contenu dérivé. La validation peut se faire **en parallèle** du dev de 9.2 (9.1 pose déjà les colonnes) — elle ne bloque que le déploiement public, pas le développement.

---

## Notes d'implémentation (issues de la revue)

- **Tests d'intégration des routers tRPC** (`organisateur` / `participant`) à prévoir en plus des tests unitaires `/core` — au minimum un AC « tests d'intégration » sur chaque story de router, dont la vérification que le participant ne peut jamais atteindre une procédure de recette.
- **Tests de contrat de la source** (`SourceDeRecettes`) + fixtures de cache pour une CI hors-ligne (story 4.2).
- **Séquencement Epic 4 :** 4.0 (dictionnaire) → 4.1 (détection sur corpus figé) → 4.2 (source+cache) → 4.3 (mur) → 4.4 (génération) → 4.5/4.6/4.7.
- **Stories denses à découper en dev** (via `bmad-create-story`) : 1.2, 3.2, 4.1, 4.4.

## Pistes de réduction de périmètre (V1 — optionnel, non appliquées)

Suggestions issues de la revue produit (John), à activer seulement si tu veux alléger le premier jet — laissées **dans** le périmètre par défaut :
- Reporter **3.4** (modification) — un re-remplissage suffit au début.
- Reporter **4.7** (génération forcée) et/ou **4.5** (dégradation fine) — garder l'échec explicatif (4.6).
- Simplifier **2.5** (purge manuelle plutôt qu'automatisée).
- Démarrer le moteur (4.0→4.1) comme tranche verticale prioritaire, avant l'UI complète.
