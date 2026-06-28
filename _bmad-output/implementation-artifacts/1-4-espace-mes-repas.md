---
baseline_commit: f27b0499b3fcbc621d8377653ec11bb732cd8787
---

# Story 1.4: Espace « Mes repas »

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As an organisateur connecté,
I want une page d'accueil listant mes repas,
so that je retrouve mes repas et peux en créer un nouveau.

## Acceptance Criteria

1. **Given** une session organisateur active, **When** j'ouvre l'espace `/repas`, **Then** je vois ma liste de repas. En V1 la liste est **vide par construction** (le modèle `Repas` n'existe pas encore — story 2.1) : on affiche l'état vide.
2. **Given** l'espace « Mes repas », **When** il est rendu, **Then** un bouton **« Créer un repas »** est présent (pointe vers la future route de création, story 2.1).
3. **Given** l'état vide, **When** il s'affiche, **Then** il est **accueillant** : message d'onboarding chaleureux (icône + texte, ton Cocon), pas une page nue (revue UX).
4. **Given** un organisateur **non connecté**, **When** il tente d'ouvrir `/repas`, **Then** il est **redirigé vers `/connexion`** (la frontière protège tout le segment organisateur).
5. **Given** que je suis connecté, **When** je suis dans mon espace, **Then** je peux **me déconnecter** (la connexion 1.3 n'a pas de sortie sans cela).
6. **Given** les validations, **When** je lance `npm run test`, `npm run lint`, `npm run typecheck`, `build`, **Then** tout reste vert.

## Tasks / Subtasks

- [x] **Tâche 1 — Garde d'authentification du segment organisateur** (AC: 4)
  - [x] `src/app/(organisateur)/layout.tsx` (Server Component async) : `auth()` → `redirect("/connexion")` si pas de `session?.user`.
  - [x] Protège tout le groupe `(organisateur)` (réutilisable par les routes 2.x), garde non dupliquée.
- [x] **Tâche 2 — Page « Mes repas »** (AC: 1, 2)
  - [x] `src/app/(organisateur)/repas/page.tsx` (URL `/repas`) : titre « Mes repas » + état vide + bouton « Créer un repas ».
  - [x] Aucun modèle `Repas`, aucun appel tRPC/DB — liste vide par construction (V1).
  - [x] Bouton « Créer un repas » = `<Link href="/repas/creer">` vers la future route (story 2.1).
- [x] **Tâche 3 — Composant état vide accueillant** (AC: 3)
  - [x] `src/components/organisateur/EtatVideRepas.tsx` : picto 🍲 + titre + phrase d'onboarding + CTA `Button` (1.2).
  - [x] Icône + texte (NFR8), responsive, microcopy FR chaleureuse.
- [x] **Tâche 4 — Déconnexion** (AC: 5)
  - [x] En-tête du layout `(organisateur)` : bouton « Se déconnecter » (Button variant `text`) via Server Action `signOut({ redirectTo: "/connexion" })`.
- [x] **Tâche 5 — Tests** (AC: 1, 3, 4, 6)
  - [x] `src/components/organisateur/EtatVideRepas.test.tsx` : onboarding + bouton « Créer un repas ».
  - [x] `src/app/(organisateur)/layout.test.tsx` : `auth` null → `redirect("/connexion")` appelé ; session présente → pas de redirection.
- [x] **Tâche 6 — Validations** (AC: 6)
  - [x] `npm run test` → 21/21 ✅ · `npm run lint` ✅ · `npm run typecheck` ✅.
  - [x] `SKIP_ENV_VALIDATION=1 npm run build` ✅ (route `/repas` générée, rendu dynamique).

## Dev Notes

### ⚠️ Pièges critiques (lire avant de coder)

1. **Le modèle `Repas` N'EXISTE PAS encore et ne doit PAS être créé ici.** L'architecture place le schéma `Repas`/`Participant`/`Restriction` dans **l'Epic 2** (story 2.1 « créer un repas »). Cette story 1.4 ne fait que la **coquille protégée + l'état vide**. Toute requête DB de repas est hors périmètre — la liste est vide par construction. (Source : [architecture.md#Decision Impact Analysis] séquence, [epics.md#Story 2.1].)
2. **Garde d'auth dans le LAYOUT du groupe, pas page par page.** Mettre `auth()` + `redirect("/connexion")` dans `src/app/(organisateur)/layout.tsx` protège tout le segment organisateur (réutilisé par 2.x). C'est la matérialisation de la frontière orga/participant côté UI.
3. **`(organisateur)` est un Route Group** (parenthèses) : il **n'apparaît pas dans l'URL**. `app/(organisateur)/repas/page.tsx` → URL `/repas` (cohérent avec le `redirectTo: "/repas"` posé en story 1.3). La home `/` (`app/page.tsx`) reste inchangée.
4. **`redirect()` se lance via une exception** (Next App Router) : l'appeler hors d'un `try/catch` qui l'avalerait. Dans un Server Component, l'appel direct suffit.

### État réel du projet (vérifié)
- **Next 15.5.x (App Router)**, React 19, **Auth.js v5** (`next-auth 5.0.0-beta.25`), tRPC v11, Tailwind v4, Prisma. Server Components par défaut.
- **`~/server/auth`** exporte déjà `auth`, `signIn`, `signOut`, `handlers` (cf. `src/server/auth/index.ts`). Utiliser `auth()` pour lire la session côté RSC et `signOut()` en Server Action.
- **Session** : peuplée avec `session.user.id` (callback déjà en place dans `config.ts`). `auth()` renvoie `null` si non connecté.
- **tRPC** : `protectedProcedure` existe déjà (vérifie `ctx.session?.user`) — pas utilisé dans cette story (aucune procédure métier ici), mais c'est le pattern pour 2.x.
- **Composants disponibles (story 1.2)** : `Button` (variants primary/secondary/text, focus ring corrigé), `Input`, `Chip`, `Banner` (info/danger), `SafeBadge`. Importer depuis `~/components/ui/*`.
- **Conventions** (architecture) : composants `PascalCase` ; `components/organisateur/` pour l'UI orga ; chaînes d'UI en français ; alias `~/*` → `src/*`.

### Patterns de référence (App Router + Auth.js v5)
```tsx
// src/app/(organisateur)/layout.tsx
import { redirect } from "next/navigation";
import { auth, signOut } from "~/server/auth";
import { Button } from "~/components/ui/Button";

export default async function OrganisateurLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/connexion");

  return (
    <div>
      <header className="...">
        {/* … */}
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/connexion" });
          }}
        >
          <Button variant="text" type="submit">Se déconnecter</Button>
        </form>
      </header>
      {children}
    </div>
  );
}
```
```tsx
// src/app/(organisateur)/repas/page.tsx
import { EtatVideRepas } from "~/components/organisateur/EtatVideRepas";
export const metadata = { title: "Mes repas — CookWho" };
export default function MesRepasPage() {
  // V1 : aucune entité Repas → liste vide par construction.
  return (
    <main className="...">
      <h1>Mes repas</h1>
      <EtatVideRepas />
    </main>
  );
}
```

### Accessibilité & UX
- État vide = **accueillant** (UX-DR4 « vide ») : picto doux + titre + phrase d'onboarding + CTA, pas une page nue.
- Sens jamais porté par la seule couleur (NFR8) ; bouton ≥ 44px (garanti par `min-h-11` du `Button`).
- Microcopy chaleureuse (EXPERIENCE.md Voice & Tone), p. ex. « Aucun repas pour l'instant — créons le premier ensemble. »

### Testing standards
- **Vitest + RTL/jsdom** pour les composants ; co-localiser les tests.
- Tester l'**état vide** (composant présentational, facile) et la **garde de redirection** (mock de `~/server/auth` → `auth` renvoie `null`, mock de `next/navigation` → `redirect` espionné). Cf. la story 1.3 : mocker `~/server/auth` évite de charger le runtime next-auth (sinon `next/server` casse sous Vitest).
- Le flux complet connecté/déconnecté (vraie session) relève d'un test e2e / d'une vérif manuelle.

### Périmètre — hors de cette story
- Création réelle d'un `Repas`, modèle Prisma, route `/repas/creer` fonctionnelle → **story 2.1**.
- Ajout de participants, invitations, suivi des réponses → stories 2.2–2.4.
- Démo T3 `Post`/router `post`/`_components/post.tsx` : toujours laissée en l'état (hors périmètre).

### Project Structure Notes
- Nouveaux : `src/app/(organisateur)/layout.tsx`, `src/app/(organisateur)/repas/page.tsx`, `src/components/organisateur/EtatVideRepas.tsx`, + leurs tests.
- Aucune nouvelle dépendance, aucune migration de schéma.
- Vérifier que la home `/` (app/page.tsx) et `/connexion` ne sont pas affectées par le groupe `(organisateur)`.

### References
- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.4] (énoncé + AC)
- [Source: _bmad-output/planning-artifacts/architecture.md#Project Structure & Boundaries] (`app/(organisateur)/repas/`, frontière orga)
- [Source: _bmad-output/planning-artifacts/architecture.md#Frontend Architecture] (Server Components, App Router)
- [Source: _bmad-output/implementation-artifacts/1-3-connexion-organisateur-par-lien-magique.md] (auth `auth()`/`signIn`/`signOut`, `redirectTo: "/repas"`, mock `~/server/auth` en test)
- [Source: _bmad-output/implementation-artifacts/1-2-bibliotheque-de-composants-ui-de-base.md] (Button/Banner réutilisables)
- [Source: _bmad-output/planning-artifacts/ux-designs/ux-CookWho-2026-06-19/EXPERIENCE.md#State Patterns] (état vide accueillant, Voice & Tone)

## Dev Agent Record

### Agent Model Used

claude-opus-4-8 (bmad-dev-story)

### Debug Log References

- `npm run test` → **21/21** ✅ (10 fichiers ; +4 tests pour 1.4 : état vide ×2, garde layout ×2).
- `npm run lint` ✅ · `npm run typecheck` ✅ · `SKIP_ENV_VALIDATION=1 npm run build` ✅ (Next 15.5.19 ; `/repas` en rendu dynamique car `auth()`).
- Test de la garde : `auth`/`next.navigation.redirect` mockés (évite de charger le runtime next-auth, cf. story 1.3).

### Completion Notes List

- ✅ Segment organisateur protégé par `src/app/(organisateur)/layout.tsx` : `auth()` → `redirect("/connexion")` si non connecté (frontière réutilisable par les routes 2.x).
- ✅ Page `/repas` avec état vide accueillant ; **aucun modèle `Repas` créé** (réservé story 2.1) — liste vide par construction, zéro appel DB/tRPC.
- ✅ Composant `EtatVideRepas` (picto + onboarding + CTA), réutilise `Button` (1.2).
- ✅ Déconnexion via Server Action `signOut({ redirectTo: "/connexion" })` dans l'en-tête.
- ✅ Route Group `(organisateur)` → URL `/repas` (cohérent avec le `redirectTo` posé en 1.3) ; home `/` et `/connexion` inchangées.
- **Hors périmètre (laissé en l'état)** : route `/repas/creer` (404 attendu jusqu'à 2.1), modèle `Repas`, démo T3 `Post`.

### File List

- `src/app/(organisateur)/layout.tsx` (NOUVEAU — garde auth + en-tête + déconnexion)
- `src/app/(organisateur)/repas/page.tsx` (NOUVEAU — page « Mes repas »)
- `src/components/organisateur/EtatVideRepas.tsx` (NOUVEAU — état vide accueillant)
- `src/app/(organisateur)/layout.test.tsx` (NOUVEAU — test de la garde de redirection)
- `src/components/organisateur/EtatVideRepas.test.tsx` (NOUVEAU — test de l'état vide)

### Review Findings (revue groupée 1.3–1.5, 2026-06-22)

- [x] [Review][Patch] Test de garde rendu probant — le mock de `redirect` **lève** désormais (NEXT_REDIRECT) ; le test asserte que `OrganisateurLayout` rejette ET que `redirect("/connexion")` est appelé. [src/app/(organisateur)/layout.test.tsx]
- [x] [Review][Defer] Lien mort `/repas/creer` — le bouton « Créer un repas » pointe vers une route inexistante (404). Intentionnel : route créée en story 2.1. [src/components/organisateur/EtatVideRepas.tsx:20] — deferred, créé en story 2.1

### Change Log

- 2026-06-22 : Story 1.4 implémentée — espace « Mes repas » (segment `(organisateur)` protégé, état vide accueillant, déconnexion). Tests 21/21, lint/typecheck/build verts. Statut → review.
- 2026-06-22 : Revue de code — test de garde rendu probant (mock `redirect` qui lève) ; lien mort `/repas/creer` déféré (story 2.1). Statut → done.
