import type { PrismaClient } from "../../generated/prisma";

/**
 * Supprime les repas dont la date d'expiration est dépassée (garde-fou RGPD).
 * La suppression d'un Repas cascade sur ses Participant(s) (onDelete: Cascade).
 * Pur (pas de dépendance à un client réel) → testable avec un `db` mocké.
 */
export async function purgerRepasExpires(
  db: Pick<PrismaClient, "repas">,
  maintenant: Date = new Date(),
) {
  return db.repas.deleteMany({ where: { expiresAt: { lt: maintenant } } });
}
