// Normalisation d'un ingrédient en texte libre vers une forme canonique
// « matchable » par la détection (story 4.1b). Module /core PUR (zéro I/O).
//
// Forme de sortie : minuscules, sans accents/diacritiques, ligatures expansées
// (œ→oe, æ→ae), tout séparateur/ponctuation réduit à un espace simple, sans
// espace en début/fin. Aucune détection, aucun stemming/désingularisation ici.

/**
 * Normalise une chaîne d'ingrédient brute vers sa forme canonique.
 * Pure, déterministe, idempotente : `normalize(normalize(x)) === normalize(x)`.
 */
export function normalize(brut: string): string {
  return brut
    .toLowerCase()
    // Ligatures : NFD ne les décompose pas → remplacement explicite AVANT NFD.
    .replace(/œ/g, "oe")
    .replace(/æ/g, "ae")
    // Décomposition Unicode puis suppression des diacritiques (accents).
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    // Tout ce qui n'est pas alphanumérique ASCII devient un séparateur simple.
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}
