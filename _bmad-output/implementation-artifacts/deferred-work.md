# Deferred Work

## Deferred from: code review of 1-2-bibliotheque-de-composants-ui-de-base (2026-06-22)

- **`hover:text-white` dans Button primaire** — `text-white` hors palette Cocon ; à remplacer par `text-background` ou `text-surface` une fois le MVP complet. Raison du report : réaliser l'ensemble du MVP avant de corriger ce genre de détail.

- **`import.meta.dirname` dans vitest.config.ts** — compatible Node ≥ 21.2 seulement ; CI sur Node 18/20 LTS planterait. Utiliser `fileURLToPath(new URL('.', import.meta.url))` quand la compatibilité Node LTS devient nécessaire.
- **Button et Input ne forwardent pas les refs** — nécessaire pour les librairies de formulaires (React Hook Form, etc.) et la gestion impérative du focus. À ajouter quand les premiers formulaires seront implémentés (stories 2.x).
- **vitest.config.ts sans pattern `include` explicite** — sans `include: ['src/**/*.test.*']`, la config est fragile si un package publié dans `node_modules` contient des fichiers de test. Risque faible actuellement.
- **Input sans `aria-describedby`** — l'interface `InputProps` n'expose pas de prop `errorMessage` ni de `aria-describedby`. Nécessitera un refacto d'API quand la validation sera ajoutée (stories 2.x). Anticiper dès la story de création de repas.
- **Chip — catégorie de variante non annoncée aux lecteurs d'écran** — `<Chip variant="allergie">Arachides</Chip>` annonce "Arachides" sans contexte de catégorie. Le consumer devra fournir un libellé explicite ou un `aria-label` portant la catégorie (ex. "Arachides — allergie"). À documenter dans la story qui introduit les listes de chips.

## Deferred from: code review of story-3.2a (combiné 3.1 + 3.2a) (2026-06-26)

> ✅ **D1 (High) et D2 (Med) RÉSOLUS par la story 3.5** (2026-06-26) : filtre `expiresAt` à la lecture + écriture, et gestion terminal/transitoire de l'erreur côté assistant. Les autres items (3.2b / 3.4) restent ouverts.

- **[High → story 3.5] ✅ RÉSOLU (3.5)** Repas expiré-mais-pas-encore-purgé : `monAcces` et `enregistrerRestrictions` (`src/server/api/routers/participant.ts`) ne filtrent pas `repas.expiresAt`. Pendant la fenêtre ~24h entre l'expiration et le passage du cron de purge (03:00), un participant peut encore accéder à sa page et **écrire des restrictions (données de santé, NFR6)** sur un repas logiquement expiré. La story 3.1 défère explicitement les états « expiré / repas clos » à la story 3.5. Fix : filtrer `expiresAt > now` côté lecture **et** écriture (`findUnique` ne filtre pas sur relation → `findFirst` ou rejet après select de `expiresAt`).
- **[Med → story 3.5] ✅ RÉSOLU (3.5)** L'assistant (`src/components/participant/AssistantRestrictions.tsx`) ne câble que `onSuccess` ; sur une erreur terminale (`NOT_FOUND` quand le repas a été purgé en cours de session), l'utilisateur voit le Banner générique « Vérifie ta connexion et réessaie » et peut réessayer en boucle sans succès. Distinguer terminal (NOT_FOUND/BAD_REQUEST → état lien invalide) vs transitoire (réseau → retry) via `onError` + `error.data?.code`.
- **[Med → story 3.2b]** Valeurs de restriction dupliquées persistées : pas de déduplication dans `versRestrictions`/l'input Zod, pas d'index unique `@@unique([participantId, type, valeur])`. Deux `NON_AIME "Olives"` avec seuils différents créent des lignes contradictoires. À traiter quand 3.2b définit la collecte des entrées (envisager un garde DB).
- **[Low → story 3.2b]** Dérive de contrat `seuilTolerance` : `.optional()` côté API mais `DonneesRestrictions.nonAimes[].seuilTolerance: number` (requis) côté client. Le défaut serveur `?? 3` devient mort pour le vrai flux. Aligner les deux couches en 3.2b.
- **[Low → story 3.2b]** `versRestrictions` ne `trim` pas et ne contrôle pas le vide de `valeur` côté client → une valeur `"   "` truthy passera le garde `if (donnees.regime)` et sera rejetée par Zod en aller-retour. Trim + contrôle non-vide côté client en 3.2b.
- **[Low → story 3.2b]** Gestion du focus impérative via `requestAnimationFrame` dans `demarrer`/`suivant`/`precedent` : peu fiable en navigation rapide ou si la vue passe à `confirme` avant le tir du rAF. Préférer un `useEffect` indexé sur `etape`/`vue`.
- **[Low → décision produit]** Soumissions concurrentes (deux onglets) : `deleteMany` puis `createMany` sans garde d'idempotence → dernier-écrit-gagne. Sémantique « remplace » probablement voulue ; à confirmer.
- **[Low → story 3.4]** `monAcces` ne renvoie pas `statut` ; nécessaire pour accueillir un participant déjà REPONDU (« On a déjà tes préférences ✓ »). Déjà dans le périmètre de 3.4. ✅ RÉSOLU (3.4).

## Deferred from: code review of moteur d'allergènes (stories 4.0 → 4.1b) (2026-06-27)

