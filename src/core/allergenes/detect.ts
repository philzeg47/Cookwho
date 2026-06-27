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

import { ALLERGENES_UE_CODES, type AllergeneUE } from "./allergenes-ue";
import { DICTIONNAIRE_ALLERGENES } from "./dictionnaire";
import { normalize } from "./normalize";

export type ResultatDetection = {
  allergenes: AllergeneUE[];
  ingredientsNonReconnus: string[];
};

/** Index précalculé (pur) : tokens de clé normalisés (les deux côtés normalisés). */
const INDEX: ReadonlyArray<{ tokens: string[]; allergenes: AllergeneUE[] }> =
  DICTIONNAIRE_ALLERGENES.map((entree) => ({
    tokens: normalize(entree.ingredient).split(" ").filter(Boolean),
    allergenes: entree.allergenes,
  }));

/** Un token d'ingrédient correspond-il au token de clé (tolérance pluriel) ? */
function tokenCorrespond(token: string, cle: string): boolean {
  return token === cle || token === `${cle}s` || token === `${cle}x`;
}

/** Les `cleTokens` forment-ils une sous-séquence contiguë de `tokens` ? */
function contientSequence(tokens: string[], cleTokens: string[]): boolean {
  if (cleTokens.length === 0 || cleTokens.length > tokens.length) return false;
  for (let i = 0; i <= tokens.length - cleTokens.length; i++) {
    let ok = true;
    for (let j = 0; j < cleTokens.length; j++) {
      if (!tokenCorrespond(tokens[i + j]!, cleTokens[j]!)) {
        ok = false;
        break;
      }
    }
    if (ok) return true;
  }
  return false;
}

export function detect(ingredients: string[]): ResultatDetection {
  const trouves = new Set<AllergeneUE>();
  const ingredientsNonReconnus: string[] = [];

  for (const ligne of ingredients) {
    const tokens = normalize(ligne).split(" ").filter(Boolean);
    let reconnu = false;
    for (const entree of INDEX) {
      if (contientSequence(tokens, entree.tokens)) {
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
