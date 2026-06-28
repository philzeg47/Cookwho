import { randomBytes } from "node:crypto";

/**
 * Génère un token d'accès participant cryptographiquement non-devinable.
 * 32 octets = 256 bits (NFR4), encodés en base64url (URL-safe : [A-Za-z0-9_-]).
 * Sert de base à l'URL `/p/{token}`.
 */
export function genererAccessToken(): string {
  return randomBytes(32).toString("base64url");
}
