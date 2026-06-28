// Matcher de tokens partagé du /core (PUR). Extrait de `detect` (4.1b) pour
// être réutilisé par `curseur` (4.4a) sans dupliquer la logique de match.
//
// Règle (NFR3) : match sur TOKENS délimités entiers, jamais en sous-chaîne
// (« ail » ≠ « volaille »). Une cible multi-mots doit former une sous-séquence
// CONTIGUË des tokens source. Tolérance pluriel BIDIRECTIONNELLE (suffixe s/x).

import { normalize } from "./allergenes/normalize";

/** Normalise puis découpe en tokens non vides. */
export function tokeniser(texte: string): string[] {
  return normalize(texte).split(" ").filter(Boolean);
}

/** Retire un éventuel suffixe pluriel `s`/`x` (réduction simple, conservatrice). */
function racine(mot: string): string {
  return mot.replace(/[sx]$/, "");
}

/** Un token correspond-il à un token cible (tolérance pluriel bidirectionnelle) ? */
function tokenCorrespond(token: string, cible: string): boolean {
  return token === cible || racine(token) === racine(cible);
}

/**
 * Index de début de la 1ʳᵉ sous-séquence contiguë `cibleTokens` dans
 * `tokensSource`, ou -1. (Tolérance pluriel bidirectionnelle.)
 */
export function indexDeTokens(
  tokensSource: string[],
  cibleTokens: string[],
): number {
  if (cibleTokens.length === 0 || cibleTokens.length > tokensSource.length) {
    return -1;
  }
  for (let i = 0; i <= tokensSource.length - cibleTokens.length; i++) {
    let ok = true;
    for (let j = 0; j < cibleTokens.length; j++) {
      if (!tokenCorrespond(tokensSource[i + j]!, cibleTokens[j]!)) {
        ok = false;
        break;
      }
    }
    if (ok) return i;
  }
  return -1;
}

/** Les `cibleTokens` forment-ils une sous-séquence contiguë de `tokensSource` ? */
export function contientTokens(
  tokensSource: string[],
  cibleTokens: string[],
): boolean {
  return indexDeTokens(tokensSource, cibleTokens) !== -1;
}
