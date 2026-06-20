---
title: "Product Brief : CookWho"
status: final
created: 2026-06-07
updated: 2026-06-07
---

# Product Brief : CookWho

## Résumé exécutif

**CookWho** est une application web qui aide à organiser des repas de groupe où **personne n'est laissé de côté**. Dès que des convives ont des contraintes alimentaires différentes — allergies, régimes, dégoûts — l'organisation vire au casse-tête : les contraintes se disent à l'oral puis s'oublient, quelqu'un finit par ne pas manger, le malaise s'installe, et parfois l'organisateur renonce. CookWho devient l'endroit fiable où vivent les contraintes de tout le groupe, et s'en sert pour proposer des plats que chacun peut manger.

Le parcours est volontairement sans friction : l'organisateur crée un repas et invite ses convives par un simple lien ; chaque participant déclare ses contraintes en moins de deux minutes, sans compte ni téléchargement ; CookWho croise le tout et propose à l'organisateur une liste de plats compatibles. Le produit repose sur un principe fondateur — **le mur et le curseur** — qui sépare ce qui ne se négocie jamais (la sécurité : allergies, régimes fermes) de ce qui s'optimise (le plaisir : les goûts). La sécurité est maîtrisée en interne, jamais déléguée à une source externe, avec une règle simple : dans le doute, on exclut.

Là où les apps de recettes filtrent pour un seul utilisateur, CookWho est le premier à traiter le repas comme un **problème de groupe**. C'est sa raison d'être, et le point de départ d'une ambition plus large : devenir, à terme, un assistant repas du quotidien — en groupe comme en solo. La promesse, elle, ne changera jamais : un repas qui convient à tous, la sécurité d'abord, le plaisir ensuite.

## Le problème

Organiser un repas de groupe devrait rapprocher les gens. En pratique, dès que les convives ont des contraintes alimentaires différentes, ça vire au casse-tête — et souvent au malaise.

Aujourd'hui, les contraintes circulent à l'oral ou dans un fil de discussion : « moi je suis végétarien », « attention untel est allergique aux fruits à coque ». Elles sont **dites une fois, puis oubliées**. Il n'existe aucun endroit fiable où ces informations vivent. Ce n'est pas de la négligence — c'est que le système (la mémoire de l'organisateur + le fil de discussion) trahit même les gens de bonne volonté.

Le résultat se joue autour de la table :
- L'invité concerné **ne mange pas, ou mange avec dégoût** — et ça se voit.
- Il se sent **mis à l'écart** ; l'organisateur, lui, a **fait un effort « pour rien »**.
- En amont, quand les contraintes semblent trop nombreuses, l'organisateur **renonce** — le repas qui devait créer du lien n'a même pas lieu.

Derrière « c'est juste compliqué », il y a deux enjeux d'intensité différente :
- **Le mur (fréquent et structurant)** : allergies et régimes non-négociables (médicaux, religieux, éthiques). Ici, se tromper n'est pas une option — au mieux c'est l'exclusion, au pire un risque sanitaire réel.
- **Le curseur (secondaire)** : les goûts et dégoûts personnels, négociables selon la tolérance de chacun.

Le statu quo échoue sur les deux : il oublie le mur et ignore le curseur.

## La solution

CookWho est l'endroit fiable où vivent les contraintes alimentaires d'un groupe — et qui s'en sert pour proposer des plats que **tout le monde** peut manger.

Le parcours tient en trois temps :

1. **L'organisateur crée le repas et invite ses participants** — d'un simple geste (un lien à partager), sans imposer à personne de créer un compte ou de télécharger quoi que ce soit.
2. **Chaque participant déclare ses contraintes en moins de deux minutes** — allergies, régime, dégoûts — via un parcours guidé. Ses informations sont enregistrées une bonne fois, au bon endroit. Plus rien ne se perd dans le fil de discussion.
3. **CookWho croise tout le groupe et propose à l'organisateur une liste de plats compatibles** — sûrs pour le mur (allergies, régimes fermes), optimisés pour le curseur (les goûts) quand c'est possible.

L'expérience est volontairement **à deux faces, et le soulagement est des deux côtés** :

- **L'organisateur** obtient en quelques secondes ce qui lui prenait des allers-retours pénibles : une poignée de plats qu'il peut servir l'esprit tranquille. Fini le casse-tête, fini l'effort « pour rien ».
- **Le participant** dit sa contrainte *une seule fois* et reçoit une confirmation qui rassure (« ✓ ta contrainte est prise en compte »). Il ne voit jamais le menu — et n'en a pas besoin pour être tranquille : il sait qu'il pourra manger, sans avoir eu à insister ni à créer de malaise.