> Revue moteur /core. ACs OK, gate asymétrique correct, pureté respectée. 2 patches (lacunes dico fort risque + tolérance pluriel bidirectionnelle) traités à part. Reports ci-dessous = curation continue / raffinements.

- **[Med → curation continue]** Le gate « couvre 14 allergènes » ne protège que les **tokens-clés présents dans les fixtures**, pas les clés sœurs : supprimer `homard`/`crabe` en gardant `crevette` ne casse pas le build. Ajouter progressivement des fixtures **par clé à fort enjeu** (poissons, fromages, mollusques) pour durcir le gate.
- **[Low → curation]** Sur-détection conservatrice : `noix de muscade` (muscade) et `noix de coco` (coco) → FRUITS_A_COQUE via la clé `noix` (ni l'une ni l'autre n'est un fruit à coque réglementaire UE). Sûr côté sécurité mais nuit à l'UX. Raffinement possible : « clé la plus longue gagnante » ou liste d'exclusions explicites.
- **[Low]** Pluriels irréguliers `-al`→`-aux` non transformés par `tokenCorrespond` (aucune clé concernée actuellement ; à couvrir si une clé future l'exige, ex. `corail`/`coraux`).
- **[Low → post-V1]** Complétude exhaustive du dictionnaire = **curation continue**. Le dictionnaire maison est volontairement non-exhaustif (stories 4.0/4.1b). Piste d'enrichissement tracé hors-ligne via Open Food Facts (architecture, différé).

## Deferred from: story 4.3b (régimes alimentaires) (2026-06-28)

- **[Med → post-V1]** **Halal / Casher par propriétés** : différés (décision produit 2026-06-28). On ne peut pas certifier l'abattage/la préparation depuis une liste d'ingrédients ; seules des violations claires sont détectables (porc, alcool ; crustacés/mollusques pour casher). Restent traités en **incertitude** (« régime non évalué ») par le mur — aucune exclusion ni prétention de conformité. Évolution possible : détecter porc/alcool/fruits de mer pour **exclure le clair** + marquer « incertain » sur la certification. Prérequis : 4.3b (dico propriétés) livré.

## Deferred from: code review of moteur de génération (stories 4.2 → 4.4b) (2026-06-27)

> Revue combinée. Invariant de sécurité OK (aucune recette violant le mur retenue), 27/27 ACs satisfaits. 6 patches de correction appliqués. Reports ci-dessous = à traiter quand le contexte l'exige.

- **[Med → quand la recherche par requête sera branchée]** Cache `RecetteCache` clé sur `source` seul (pas `requete`/`limite`) : aujourd'hui inoffensif car la génération utilise une requête vide (pool large par source, borné par `take` après le patch). Mais l'API `recupererRecettes({ requete })` ment : une 2ᵉ requête distincte resert les recettes de la 1ʳᵉ. Quand la recherche par mots-clés arrivera : colonne `requete` (normalisée) + `@@unique([source, requete, sourceRef])` + filtrer `lireCache` dessus.
- **[Low → 4.5]** `resoudre` renvoie `PAS_ASSEZ` sans distinguer « épuisé après régénérer » de « trop peu dès le départ ». La dégradation élégante (4.5) raffinera ce Result.
- **[Low]** `resoudre` fait confiance au `detection` fourni dans `RecetteEntree` (cohérent avec `ingredients` dans le pipeline actuel, dérivés du même texte). Pour un futur appelant qui construirait `detection` séparément, dériver `detection` dans `resoudre` ou documenter/asserter l'invariant.

## Deferred from: code review of Epic 3 (stories 3.2b → 3.5) (2026-06-26)

> Revue combinée Epic 3. Backbone propre (tous ACs OK, NFR4/5/6 vérifiés). 2 patches data-fidelité appliqués sur le seuil de tolérance. Reports ci-dessous = polish UX/robustesse, non bloquants.

- **[Med → 3.2b polish]** `AssistantRestrictions.onError` ne gère que `NOT_FOUND` → un `BAD_REQUEST` (dépassement `.max(50)` ou Zod `.refine`) déclenche le Banner « réessaie » → boucle de retry trompeuse sur une erreur déterministe. Distinguer validation-terminale vs transitoire (message non-retry).
- **[Low → 3.2b polish]** Pas de plafond client sur le nombre d'items de restriction (peut atteindre le `.max(50)` serveur) ni de `maxLength={200}` sur les `Input` de saisie libre (`EtapeAllergenes`, `EtapeNonAimes`) → rejet seulement au submit. À coupler avec le point précédent.
- **[Low → 3.2b polish]** Ajout libre d'une valeur égale à une option standard (ex. « Arachides ») dans `EtapeAllergenes` → la puce QuickSelect passe `aria-pressed` mais aucune chip supprimable n'apparaît (retrait non évident). Rejeter/basculer si la saisie matche une option standard (comparaison insensible à la casse).
- **[Low → 3.2b polish]** Déduplication sensible à la casse dans `versRestrictions` et les gardes `includes` : « Champignons » et « champignons » créent 2 lignes distinctes. Normaliser (`toLocaleLowerCase("fr")`).
- **[Low → 3.4 polish]** Réouverture d'un participant `REPONDU` sans aucune restriction : la vue « retour » affiche « On a déjà tes préférences » + récap « Tu manges de tout » — message légèrement contradictoire. Brancher la microcopy sur `rienSaisi`.
