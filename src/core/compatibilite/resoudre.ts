// `resoudre` — chemin nominal de la génération (FR9). Module /core PUR.
// Filtre par le MUR (sécurité) PUIS classe par le CURSEUR (goûts), et retient
// 3 à 10 recettes. Le cas « pas assez » est renvoyé tel quel (la dégradation
// 4.5 et l'échec 4.6 le raffineront). Result discriminé, jamais d'exception.

import type { ResultatDetection } from "../allergenes";
import { type Contraintes, mur } from "./mur";
import { curseur, type NonAime } from "./curseur";

export type RecetteEntree = {
  ref: string;
  titre: string;
  ingredients: string[]; // lignes d'ingrédients (texte libre)
  detection: ResultatDetection; // pré-calculée par l'appelant (4.4b)
};

export type RecetteRetenue = {
  ref: string;
  titre: string;
  ingredients: string[];
  incertain: boolean;
  raisonsIncertitude: string[];
  penalite: number;
};

export type ResultatResolution =
  | { ok: true; recettes: RecetteRetenue[] }
  | { ok: false; raison: "PAS_ASSEZ"; compatibles: number };

export type OptionsResolution = {
  exclure?: string[];
  min?: number;
  max?: number;
};

/**
 * Filtre (mur) → classe (curseur) → retient 3 à 10. `exclure` permet de
 * « régénérer » une sélection disjointe.
 */
export function resoudre(
  recettes: RecetteEntree[],
  contraintes: Contraintes,
  nonAimes: NonAime[],
  { exclure = [], min = 3, max = 10 }: OptionsResolution = {},
): ResultatResolution {
  const exclus = new Set(exclure);

  const compatibles: RecetteRetenue[] = [];
  for (const r of recettes) {
    if (exclus.has(r.ref)) continue;
    const verdict = mur(contraintes, r.detection);
    if (verdict.exclu) continue; // sécurité : jamais retenu
    compatibles.push({
      ref: r.ref,
      titre: r.titre,
      ingredients: r.ingredients,
      incertain: verdict.incertain,
      raisonsIncertitude: verdict.raisonsIncertitude,
      penalite: curseur(r.ingredients, nonAimes),
    });
  }

  // Tri déterministe : pénalité croissante, puis `ref` (tie-break stable).
  compatibles.sort(
    (a, b) => a.penalite - b.penalite || a.ref.localeCompare(b.ref),
  );

  if (compatibles.length < min) {
    return { ok: false, raison: "PAS_ASSEZ", compatibles: compatibles.length };
  }
  return { ok: true, recettes: compatibles.slice(0, max) };
}
