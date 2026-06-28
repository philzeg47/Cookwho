// `resoudre` — chemin nominal de la génération (FR9). Module /core PUR.
// Filtre par le MUR (sécurité) PUIS classe par le CURSEUR (goûts), et retient
// 3 à 10 recettes. Le cas « pas assez » est renvoyé tel quel (la dégradation
// 4.5 et l'échec 4.6 le raffineront). Result discriminé, jamais d'exception.

import { LIBELLES_ALLERGENES, type ResultatDetection } from "../allergenes";
import type { ResultatProprietes } from "../regimes";
import { type Contraintes, mur } from "./mur";
import { curseur, genants, type NonAime } from "./curseur";

export type RecetteEntree = {
  ref: string;
  titre: string;
  ingredients: string[]; // lignes d'ingrédients (texte libre)
  detection: ResultatDetection; // allergènes pré-calculés par l'appelant (4.4b)
  detectionProprietes?: ResultatProprietes; // propriétés régime (4.3b, optionnel)
};

export type RecetteRetenue = {
  ref: string;
  titre: string;
  ingredients: string[];
  /** Aliments non-aimés du groupe présents dans la recette (signalés en UI). */
  ingredientsGenants: string[];
  incertain: boolean;
  raisonsIncertitude: string[];
  penalite: number;
};

/**
 * - TOUS_CONTENTS : ≥ min recettes plaisent à tout le groupe (pénalité nulle).
 * - DEGRADATION : aucun lot de min n'a une pénalité nulle, on propose les moins
 *   pénalisées (ingrédients gênants signalés). Le mur reste TOUJOURS garanti.
 */
export type ModeResolution = "TOUS_CONTENTS" | "DEGRADATION";

/**
 * Contrainte (allergène/régime) ayant éliminé des recettes au mur, pour
 * l'échec explicatif (4.6) : « quelle contrainte bloque ». `recettesBloquees`
 * = nombre de recettes que cette contrainte a écartées (une recette peut
 * compter pour plusieurs contraintes).
 */
export type ContrainteBloquante = {
  type: "ALLERGIE" | "REGIME" | "REGIME_ALIMENTAIRE";
  /** Clé machine : code allergène (ex. "ARACHIDES") ou propriété (ex. "VIANDE"). */
  cle: string;
  libelle: string;
  recettesBloquees: number;
};

export type ResultatResolution =
  | { ok: true; mode: ModeResolution; recettes: RecetteRetenue[] }
  | {
      ok: false;
      raison: "PAS_ASSEZ";
      compatibles: number;
      contraintesBloquantes: ContrainteBloquante[];
    };

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
  // Garde-fou : `max` ne peut pas être sous `min` (sinon `ok:true` renverrait
  // moins de `min` recettes, contredisant le contrat).
  const plafond = Math.max(min, max);
  const exclus = new Set(exclure);

  // Diagnostic d'échec (4.6) : par clé (allergène ou propriété), type + libellé
  // + nb de recettes bloquées au mur. Seules les exclusions DU MUR comptent.
  const blocages = new Map<
    string,
    { type: ContrainteBloquante["type"]; libelle: string; recettesBloquees: number }
  >();

  const compatibles: RecetteRetenue[] = [];
  for (const r of recettes) {
    if (exclus.has(r.ref)) continue;
    const verdict = mur(contraintes, r.detection, r.detectionProprietes);
    if (verdict.exclu) {
      // Une recette compte une fois par contrainte qui l'a bloquée.
      const clesVues = new Set<string>();
      for (const raison of verdict.raisons) {
        const cle =
          raison.type === "REGIME_ALIMENTAIRE" ? raison.propriete : raison.allergene;
        if (clesVues.has(cle)) continue;
        clesVues.add(cle);
        const libelle =
          raison.type === "REGIME_ALIMENTAIRE"
            ? raison.libelle
            : LIBELLES_ALLERGENES[raison.allergene];
        const existant = blocages.get(cle);
        if (existant) existant.recettesBloquees += 1;
        else blocages.set(cle, { type: raison.type, libelle, recettesBloquees: 1 });
      }
      continue; // sécurité : jamais retenu
    }
    compatibles.push({
      ref: r.ref,
      titre: r.titre,
      ingredients: r.ingredients,
      ingredientsGenants: genants(r.ingredients, nonAimes),
      incertain: verdict.incertain,
      raisonsIncertitude: verdict.raisonsIncertitude,
      penalite: curseur(r.ingredients, nonAimes),
    });
  }

  // Tri déterministe : pénalité croissante, puis `ref` (tie-break stable).
  compatibles.sort(
    (a, b) => a.penalite - b.penalite || a.ref.localeCompare(b.ref),
  );

  // Moins de `min` recettes passent le MUR → échec explicatif (4.6) : on nomme
  // la/les contrainte(s) bloquante(s), triées par impact décroissant. Pool trop
  // petit sans exclusion → liste vide (l'UI distingue les deux cas).
  if (compatibles.length < min) {
    const contraintesBloquantes: ContrainteBloquante[] = [...blocages.entries()]
      .map(([cle, { type, libelle, recettesBloquees }]) => ({
        type,
        cle,
        libelle,
        recettesBloquees,
      }))
      .sort(
        (a, b) =>
          b.recettesBloquees - a.recettesBloquees ||
          a.libelle.localeCompare(b.libelle),
      );
    return {
      ok: false,
      raison: "PAS_ASSEZ",
      compatibles: compatibles.length,
      contraintesBloquantes,
    };
  }

  // Succès plein si ≥ min recettes plaisent à tout le groupe (pénalité 0)…
  const zeroPenalite = compatibles.filter((r) => r.penalite === 0);
  if (zeroPenalite.length >= min) {
    return { ok: true, mode: "TOUS_CONTENTS", recettes: zeroPenalite.slice(0, plafond) };
  }
  // … sinon dégradation : les moins pénalisées (le mur reste garanti).
  return { ok: true, mode: "DEGRADATION", recettes: compatibles.slice(0, plafond) };
}
