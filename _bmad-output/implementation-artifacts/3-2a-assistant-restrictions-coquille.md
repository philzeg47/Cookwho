---
baseline_commit: 5abb2089873df8e7cdbe9928c9cdc59f02f1fd25
---

# Story 3.2a : Assistant restrictions — coquille + persistance

Status: done

## Story

As a participant,
I want parcourir un assistant en 3 étapes et valider,
so that mes restrictions sont enregistrées et l'organisateur sait que j'ai répondu. (FR6 — infrastructure)

## Acceptance Criteria

1. **Given** la page `/p/{token}` valide, **When** je l'ouvre, **Then** la page d'accueil (prénom + contexte repas) comporte un bouton **« Déclarer mes restrictions »** qui lance le stepper.
2. **Given** le stepper actif, **When** je navigue, **Then** la barre de progression affiche **« Étape X sur 3 »** et les boutons **Précédent / Suivant / Valider** sont présents aux bons moments (Précédent masqué à l'étape 1, Valider uniquement à l'étape 3, Suivant aux étapes 1 et 2).
3. **Given** le stepper actif, **When** je navigue entre les étapes (avant et arrière), **Then** l'état local des données est conservé (pas de perte entre Précédent/Suivant).
4. **Given** l'étape 3 (dernière), **When** je clique **Valider**, **Then** les restrictions collectées sont enregistrées en base (`Restriction` typées) et le `statut` du participant passe à `REPONDU`.
5. **Given** aucune restriction sélectionnée (parcours toutes étapes sans input), **When** je valide, **Then** l'enregistrement réussit (tableau vide valide — aucune restriction n'est obligatoire).
6. **Given** un token inconnu, **When** `enregistrerRestrictions` est appelé, **Then** `NOT_FOUND` est levé (sécurité identique à `monAcces`).
7. **Given** les validations CI, **When** je lance `npm run test`, `lint`, `typecheck`, `SKIP_ENV_VALIDATION=1 npm run build`, **Then** tout reste vert ; `enregistrerRestrictions` est testé sans base réelle (Prisma mocké via `$transaction`).

## Tasks / Subtasks

- [x] **Tâche 1 — Schéma Prisma `Restriction`** (AC: 4, 5, 6)
  - [x] Ajouter `enum TypeRestriction { REGIME ALLERGIE NON_AIME }` dans `prisma/schema.prisma`
  - [x] Ajouter `model Restriction` : `id`, `participantId` (relation `Participant` `onDelete: Cascade`), `type TypeRestriction`, `valeur String`, `seuilTolerance Int?` (0-5, NON_AIME seulement), `createdAt`, `@@index([participantId])`
  - [x] Ajouter `restrictions Restriction[]` sur le modèle `Participant`

- [x] **Tâche 2 — Procédure `enregistrerRestrictions` (router participant)** (AC: 4, 5, 6)
  - [x] Ajouter à `src/server/api/routers/participant.ts` la `publicProcedure` `enregistrerRestrictions`
  - [x] Input Zod : `{ token: string.min(1), restrictions: Array<{ type: enum("REGIME","ALLERGIE","NON_AIME"), valeur: string.min(1).max(200).trim(), seuilTolerance?: int 0-5 }> }` avec `.refine` : `seuilTolerance` interdit hors `NON_AIME`
  - [x] Résoudre `token → Participant` via `findUnique({ where: { accessToken }, select: { id: true } })` — `NOT_FOUND` si absent
  - [x] `$transaction` (callback interactif) : `deleteMany` restrictions existantes, `createMany` nouvelles (si tableau non vide), `update` statut → `REPONDU`
  - [x] Pour `NON_AIME`, utiliser `seuilTolerance ?? 3` en DB (seuil neutre par défaut si absent)