La sécurité n'est jamais déléguée : la détection des allergènes est un composant interne de CookWho, pas une donnée copiée d'un site de recettes. En cas de doute, on exclut.

## Ce qui rend CookWho différent

Aujourd'hui, ce problème n'a pas de solution dédiée. Les gens « se débrouillent » (le fil de discussion + la mémoire de l'organisateur), ou bricolent avec des apps de recettes pensées pour *une seule* personne. CookWho n'affronte pas un concurrent frontal — il affronte le statu quo. L'avantage tient à trois partis pris, plus une exigence non négociable.

**1. Pensé pour le groupe, pas pour l'individu.** Les apps de recettes filtrent pour *un* utilisateur. CookWho raisonne sur l'**intersection des contraintes de plusieurs personnes** à la fois — c'est le problème réel d'un repas partagé, et c'est précisément celui que personne ne traite.

**2. Friction zéro pour les participants.** Pas de compte, pas de téléchargement, un profil bouclé en moins de deux minutes via un simple lien. Le participant ne doit jamais sentir qu'il « utilise une app ». Cette simplicité n'est pas un confort : c'est la condition de survie du produit — toute friction côté invité, et l'organisateur se retrouve seul à remplir les profils des autres.

**3. Le mur et le curseur.** CookWho sépare explicitement ce qui ne se négocie pas (allergies, régimes fermes) de ce qui s'optimise (les goûts). La sécurité prime toujours ; le plaisir se cherche ensuite. Ce principe simple structure tout le moteur et évite le piège des apps qui mettent une allergie grave et un « j'aime pas les épinards » sur le même plan.

**Et une exigence, pas un argument : la sécurité.** La détection des allergènes est maîtrisée en interne (dictionnaire ingrédient → allergènes/dérivés propre à CookWho, règle « dans le doute, on exclut »), jamais déléguée à la fiche d'un site externe. Ce n'est pas ce qui rend CookWho « différent » — c'est ce qui le rend digne de confiance. C'est le ticket d'entrée, et il doit être irréprochable.

**Honnêteté sur le « moat » :** rien de tout cela n'est techniquement infranchissable. L'avantage réel de CookWho, c'est d'être le premier à **cadrer ce problème comme un problème de groupe** et de l'exécuter avec ce niveau d'exigence sur la simplicité et la confiance. L'avance se défend par l'exécution, pas par un secret technique.

## Pour qui

**L'utilisateur, c'est l'organisateur.** C'est lui qui découvre CookWho, crée le repas, invite ses convives et choisit le menu. C'est lui qu'il faut convaincre, et c'est son soulagement qui fait le produit. Tout le reste est au service de son geste.

*Portrait type :* quelqu'un qui reçoit un groupe et veut bien faire — mais qui n'a ni le temps ni l'envie de jongler avec les contraintes de chacun. Il veut éviter la gêne autour de la table sans y passer la soirée. Pour lui, réussir, c'est : obtenir vite quelques plats sûrs, et voir tout le monde manger sans malaise.

**Les participants sont des utilisateurs passifs.** Ils ne touchent CookWho que deux minutes, via un lien, pour déclarer leurs contraintes — puis plus rien. On ne cherche pas à les « convertir » : on cherche à **ne pas les faire fuir**. Le succès, côté participant, c'est de dire sa contrainte une seule fois, sans friction, et d'être rassuré qu'elle sera respectée.

*Cas particulier à ne jamais négliger :* le participant à allergie sévère. Pour lui, l'enjeu n'est pas le confort mais la confiance — il a besoin d'un signe clair que sa contrainte vitale est prise au sérieux. C'est l'utilisateur le plus exigeant sur la fiabilité, et c'est lui qui valide (ou détruit) la crédibilité de CookWho.

**Les contextes d'usage sont variés** — un repas entre amis, un dîner de famille, un déjeuner entre collègues. CookWho ne se restreint à aucun de ces terrains : partout où un groupe se réunit autour d'un repas et où les contraintes se multiplient, le besoin est le même.

## Critères de succès

CookWho réussit si les repas qu'il aide à organiser **conviennent réellement à tout le monde** — la preuve se mesure après le repas, pas avant.

**Le signal ultime (la promesse tenue).** Un organisateur a préparé un repas grâce à CookWho, et le groupe confirme *après coup* que le repas convenait à tous : personne n'a été mis à l'écart, personne n'a dû « attendre la suite ». C'est le seul critère qui dit vraiment que le produit fait ce qu'il promet. (Pour la V1, cette confirmation se recueille de façon informelle, à la main, auprès des testeurs.)

**Le critère non-négociable : zéro faux négatif.** CookWho ne doit *jamais* présenter comme sûre une recette qui ne l'est pas pour un participant. Ce critère prime sur tous les autres : mieux vaut proposer moins de plats que d'en proposer un dangereux. Sur un jeu de recettes « piégées » de test, l'objectif est zéro allergène manqué.

**Les signaux d'expérience (les conditions pour y arriver) :**
- Un participant complète son profil et ses contraintes **en moins de deux minutes, sans aide**.
- L'organisateur obtient, sans effort, une liste de plats compatibles avec tout son groupe.
- Les participants jouent le jeu : ils remplissent leur profil via le lien sans abandonner en route.

**Pour cette première version, le succès se juge qualitativement** — des repas réussis, des retours « ça a marché », et la confiance des participants les plus exigeants (les allergies sévères). Pas d'objectif chiffré : on cherche la preuve que la promesse tient, pas le volume.

## Périmètre

CookWho V1 est une **application web** : rien à installer, l'organisateur y accède au navigateur, les participants par un simple lien.

### Dans la première version

- **Création d'un repas** par l'organisateur (compte organisateur léger).
- **Invitation des participants par lien partageable** — sans compte, sans téléchargement côté participant.
- **Profil participant en < 2 min** : déclaration des allergies, du régime (végétarien, sans porc…) et des dégoûts, via un parcours guidé à boutons rapides.
- **Moteur de compatibilité « mur et curseur »** : exclusion stricte sur les contraintes non-négociables du groupe entier, optimisation des goûts par-dessus quand c'est possible.
- **Couche allergènes interne** : dictionnaire ingrédient → allergènes/dérivés (au moins les 14 allergènes réglementaires UE), règle « dans le doute, on exclut ».
- **Source de recettes externe** branchée derrière une couche d'abstraction + cache (amorçage avec `marmiton-api`), pour récupérer recettes et listes d'ingrédients.
- **Sortie organisateur** : une liste de **plats principaux** compatibles avec tout le groupe, parmi lesquels il choisit.
- **Dégradation élégante** : quand aucun plat ne satisfait *tous les goûts*, CookWho propose quand même **au moins 3 plats** — ceux qui froissent le moins de préférences — en **signalant clairement les ingrédients gênants**, à charge pour l'organisateur de substituer. **Cette dégradation ne relâche que le curseur (les goûts) : le mur (allergies, régimes non-négociables) reste infranchissable — jamais un plat proposé ne le viole, même signalé.**
- **Confirmation côté participant** : un accusé rassurant (« ✓ ta contrainte est prise en compte ») — le participant ne voit jamais le menu.

### Explicitement hors V1

- Menu complet (entrée / plat / dessert) — V1 = plat principal seulement.
- Génération de liste de courses.
- Application mobile native.
- Saisie vocale des contraintes.
- Entrée « par les plats préférés » (déduire le terrain de jeu à partir des goûts positifs).
- Repas modulaire (base commune + variantes) en recours quand aucun plat unique ne convient.
- Retour post-repas in-app (parqué en roadmap).
- Comptes / espace persistant pour les participants.

## Vision

CookWho commence par résoudre le moment le plus douloureux — le repas de groupe où personne ne doit être laissé de côté. C'est la porte d'entrée, là où le besoin est le plus vif et où aucune solution n'existe.

À mesure que la confiance s'installe, CookWho s'étend pour devenir un **assistant repas du quotidien** — pour un groupe comme pour une personne seule. Le même moteur qui garantit qu'un dîner convient à dix convives sait aussi accompagner quelqu'un qui cuisine pour lui, avec ses propres contraintes et ses propres goûts.

Le chemin se dessine déjà : du plat principal vers le **menu complet** (entrée, plat, dessert), puis vers la **liste de courses** générée automatiquement, l'**application mobile**, et une saisie toujours plus naturelle (**vocale**, ou **par les plats qu'on aime** plutôt que par les interdits). Chaque étape enlève une friction et rend la préparation d'un repas — adapté, sûr, plaisant — plus simple pour tout le monde.

L'ambition tient en une phrase : faire de CookWho un **compagnon de cuisine que chacun ouvre naturellement** au moment de décider quoi préparer — seul ou à plusieurs — sans jamais trahir la règle fondatrice : la sécurité d'abord, le plaisir ensuite.
