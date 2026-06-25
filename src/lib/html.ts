/**
 * Échappe les caractères spéciaux HTML pour insérer en sécurité une valeur
 * fournie par l'utilisateur dans un corps HTML (ex. email d'invitation).
 */
export function echapperHtml(valeur: string): string {
  return valeur
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
