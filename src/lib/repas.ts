/** Durée de rétention d'un repas après sa date (garde-fou RGPD — story 2.5). */
export const TTL_REPAS_JOURS = 30;

/**
 * Calcule la date d'expiration d'un repas : date du repas + {@link TTL_REPAS_JOURS} jours.
 * Pur, sans I/O — testable.
 */
export function computeExpiresAt(date: Date): Date {
  const expires = new Date(date);
  expires.setDate(expires.getDate() + TTL_REPAS_JOURS);
  return expires;
}
