// Le « curseur » — scoring des goûts (aliments non-aimés + seuil de tolérance).
// Module /core PUR. NÉGOCIABLE : le curseur ne franchit jamais le mur ; il ne
// fait que PÉNALISER le classement (plus la pénalité est basse, mieux c'est).

import { contientTokens, tokeniser } from "../texte";

/** Borne haute du seuil (cohérente avec la borne serveur Zod, story 4.1b). */
export const SEUIL_TOLERANCE_MAX = 5;

export type NonAime = { valeur: string; seuilTolerance: number };

/** Poids d'un non-aimé présent : décroît avec le seuil (strict → fort, souple → 0). */
function poids(seuilTolerance: number): number {
  return Math.max(0, SEUIL_TOLERANCE_MAX - seuilTolerance);
}

/**
 * Pénalité d'une recette pour les goûts du groupe : somme des poids des
 * non-aimés PRÉSENTS dans la recette. Un non-aimé absent n'ajoute rien.
 * Déterministe.
 */
export function curseur(ingredients: string[], nonAimes: NonAime[]): number {
  const lignesTokenisees = ingredients.map((ligne) => tokeniser(ligne));
  let penalite = 0;
  for (const na of nonAimes) {
    const cible = tokeniser(na.valeur);
    if (cible.length === 0) continue;
    // Présent si une ligne d'ingrédient contient la cible (match par ligne,
    // comme detect — évite un faux match à cheval sur deux lignes).
    const present = lignesTokenisees.some((tokens) =>
      contientTokens(tokens, cible),
    );
    if (present) penalite += poids(na.seuilTolerance);
  }
  return penalite;
}
