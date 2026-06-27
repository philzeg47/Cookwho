// Le « mur » — filtre dur de compatibilité (FR9 base, NFR3). Module /core PUR
// (zéro I/O). Exclut STRICTEMENT toute recette violant une contrainte
// non-négociable détectée (allergie déclarée, régime mappable sur allergène).
//
// Décisions produit (2026-06-27) :
//  - Modèle 3 états : exclusion DURE seulement sur allergène/régime DÉTECTÉ ;
//    un ingrédient non reconnu (ou une contrainte non vérifiable) → « incertain »
//    signalé pour l'avertissement humain (FR16) — JAMAIS présenté sûr à tort.
//  - Régimes mappables sur allergène uniquement (gluten/lait) ; les régimes
//    alimentaires (végétarien/vegan/halal/casher/porc) → « incertain » ici,
//    évalués dans la story 4.3b (dico ingrédient→propriété).

import {
  type AllergeneUE,
  LIBELLES_ALLERGENES,
  type ResultatDetection,
} from "../allergenes";

export type Contraintes = {
  /** Allergènes durs à exclure (codes) : allergies déclarées + régimes-allergènes. */
  allergenesInterdits: AllergeneUE[];
  /** Sous-ensemble venant d'une ALLERGIE déclarée (pour étiqueter la raison). */
  allergiesCodes?: AllergeneUE[];
  /** Ce que le mur ne peut PAS garantir → incertitude signalée (jamais ignoré). */
  incertitudes: string[];
};

export type RaisonExclusion = {
  type: "ALLERGIE" | "REGIME";
  allergene: AllergeneUE;
};

export type VerdictMur =
  | { exclu: true; raisons: RaisonExclusion[] }
  | { exclu: false; incertain: boolean; raisonsIncertitude: string[] };

type RestrictionEntree = {
  type: "REGIME" | "ALLERGIE" | "NON_AIME";
  valeur: string;
};

/** Régimes (libellé minuscule) mappables sur un allergène du dictionnaire. */
const REGIMES_VERS_ALLERGENE: Record<string, AllergeneUE> = {
  "sans gluten": "GLUTEN",
  "sans lactose": "LAIT",
  "sans lait": "LAIT",
};

/** Index inverse libellé (minuscule) → code allergène, dérivé de la taxonomie. */
const LIBELLE_VERS_CODE: Record<string, AllergeneUE> = Object.fromEntries(
  (Object.entries(LIBELLES_ALLERGENES) as [AllergeneUE, string][]).map(
    ([code, libelle]) => [libelle.toLowerCase(), code],
  ),
);

/**
 * Transforme les restrictions déclarées d'un groupe en contraintes de mur.
 * `NON_AIME` est ignoré (c'est le curseur, story 4.4).
 */
export function construireContraintes(
  restrictions: RestrictionEntree[],
): Contraintes {
  const interdits = new Set<AllergeneUE>();
  const allergies = new Set<AllergeneUE>();
  const incertitudes: string[] = [];

  for (const r of restrictions) {
    const valeur = r.valeur.trim();
    if (!valeur) continue;
    const cle = valeur.toLowerCase();

    if (r.type === "ALLERGIE") {
      const code = LIBELLE_VERS_CODE[cle];
      if (code) {
        interdits.add(code);
        allergies.add(code);
      } else incertitudes.push(`allergie non vérifiable : ${valeur}`);
    } else if (r.type === "REGIME") {
      const code = REGIMES_VERS_ALLERGENE[cle];
      if (code) interdits.add(code);
      else incertitudes.push(`régime non évalué : ${valeur}`);
    }
    // NON_AIME → ignoré (curseur, 4.4).
  }

  return {
    allergenesInterdits: [...interdits],
    allergiesCodes: [...allergies],
    incertitudes,
  };
}

/**
 * Évalue une recette (via son `ResultatDetection`) contre les contraintes.
 * Verdict discriminé, jamais d'exception.
 */
export function mur(
  contraintes: Contraintes,
  detection: ResultatDetection,
): VerdictMur {
  const interdits = new Set(contraintes.allergenesInterdits);
  // Étiquette : ALLERGIE si le code vient d'une allergie déclarée, sinon REGIME.
  // Sans provenance (`allergiesCodes` absent), on retombe sur ALLERGIE (le plus sévère).
  const codesAllergie = new Set(
    contraintes.allergiesCodes ?? contraintes.allergenesInterdits,
  );
  const raisons: RaisonExclusion[] = detection.allergenes
    .filter((a) => interdits.has(a))
    .map((allergene) => ({
      type: codesAllergie.has(allergene) ? "ALLERGIE" : "REGIME",
      allergene,
    }));

  if (raisons.length > 0) return { exclu: true, raisons };

  const raisonsIncertitude = [...contraintes.incertitudes];
  if (detection.ingredientsNonReconnus.length > 0) {
    raisonsIncertitude.push(
      `ingrédient(s) non reconnu(s) : ${detection.ingredientsNonReconnus.join(", ")}`,
    );
  }

  return {
    exclu: false,
    incertain: raisonsIncertitude.length > 0,
    raisonsIncertitude,
  };
}
