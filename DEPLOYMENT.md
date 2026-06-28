# Déploiement de CookWho (Vercel)

Guide pas à pas pour mettre CookWho en production. Stack : Next.js 15 (App Router) · Prisma 6 / PostgreSQL · Auth.js v5 (lien magique via Resend) · tRPC v11 · Vercel Cron.

---

## 1. Prérequis (comptes)

- **Vercel** — hébergement + cron natif.
- **Une base PostgreSQL managée** — au choix : Vercel Postgres, [Neon](https://neon.tech), [Supabase](https://supabase.com). Récupère une `DATABASE_URL` (chaîne `postgresql://…`).
- **Resend** — envoi des e-mails (lien magique de connexion + invitations). Crée une **clé API** et **vérifie un domaine** (DNS SPF/DKIM) pour l'expéditeur.

---

## 2. Variables d'environnement

Six variables (schéma validé dans [`src/env.js`](src/env.js)). À définir dans **Vercel → Project → Settings → Environment Variables** (scope **Production**, et **Preview** si tu veux des previews fonctionnelles).

| Variable | Rôle | Comment l'obtenir |
|----------|------|-------------------|
| `DATABASE_URL` | Connexion Postgres | Fournie par ton provider. Active le **pooling** si dispo (Neon/Supabase : URL « pooled » pour le runtime). |
| `AUTH_SECRET` | Chiffrement des sessions Auth.js | `npx auth secret` ou `openssl rand -base64 32` |
| `AUTH_RESEND_KEY` | Clé API Resend (e-mails) | Resend → API Keys |
| `EMAIL_FROM` | Expéditeur de marque | `CookWho <bonjour@ton-domaine>` (domaine **vérifié** dans Resend). Pour un tout premier test sans DNS : `CookWho <onboarding@resend.dev>` (n'envoie qu'à l'adresse du compte Resend). |
| `APP_URL` | URL publique (base des liens `/p/{token}`) | L'URL de prod, ex. `https://cookwho.vercel.app` — **doit** correspondre au domaine déployé, sinon les liens d'invitation seront faux. |
| `CRON_SECRET` | Protège la route de purge | `openssl rand -hex 32` |

> `NODE_ENV` est géré automatiquement par Vercel (`production`). Ne pas le définir à la main.

---

## 3. Base de données : appliquer le schéma

Le schéma est **versionné** dans [`prisma/migrations/`](prisma/migrations) (migration `0_init`). En production on applique avec `prisma migrate deploy` (jamais `db push`).

**Recommandé — l'intégrer au build Vercel** pour que chaque déploiement aligne la base :

> Vercel → Settings → **Build & Development Settings → Build Command** (override) :
> ```
> prisma migrate deploy && next build
> ```

- `postinstall` (déjà dans `package.json`) lance `prisma generate` à l'installation → le client typé est prêt.
- `prisma migrate deploy` applique les migrations en attente (idempotent : ne fait rien si à jour).
- La base doit être **vide ou déjà gérée par migrations**. Si une base a déjà été créée via `db push`, voir « Baseline » plus bas.

**Alternative (one-shot, hors build)** — appliquer une fois depuis ta machine, `DATABASE_URL` pointant la prod :
```
npx prisma migrate deploy
```

---

## 4. Déployer sur Vercel

1. **Importer le repo** GitHub `philzeg47/Cookwho` dans Vercel (branche `main`).
2. **Framework Preset** : Next.js (auto-détecté).
3. **Build Command** : override → `prisma migrate deploy && next build` (étape 3).
4. **Variables d'env** : les 6 ci-dessus (étape 2), scope Production.
5. **Deploy.**

Le **cron de purge** est déjà déclaré dans [`vercel.json`](vercel.json) (`/api/cron/purge`, tous les jours à **03:00 UTC**). Vercel l'enregistre automatiquement et envoie `Authorization: Bearer $CRON_SECRET` — la route ([`route.ts`](src/app/api/cron/purge/route.ts)) le vérifie en temps constant. Aucune config cron supplémentaire.

---

## 5. Vérifications post-déploiement

- [ ] **Migration appliquée** : la table `Repas` (avec `platRetenuRef`/`platRetenuTitre`) et `RecetteCache` existent (Prisma Studio ou console du provider).
- [ ] **Connexion organisateur** : `/connexion` → saisir un e-mail → recevoir le lien magique (Resend) → arriver sur `/repas`.
- [ ] **Lien d'invitation** : créer un repas + un participant → le lien copié pointe bien vers `${APP_URL}/p/{token}` (vérifie `APP_URL`).
- [ ] **Génération** : un repas avec des répondants → « Générer des recettes » renvoie des plats (la source Marmiton fait un appel réseau au runtime — voir Notes).
- [ ] **Cron** : Vercel → Project → **Crons** → déclencher manuellement `/api/cron/purge` → réponse `{ "purges": n }` (et `401` si appelé sans le bon Bearer).

---

## 6. Notes & pièges

- **Auth.js sur Vercel** : l'hôte est détecté automatiquement. Si une redirection de connexion échoue, définir `AUTH_TRUST_HOST=true` (et au besoin `AUTH_URL=${APP_URL}`).
- **Resend / `EMAIL_FROM`** : tant que le domaine n'est pas vérifié, n'utilise `onboarding@resend.dev` que pour des tests (livraison limitée à l'e-mail du compte). Vérifie le domaine avant tout usage réel.
- **Source de recettes (`marmiton-api`)** : c'est un scraper non-officiel appelé **au runtime** dans la génération. Il peut être lent ou se faire bloquer ; le **cache `RecetteCache`** (TTL 30 j) + le repli de résilience atténuent. Surveiller ; prévoir une source de secours post-V1 (cf. `deferred-work.md`).
- **Fuseau horaire** : l'affichage des dates est en `Europe/Paris` ; le cron de purge tourne à **03:00 UTC** (≈ 04:00–05:00 Paris). Les `expiresAt` sont stockés en UTC — cohérent.
- **RGPD/NFR6** : la purge planifiée supprime les repas expirés (et, en cascade, participants + restrictions) ; aucune donnée de santé n'est journalisée.

---

## Baseline (si une base existe déjà via `db push`)

Si tu as déjà poussé le schéma sur une base avec `prisma db push` (donc sans historique de migration), marque la migration init comme « déjà appliquée » **avant** le premier `migrate deploy`, sinon Prisma tentera de recréer les tables :
```
npx prisma migrate resolve --applied 0_init
```
Pour une base **neuve**, ignore cette section : `migrate deploy` crée tout.
