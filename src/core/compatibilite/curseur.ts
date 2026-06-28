// Le « curseur » — scoring des goûts (aliments non-aimés + seuil de tolérance).
// Module /core PUR. NÉGOCIABLE : le curseur ne franchit jamais le mur ; il ne
// fait que PÉNALISER le classement (plus la pénalité est basse, mieux c'est).

import { contientTokens, tokeniser } from "../texte";

/**
 * Borne haute du seuil = dernier index des libellés de tolérance (0-4),
 * cohérente avec l'échelle UI/Zod (`TOLERANCE_LABELS.length - 1`, patch 4.1b).
 * Ainsi « Souple » (4) → poids 0 (aucune pénalité), « Strict » (0) → poids max.
 */
export const SEUIL_TOLERANCE_MAX = 4;

export type NonAime = { valeur: string; seuilTolerance: number };

/** Poids d'un non-aimé présent : décroît avec le seuil (strict → fort, souple → 0). */
function poids(seuilTolerance: number): number {
  return Math.max(0, SEUIL_TOLERANCE_MAX - seuilTolerance);
}

/**
 * Pénalité d'une recette pour les goûts du groupe : somme des poids des
 * non-aimés PRÉSENTS dans la recette. Un non-aimé absent n'ajoute rien.
 * Déterministe.
 *
 * NB : les non-aimés dupliqués (ex. 2 répondants détestant « Olives ») sont
 * CUMULÉS à dessein — un aliment rejeté par plus de monde descend plus bas
 * dans le classement. (Cf. `genants`, qui lui DÉDOUBLONNE pour l'affichage.)
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

/**
 * Liste des aliments non-aimés du groupe PRÉSENTS dans la recette (valeurs
 * d'origine), pour signaler les « ingrédients gênants » en dégradation (4.5).
 * Même mécanique de match que `curseur` (par ligne, tokens). Dédupliqué par
 * valeur, ordre stable (premier d'apparition dans `nonAimes`). Déterministe.
 *
 * Le dédoublonnage est volontaire (≠ `curseur` qui cumule) : on affiche un
 * ingrédient gênant une seule fois, même si plusieurs convives le rejettent.
 */
export function genants(ingredients: string[], nonAimes: NonAime[]): string[] {
  const lignesTokenisees = ingredients.map((ligne) => tokeniser(ligne));
  const presents: string[] = [];
  const vus = new Set<string>();
  for (const na of nonAimes) {
    if (vus.has(na.valeur)) continue;
    const cible = tokeniser(na.valeur);
    if (cible.length === 0) continue;
    const present = lignesTokenisees.some((tokens) =>
      contientTokens(tokens, cible),
    );
    if (present) {
      presents.push(na.valeur);
      vus.add(na.valeur);
    }
  }
  return presents;
}