- [x] **Tâche 3 — Composant `AssistantRestrictions` (`'use client'`)** (AC: 1, 2, 3)
  - [x] Créer `src/components/participant/AssistantRestrictions.tsx`
  - [x] Props : `{ token: string, acces: { prenom: string, repas: { lieu: string, date: Date, heure: string } } }`
  - [x] State local : `vue: "accueil" | "stepper" | "confirme"`, `etape: 0|1|2`, `donnees: DonneesRestrictions`
  - [x] `DonneesRestrictions = { regime: string | null, allergenes: string[], nonAimes: { valeur: string; seuilTolerance: number }[] }` — exporter ce type pour 3.2b
  - [x] Vue **accueil** : prénom + contexte repas (lieu/date/heure) + SafeBadge confidentialité + bouton primaire « Déclarer mes restrictions »
  - [x] Vue **stepper** : barre de progression (`Étape {etape+1} sur 3`), titre de l'étape, zone de contenu `{children}` placeholder (3 containers : `id="etape-regime"`, `id="etape-allergenes"`, `id="etape-non-aimes"`), navigation (Précédent / Suivant / Valider)
  - [x] Vue **confirme** : message sobre « Merci {prenom}, c'est bien noté ! » (story 3.3 remplacera par le récap complet)
  - [x] Appel mutation `api.participant.enregistrerRestrictions.useMutation({ onSuccess: () => setVue("confirme") })` ; afficher erreur inline (Banner danger) si échec
  - [x] `handleValider` : convertir `donnees` → tableau `restrictions[]` + appeler `mutation.mutate`
  - [x] Cibles tactiles ≥ 44px pour tous les boutons de navigation (NFR7, NFR8)

- [x] **Tâche 4 — Mettre à jour `src/app/p/[token]/page.tsx`** (AC: 1)
  - [x] Remplacer l'import `AccueilParticipant` par `AssistantRestrictions`
  - [x] Passer `token` et `acces` en props : `<AssistantRestrictions token={token} acces={acces} />`
  - [x] Conserver le comportement `LienInvalide` pour les tokens invalides (inchangé)

