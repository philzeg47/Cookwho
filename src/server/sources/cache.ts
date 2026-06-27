// Cache Postgres des recettes (story 4.2). Fonctions prenant `db` en paramètre
// (façon `src/server/purge.ts`) → testables avec un client Prisma mocké, sans
// base réelle. Le cache assure la RÉSILIENCE : si la source casse, on resert
// le cache plutôt que d'échouer.

import type {
  CriteresRecherche,
  RecetteBrute,
  SourceDeRecettes,
} from "./SourceDeRecettes";

/** TTL du cache (cohérent avec le TTL des repas, 30 j). */
export const TTL_CACHE_JOURS = 30;

// Type minimal du client Prisma utilisé ici (sous-ensemble de RecetteCache).
type DbCache = {
  recetteCache: {
    findMany: (args: unknown) => Promise<RecetteBrute[]>;
    upsert: (args: unknown) => Promise<unknown>;
  };
};

function dateExpiration(maintenant: Date): Date {
  return new Date(maintenant.getTime() - TTL_CACHE_JOURS * 24 * 60 * 60 * 1000);
}

/** Recettes en cache pour une source, NON expirées (fraîches). */
export async function lireCache(
  db: DbCache,
  source: string,
  { maintenant = new Date(), limite }: { maintenant?: Date; limite?: number } = {},
): Promise<RecetteBrute[]> {
  return db.recetteCache.findMany({
    where: { source, fetchedAt: { gt: dateExpiration(maintenant) } },
    select: { source: true, sourceRef: true, titre: true, ingredientsTexte: true },
    orderBy: { fetchedAt: "desc" },
    ...(typeof limite === "number" ? { take: limite } : {}),
  });
}

/** Upsert idempotent des recettes par (source, sourceRef). */
export async function ecrireCache(
  db: DbCache,
  recettes: RecetteBrute[],
  { maintenant = new Date() }: { maintenant?: Date } = {},
): Promise<void> {
  for (const r of recettes) {
    const donnees = {
      titre: r.titre,
      ingredientsTexte: r.ingredientsTexte,
      fetchedAt: maintenant,
    };
    await db.recetteCache.upsert({
      where: { source_sourceRef: { source: r.source, sourceRef: r.sourceRef } },
      create: { source: r.source, sourceRef: r.sourceRef, ...donnees },
      update: donnees,
    });
  }
}

/**
 * Récupère des recettes en passant par le cache (fetch-through) :
 *  - cache frais présent (et pas de rafraîchissement forcé) → resservi SANS
 *    appeler la source ;
 *  - sinon → appel source, mise en cache, retour ;
 *  - RÉSILIENCE : si la source échoue, on resert le cache (même expiré) si
 *    disponible ; sinon l'erreur remonte.
 */
export async function recupererRecettes(
  db: DbCache,
  source: SourceDeRecettes,
  criteres: CriteresRecherche = {},
  {
    rafraichir = false,
    maintenant = new Date(),
  }: { rafraichir?: boolean; maintenant?: Date } = {},
): Promise<RecetteBrute[]> {
  if (!rafraichir) {
    const frais = await lireCache(db, source.nom, {
      maintenant,
      limite: criteres.limite,
    });
    if (frais.length > 0) return frais;
  }

  try {
    const recettes = await source.chercher(criteres);
    await ecrireCache(db, recettes, { maintenant });
    return recettes;
  } catch (erreur) {
    // La source a cassé : on resert le cache (même périmé) s'il existe, borné.
    const repli = await db.recetteCache.findMany({
      where: { source: source.nom },
      select: { source: true, sourceRef: true, titre: true, ingredientsTexte: true },
      orderBy: { fetchedAt: "desc" },
      ...(typeof criteres.limite === "number" ? { take: criteres.limite } : {}),
    });
    if (repli.length > 0) return repli;
    throw erreur;
  }
}
