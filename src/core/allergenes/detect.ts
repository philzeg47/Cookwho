// Détection des allergènes dans une liste d'ingrédients en texte libre.
// Module /core PUR (zéro I/O). Compose `normalize` (4.1a) + le dictionnaire
// maison (4.0). Sens conservateur : « dans le doute, on exclut » — un
// ingrédient sans allergène connu n'est JAMAIS déclaré sûr (il va dans
// `ingredientsNonReconnus`, à charge du mur (4.3) de décider).
//
// Règle de match (NFR3, anti-faux-négatif) : sur TOKENS délimités entiers,
// jamais en sous-chaîne (`ail` ≠ `volaille`). Une clé multi-mots doit former
// une sous-séquence CONTIGUË des tokens de l'ingrédient. Tolérance pluriel
// limitée (suffixe `s`/`x`), côté sur-détection (sûr).

import { contientTokens, tokeniser } from "../texte";
import { ALLERGENES_UE_CODES, type AllergeneUE } from "./allergenes-ue";
import { DICTIONNAIRE_ALLERGENES } from "./dictionnaire";

export type ResultatDetection = {
  allergenes: AllergeneUE[];
  ingredientsNonReconnus: string[];
};

/** Index précalculé (pur) : tokens de clé normalisés (les deux côtés normalisés). */
const INDEX: ReadonlyArray<{ tokens: string[]; allergenes: AllergeneUE[] }> =
  DICTIONNAIRE_ALLERGENES.map((entree) => ({
    tokens: tokeniser(entree.ingredient),
    allergenes: entree.allergenes,
  }));

export function detect(ingredients: string[]): ResultatDetection {
  const trouves = new Set<AllergeneUE>();
  const ingredientsNonReconnus: string[] = [];

  for (const ligne of ingredients) {
    const tokens = tokeniser(ligne);
    let reconnu = false;
    for (const entree of INDEX) {
      if (contientTokens(tokens, entree.tokens)) {
        for (const a of entree.allergenes) trouves.add(a);
        reconnu = true;
      }
    }
    if (!reconnu) ingredientsNonReconnus.push(ligne);
  }

  // Sortie déterministe : ordre canonique de la taxonomie, sans doublon.
  const allergenes = ALLERGENES_UE_CODES.filter((code) => trouves.has(code));

  return { allergenes, ingredientsNonReconnus };
}