- [x] **Tâche 5 — Tests** (AC: 4, 5, 6, 7)
  - [x] `src/server/api/routers/participant.test.ts` : ajouter `describe("participantRouter.enregistrerRestrictions")` avec :
    - token connu + restrictions → `deleteMany`+`createMany`+`update REPONDU` appelés via `$transaction`
    - token connu + tableau vide → réussit (pas d'appel `createMany`)
    - token inconnu → `NOT_FOUND`
    - `seuilTolerance` sur `ALLERGIE` → rejeté par Zod
  - [x] `src/components/participant/AssistantRestrictions.test.tsx` (RTL/jsdom) :
    - Render initial → affiche prénom + bouton « Déclarer »
    - Click « Déclarer » → affiche « Étape 1 sur 3 »
    - Click Suivant → « Étape 2 sur 3 »
    - Click Suivant → « Étape 3 sur 3 »
    - Click Précédent depuis étape 2 → « Étape 1 sur 3 »
    - Click Valider → appelle mutation mockée
    - Mock `~/trpc/react` (pattern habituel du projet)

- [x] **Tâche 6 — Validations** (AC: 7)
  - [x] `npm run test` → tout vert (y compris tests 3.1 inchangés)
  - [x] `npm run lint` → vert
  - [x] `npm run typecheck` → vert
  - [x] `SKIP_ENV_VALIDATION=1 npm run build` → vert

### Review Findings

> Revue de code adversariale du 2026-06-26 (3 couches : Blind Hunter, Edge Case Hunter, Acceptance Auditor). Périmètre **combiné 3.1 + 3.2a** (working tree non-committé, fichiers partagés). Tous les ACs des deux stories sont **satisfaits** ; aucune issue High/Med bloquante dans le périmètre coquille. 1 patch · 8 reports · 6 écartés.

- [x] [Review][Patch] Plafonner la taille du tableau `restrictions` (`.max(50)`) sur la mutation publique `enregistrerRestrictions` — anti-abus cohérent avec `MAX_PARTICIPANTS_PAR_REPAS` [src/server/api/routers/participant.ts] — ✅ appliqué + test dédié (83/83)
- [x] [Review][Defer] **[High]** Repas expiré-mais-pas-encore-purgé : `monAcces` ET `enregistrerRestrictions` ne filtrent pas `repas.expiresAt` → accès + écriture de données santé possibles dans la fenêtre ~24h avant la purge cron → **story 3.5** (couvrir lecture ET écriture) [participant.ts]
- [x] [Review][Defer] **[Med]** L'assistant ne distingue pas une erreur terminale (NOT_FOUND/repas purgé en cours de session) d'une erreur transitoire → boucle de retry infinie sur le Banner générique → **story 3.5** (états du lien) [AssistantRestrictions.tsx]
- [x] [Review][Defer] **[Med]** Valeurs de restriction dupliquées persistées (pas de dédup ni d'index unique `@@unique([participantId, type, valeur])`) → **story 3.2b** (définit la collecte des entrées) [participant.ts / schema.prisma]
- [x] [Review][Defer] **[Low]** Dérive de contrat `seuilTolerance` : optionnel côté API mais requis dans `DonneesRestrictions` → le défaut serveur `?? 3` est mort pour le vrai flux client → aligner en **3.2b** [AssistantRestrictions.tsx / participant.ts]
- [x] [Review][Defer] **[Low]** `versRestrictions` ne `trim`/ne contrôle pas le vide de `valeur` côté client → échecs Zod aller-retour une fois les entrées câblées → **3.2b** [AssistantRestrictions.tsx]
- [x] [Review][Defer] **[Low]** Focus géré impérativement via `requestAnimationFrame` → peu fiable en navigation rapide / démontage ; préférer un `useEffect` indexé sur `etape`/`vue` → polish **3.2b** [AssistantRestrictions.tsx]
- [x] [Review][Defer] **[Low]** Soumissions concurrentes = dernier-écrit-gagne (sémantique « remplace ») : acceptable mais à confirmer comme décision produit [participant.ts]
- [x] [Review][Defer] **[Low]** `monAcces` ne renvoie pas `statut` → nécessaire pour la réouverture/modification → **story 3.4** (déjà planifié) [participant.ts]

## Dev Notes

### ⚠️ Pièges critiques (lire avant de coder)

1. **`$transaction` callback — mock non trivial.** Utiliser la forme callback (`$transaction(async tx => { ... })`) pour atomicité garantie. Dans les tests, mocker :
   ```typescript
   $transaction: vi.fn().mockImplementation((fn: (tx: unknown) => Promise<unknown>) =>
     fn({ restriction: { deleteMany, createMany }, participant: { update } })
   ),
   ```
   La forme tableau (`$transaction([op1, op2])`) échoue silencieusement si l'un des opérandes est conditionnel — préférer le callback.

2. **`'use client'` + mutation tRPC.** `AssistantRestrictions` est un Client Component — il importe `api` depuis `~/trpc/react` (et non `~/trpc/server`). Le test doit mocker `~/trpc/react` comme dans `InvitationActions.test.tsx` :
   ```typescript
   vi.mock("~/trpc/react", () => ({
     api: { participant: { enregistrerRestrictions: { useMutation: vi.fn().mockReturnValue({
       mutate: vi.fn(), isPending: false, error: null
     })}}}
   }));
   ```

3. **RSC → Client boundary — passer le token.** La page `page.tsx` est un RSC. Elle récupère le token depuis `params` et doit le passer explicitement en prop à `AssistantRestrictions`. Le Client Component ne peut pas accéder directement aux params du serveur. Le pattern : `<AssistantRestrictions token={token} acces={acces} />`.

4. **`seuilTolerance` sur types non `NON_AIME`.** Le `.refine()` Zod interdit `seuilTolerance` hors `NON_AIME`. En DB, utiliser `seuilTolerance ?? 3` pour les `NON_AIME` dont le seuil n'est pas fourni (valeur neutre). Pour `REGIME` et `ALLERGIE`, ne jamais insérer `seuilTolerance` (laisser `null`).

5. **Frontière de sécurité du router.** `enregistrerRestrictions` est une `publicProcedure` (pas de session). L'autorisation vient **uniquement** du token. Ne jamais exposer d'ID de participant dans l'API : résoudre `token → Participant.id` côté serveur, puis utiliser cet id pour les opérations.

6. **Cascade purge.** `Restriction.participant onDelete: Cascade` est **critique** pour la story 2.5 (purge RGPD) : la suppression d'un `Repas` doit cascader jusqu'aux restrictions. Bien vérifier que `onDelete: Cascade` est sur la relation `Restriction → Participant` (et pas seulement sur `Participant → Repas`, déjà en place).

7. **`AccueilParticipant` devient un composant interne.** La page ne l'importe plus directement. Le composant reste valide pour son test (story 3.1) — ne pas le supprimer. `AssistantRestrictions` reproduit le contenu de la vue accueil inline (prénom, repas, SafeBadge) pour éviter une dépendance circulaire.

8. **Périmètre coquille.** Les 3 conteneurs de step (`id="etape-regime"`, `id="etape-allergenes"`, `id="etape-non-aimes"`) sont vides dans cette story — 3.2b les remplira. Aucun input réel n'est requis dans 3.2a. L'état `donnees` est initialisé à `{ regime: null, allergenes: [], nonAimes: [] }` et reste inchangé dans le shell.

### État réel du projet (vérifié — acquis stories 3.1 + Epic 2)

- **Modèle `Participant`** : `accessToken @unique`, `prenom`, `email?`, `statut StatutParticipant @default(EN_ATTENTE)`, relation `repas`. À **compléter** avec `restrictions Restriction[]` dans cette story.
- **Router `participant`** existant avec `monAcces` (publicProcedure). `enregistrerRestrictions` s'ajoute dans le même fichier.
- **`publicProcedure`** dans `src/server/api/trpc.ts` — aucune session, token = seule autorisation.
- **Appel client tRPC** : `import { api } from "~/trpc/react"` (jamais `~/trpc/server` dans un `'use client'`).
- **Composants UI Cocon** : `Button`, `Banner` (danger pour erreur mutation), `SafeBadge` → `~/components/ui/*`.
- **Mock pattern router test** : `vi.mock("~/server/auth"...)`, `vi.mock("~/server/db"...)`, `vi.mock("~/env"...)` puis `appRouter.createCaller({ session: null, db, headers })`.
- **Formatage date** : `new Intl.DateTimeFormat("fr-FR", { dateStyle: "long", timeZone: "Europe/Paris" })` (cohérent avec AccueilParticipant).

### Périmètre — hors de cette story

- **Contenu des 3 étapes** : sélecteurs de régime, liste des allergènes UE, non-aimés + seuil de tolérance → **story 3.2b** (les 3 containers `id="etape-*"` accueilleront ces composants).
- **Récapitulatif complet** : la vue "confirme" de 3.2a est un message sobre — le récap détaillé arrive en **story 3.3** (`Restriction[]` sera lue depuis la DB).
- **Modification** : rouvrir le lien après `REPONDU` et retrouver ses saisies → **story 3.4** (nécessite aussi de retourner `statut` dans `monAcces`).
- **États expiré/repas clos** → story 3.5.
- **Migration DB** : `npx prisma migrate dev` (hors CI) ou `npx prisma db push` (dev local). Pas de seed nécessaire.

### Architecture du composant `AssistantRestrictions`

```
AssistantRestrictions ('use client')
├── vue === "accueil"
│   ├── [AccueilParticipant content inline]  ← prénom + repas + SafeBadge
│   └── Button "Déclarer mes restrictions"  → setVue("stepper")
├── vue === "stepper"
│   ├── StepperHeader  ← "Étape {etape+1} sur 3" + titre de l'étape
│   ├── StepContent    ← conteneur vide (id="etape-regime|allergenes|non-aimes")
│   └── StepperNav     ← Précédent / Suivant / Valider (avec isPending)
└── vue === "confirme"
    └── "Merci {prenom}, c'est bien noté !"  ← remplacé en 3.3
```

Titres des étapes : `["Régime alimentaire", "Allergies", "Aliments non-aimés"]`

### Schéma attendu (à ajouter dans `prisma/schema.prisma`)

```prisma
enum TypeRestriction {
    REGIME
    ALLERGIE
    NON_AIME
}

model Restriction {
    id             String          @id @default(cuid())
    participant    Participant     @relation(fields: [participantId], references: [id], onDelete: Cascade)
    participantId  String
    type           TypeRestriction
    valeur         String
    seuilTolerance Int?            // 0-5, seulement pour NON_AIME
    createdAt      DateTime        @default(now())

    @@index([participantId])
}
```

Sur `Participant` : ajouter `restrictions Restriction[]`.

### Signature de `enregistrerRestrictions`

```typescript
enregistrerRestrictions: publicProcedure
  .input(z.object({
    token: z.string().min(1),
    restrictions: z.array(
      z.object({
        type: z.enum(["REGIME", "ALLERGIE", "NON_AIME"]),
        valeur: z.string().min(1).max(200).trim(),
        seuilTolerance: z.number().int().min(0).max(5).optional(),
      }).refine(
        (r) => r.type === "NON_AIME" || r.seuilTolerance === undefined,
        { message: "seuilTolerance réservé aux aliments non-aimés" }
      )
    ),
  }))
  .mutation(async ({ ctx, input }) => {
    const participant = await ctx.db.participant.findUnique({
      where: { accessToken: input.token },
      select: { id: true },
    });
    if (!participant) throw new TRPCError({ code: "NOT_FOUND" });

    await ctx.db.$transaction(async (tx) => {
      await tx.restriction.deleteMany({ where: { participantId: participant.id } });
      if (input.restrictions.length > 0) {
        await tx.restriction.createMany({
          data: input.restrictions.map((r) => ({
            participantId: participant.id,
            type: r.type,
            valeur: r.valeur,
            seuilTolerance: r.type === "NON_AIME" ? (r.seuilTolerance ?? 3) : null,
          })),
        });
      }
      await tx.participant.update({
        where: { id: participant.id },
        data: { statut: "REPONDU" },
      });
    });

    return { ok: true };
  }),
```

### Accessibilité / UX (NFR7, NFR8, UX-DR3)

- **Mobile-first** : stepper vertical, cibles boutons ≥ 44px, texte lisible sans zoom.
- **ARIA** : chaque étape a un `aria-label` sur son container ; le bouton désactivé en-cours de soumission (`disabled={isPending}`).
- **Focus management** : à la transition d'étape, déplacer le focus sur le titre de l'étape entrante (`useRef` + `.focus()`).
- **Pas de couleur seule** : le stepper progress utilise `aria-current="step"` en plus de l'indicateur visuel.

### Testing standards

- **`participant.test.ts`** (node, `// @vitest-environment node`) : `$transaction` mocké comme callback, asserter que `deleteMany` est appelé avant `createMany`, que `update` est appelé avec `statut: "REPONDU"`.
- **`AssistantRestrictions.test.tsx`** (jsdom, RTL) : `vi.mock("~/trpc/react", ...)` + navigation de l'assistant.
- Ne pas tester le contenu des étapes (vide dans 3.2a — testé en 3.2b).

### Definition of Done manuelle (utilisateur, hors agent)

1. DB up + un `Participant` existant (créé via l'espace organisateur).
2. Ouvrir `/p/{token}` → accueil avec prénom + bouton « Déclarer mes restrictions ».
3. Parcourir les 3 étapes (vides) → cliquer Valider → message « Merci ».
4. Vérifier en DB (`prisma studio`) : `Participant.statut = "REPONDU"`, `Restriction[]` vide (ou contenant les items du shell si 3.2b est partiellement implémenté).
5. Vérifier que l'espace organisateur (suivi 2.4) affiche le participant comme « A répondu ».

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 3.2] (énoncé, AC, note découpage)
- [Source: _bmad-output/planning-artifacts/architecture.md#Authentication & Security] (token = auth participant, publicProcedure)
- [Source: _bmad-output/implementation-artifacts/3-1-acces-participant-par-lien-sans-compte.md] (pattern page.tsx RSC, participant router, tests)
- [Source: _bmad-output/implementation-artifacts/2-2-ajouter-des-participants.md] (modèle Participant, accessToken)
- [Source: _bmad-output/implementation-artifacts/2-5-purge-planifiee-des-repas-expires.md] (cascade Restriction → Participant)

## Dev Agent Record

### Agent Model Used

claude-opus-4-8 (bmad-dev-story)

### Debug Log References

- Router : `npx vitest run participant.test.ts` → **7/7** ✅ (2 monAcces + 5 enregistrerRestrictions).
- Composant : `AssistantRestrictions.test.tsx` → **4/4** ✅ (le `onSuccess` de la mutation est testé via `act(() => onSuccessCapture())` — un appel hors `act` ne propage pas le `setState`).
- Suite complète : **82/82** ✅ (73 → 82, +9). `lint` ✅ · `typecheck` ✅ · `SKIP_ENV_VALIDATION=1 build` ✅ (`/p/[token]` = 3.19 kB, client component embarqué).
- `npx prisma generate` relancé après l'ajout du modèle `Restriction` (sinon le client `generated/prisma` ne typait pas `restriction`/`TypeRestriction`).

### Completion Notes List

- ✅ **Modèle `Restriction`** (`TypeRestriction` REGIME/ALLERGIE/NON_AIME, `seuilTolerance Int?`, `onDelete: Cascade` vers `Participant`) + relation `Participant.restrictions[]`. La cascade garantit la purge RGPD (story 2.5) jusqu'aux données de santé.
- ✅ **`enregistrerRestrictions`** (`publicProcedure`, token = seule auth) : résout `token → Participant.id` côté serveur, puis `$transaction` atomique `deleteMany` + `createMany` (conditionnel) + `update statut REPONDU`. Zod `.refine` interdit `seuilTolerance` hors `NON_AIME` ; seuil neutre `3` par défaut pour un non-aimé sans seuil ; `null` pour régime/allergie. Tableau vide accepté (aucune restriction obligatoire).
- ✅ **`AssistantRestrictions`** (`'use client'`) : 3 vues (accueil → stepper 3 étapes → confirmation). Barre « Étape X sur 3 », nav Précédent (masqué étape 1) / Suivant / Valider (étape 3 seulement). État `donnees` conservé entre étapes. Focus déplacé sur le titre de l'étape entrante (`useRef` + `requestAnimationFrame`), `aria-current="step"`, cibles ≥ 44px (Button `min-h-11`). Erreur de mutation → `Banner` danger.
- ✅ **`/p/[token]`** câble `AssistantRestrictions` (token + acces) ; comportement `LienInvalide` inchangé.
- **Coquille assumée** : les 3 conteneurs `id="etape-*"` sont vides (3.2b les remplit). `DonneesRestrictions` exporté pour que 3.2b s'y branche. `versRestrictions()` aplatit déjà l'état vers le contrat API → 3.2b n'a qu'à alimenter l'état.
- **`AccueilParticipant`** conservé (toujours testé, story 3.1) mais n'est plus monté par la page — `AssistantRestrictions` reproduit son contenu d'accueil inline.
- **À faire par l'utilisateur (DoD manuelle)** : `npx prisma db push` (créer la table `Restriction`) ; ouvrir `/p/{token}`, parcourir les 3 étapes (vides), Valider → écran « Merci » ; vérifier en DB `statut = REPONDU` et que le suivi 2.4 affiche « A répondu ».

### File List

- `prisma/schema.prisma` (MODIFIÉ — `TypeRestriction`, `Restriction`, `Participant.restrictions[]`)
- `src/server/api/routers/participant.ts` (MODIFIÉ — `enregistrerRestrictions`)
- `src/server/api/routers/participant.test.ts` (MODIFIÉ — +5 tests `enregistrerRestrictions`)
- `src/app/p/[token]/page.tsx` (MODIFIÉ — monte `AssistantRestrictions`)
- `src/components/participant/AssistantRestrictions.tsx` (NOUVEAU)
- `src/components/participant/AssistantRestrictions.test.tsx` (NOUVEAU)

### Change Log

- 2026-06-26 : Story 3.2a implémentée — modèle `Restriction` (cascade), router `enregistrerRestrictions` (token-scopé, `$transaction`, statut → REPONDU), assistant 3 étapes (coquille + navigation + persistance). Tests 82/82, lint/typecheck/build verts. Statut → review.
- 2026-06-26 : Revue de code (combiné 3.1 + 3.2a, 3 couches). Tous ACs satisfaits. Patch P1 appliqué (plafond `.max(50)` sur `enregistrerRestrictions` + test). 8 reports tracés (3.5 / 3.2b / 3.4 / décision produit). Tests 83/83. Statut → done.
