import { timingSafeEqual } from "node:crypto";

import { env } from "~/env";
import { db } from "~/server/db";
import { purgerRepasExpires } from "~/server/purge";

// Jamais mise en cache : la purge doit s'exécuter à chaque appel du cron.
export const dynamic = "force-dynamic";

/** Comparaison à temps constant du header d'autorisation (anti timing-attack). */
function autorisationValide(authorization: string | null): boolean {
  if (!authorization) return false;
  const attendu = Buffer.from(`Bearer ${env.CRON_SECRET}`);
  const fourni = Buffer.from(authorization);
  return fourni.length === attendu.length && timingSafeEqual(fourni, attendu);
}

/**
 * Route de purge planifiée (Vercel Cron). Protégée par `CRON_SECRET` :
 * non déclenchable publiquement. Ne logue aucune donnée de santé (NFR6).
 */
export async function GET(request: Request) {
  if (!autorisationValide(request.headers.get("authorization"))) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { count } = await purgerRepasExpires(db);
  return Response.json({ purges: count });
}
