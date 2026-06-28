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
import {
  LIBELLES_PROPRIETES,
  type ProprieteAlimentaire,
  REGIMES_VERS_PROPRIETES,
  type ResultatProprietes,
} from "../regimes";

export type Contraintes = {
  /** Allergènes durs à exclure (codes) : allergies déclarées + régimes-allergènes. */
  allergenesInterdits: AllergeneUE[];
  /** Sous-ensemble venant d'une ALLERGIE déclarée (pour étiqueter la raison). */
  allergiesCodes?: AllergeneUE[];
  /** Propriétés interdites par un régime alimentaire (viande, porc… story 4.3b). */
  proprietesInterdites?: ProprieteAlimentaire[];
  /** Vrai si ≥1 régime alimentaire est déclaré (pilote l'incertitude régime). */
  regimesAlimentaires?: boolean;
  /** Ce que le mur ne peut PAS garantir → incertitude signalée (jamais ignoré). */
  incertitudes: string[];
};

export type RaisonExclusion =
  | { type: "ALLERGIE" | "REGIME"; allergene: AllergeneUE }
  | { type: "REGIME_ALIMENTAIRE"; propriete: ProprieteAlimentaire; libelle: string };

/** Détection vide par défaut (rétro-compatibilité du mur sans régime alimentaire). */
const PROPRIETES_VIDE: ResultatProprietes = {
  proprietes: [],
  ingredientsNonReconnus: [],
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
  const proprietesInterdites = new Set<ProprieteAlimentaire>();
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
      const codeAllergene = REGIMES_VERS_ALLERGENE[cle];
      const props = REGIMES_VERS_PROPRIETES[cle];
      if (codeAllergene) {
        // Régime-allergène (sans gluten/lactose) : géré via les allergènes (4.3).
        interdits.add(codeAllergene);
      } else if (props) {
        // Régime alimentaire (végétarien/vegan/pescétarien/sans porc, 4.3b).
        for (const p of props) proprietesInterdites.add(p);
      } else {
        // Halal/Casher/inconnu → incertitude (jamais prétendu conforme).
        incertitudes.push(`régime non évalué : ${valeur}`);
      }
    }
    // NON_AIME → ignoré (curseur, 4.4).
  }

  return {
    allergenesInterdits: [...interdits],
    allergiesCodes: [...allergies],
    proprietesInterdites: [...proprietesInterdites],
    regimesAlimentaires: proprietesInterdites.size > 0,
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
  proprietes: ResultatProprietes = PROPRIETES_VIDE,
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

  // Régime alimentaire (4.3b) : exclure sur propriété interdite détectée.
  const proprietesInterdites = new Set(contraintes.proprietesInterdites ?? []);
  for (const propriete of proprietes.proprietes) {
    if (proprietesInterdites.has(propriete)) {
      raisons.push({
        type: "REGIME_ALIMENTAIRE",
        propriete,
        libelle: LIBELLES_PROPRIETES[propriete],
      });
    }
  }

  if (raisons.length > 0) return { exclu: true, raisons };

  const raisonsIncertitude = [...contraintes.incertitudes];
  if (detection.ingredientsNonReconnus.length > 0) {
    raisonsIncertitude.push(
      `ingrédient(s) non reconnu(s) : ${detection.ingredientsNonReconnus.join(", ")}`,
    );
  }
  // Régime alimentaire déclaré + ingrédient non classé → incertain (3 états).
  if (contraintes.regimesAlimentaires && proprietes.ingredientsNonReconnus.length > 0) {
    raisonsIncertitude.push(
      `ingrédient(s) non classé(s) pour le régime : ${proprietes.ingredientsNonReconnus.join(", ")}`,
    );
  }

  return {
    exclu: false,
    incertain: raisonsIncertitude.length > 0,
    raisonsIncertitude,
  };
}
