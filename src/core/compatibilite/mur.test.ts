import { describe, expect, it } from "vitest";

import { ALLERGENES_UE_CODES, type ResultatDetection } from "../allergenes";
import { construireContraintes, mur } from "./mur";

const sansInconnu = (allergenes: ResultatDetection["allergenes"]): ResultatDetection => ({
  allergenes,
  ingredientsNonReconnus: [],
});

describe("construireContraintes", () => {
  it("mappe une allergie déclarée (libellé) vers son code", () => {
    const c = construireContraintes([{ type: "ALLERGIE", valeur: "Arachides" }]);
    expect(c.allergenesInterdits).toEqual(["ARACHIDES"]);
    expect(c.incertitudes).toEqual([]);
  });

  it("mappe un régime-allergène (sans gluten/lactose) vers un code", () => {
    const c = construireContraintes([
      { type: "REGIME", valeur: "Sans gluten" },
      { type: "REGIME", valeur: "Sans lactose" },
    ]);
    expect(new Set(c.allergenesInterdits)).toEqual(new Set(["GLUTEN", "LAIT"]));
  });

  it("signale un régime non évalué (Halal/Casher différés → incertitude)", () => {
    const c = construireContraintes([{ type: "REGIME", valeur: "Casher" }]);
    expect(c.allergenesInterdits).toEqual([]);
    expect(c.proprietesInterdites).toEqual([]);
    expect(c.incertitudes).toHaveLength(1);
    expect(c.incertitudes[0]).toMatch(/Casher/);
  });

  it("mappe un régime alimentaire (végétarien/vegan…) vers des propriétés interdites", () => {
    const veg = construireContraintes([{ type: "REGIME", valeur: "Végétarien" }]);
    expect(new Set(veg.proprietesInterdites)).toEqual(
      new Set(["VIANDE", "POISSON", "FRUITS_DE_MER"]),
    );
    expect(veg.regimesAlimentaires).toBe(true);
    expect(veg.incertitudes).toEqual([]);

    const porc = construireContraintes([{ type: "REGIME", valeur: "Sans porc" }]);
    expect(porc.proprietesInterdites).toEqual(["PORC"]);
  });

  it("signale une allergie libre non mappable (incertitude)", () => {
    const c = construireContraintes([{ type: "ALLERGIE", valeur: "Sarrasin" }]);
    expect(c.allergenesInterdits).toEqual([]);
    expect(c.incertitudes[0]).toMatch(/Sarrasin/);
  });

  it("ignore les NON_AIME (curseur, pas le mur)", () => {
    const c = construireContraintes([
      { type: "NON_AIME", valeur: "Coriandre" },
    ]);
    expect(c.allergenesInterdits).toEqual([]);
    expect(c.incertitudes).toEqual([]);
  });
});

describe("mur — verdict", () => {
  it("EXCLUT une recette contenant un allergène déclaré", () => {
    const c = construireContraintes([{ type: "ALLERGIE", valeur: "Arachides" }]);
    const v = mur(c, sansInconnu(["ARACHIDES", "LAIT"]));
    expect(v.exclu).toBe(true);
    if (v.exclu) expect(v.raisons).toContainEqual({ type: "ALLERGIE", allergene: "ARACHIDES" });
  });

  it("EXCLUT sur régime-allergène violé (sans gluten + GLUTEN détecté)", () => {
    const c = construireContraintes([{ type: "REGIME", valeur: "Sans gluten" }]);
    expect(mur(c, sansInconnu(["GLUTEN"])).exclu).toBe(true);
  });

  it("étiquette la raison ALLERGIE vs REGIME selon la provenance", () => {
    const cA = construireContraintes([{ type: "ALLERGIE", valeur: "Arachides" }]);
    const vA = mur(cA, sansInconnu(["ARACHIDES"]));
    if (vA.exclu) expect(vA.raisons[0]!.type).toBe("ALLERGIE");

    const cR = construireContraintes([{ type: "REGIME", valeur: "Sans gluten" }]);
    const vR = mur(cR, sansInconnu(["GLUTEN"]));
    if (vR.exclu) expect(vR.raisons[0]!.type).toBe("REGIME");
  });

  it("NE PAS exclure si l'allergène interdit est absent", () => {
    const c = construireContraintes([{ type: "ALLERGIE", valeur: "Arachides" }]);
    const v = mur(c, sansInconnu(["LAIT"]));
    expect(v.exclu).toBe(false);
    if (!v.exclu) expect(v.incertain).toBe(false);
  });

  it("marque INCERTAIN sur ingrédient non reconnu (pas d'exclusion auto)", () => {
    const v = mur(
      { allergenesInterdits: [], incertitudes: [] },
      { allergenes: [], ingredientsNonReconnus: ["xyz"] },
    );
    expect(v.exclu).toBe(false);
    if (!v.exclu) {
      expect(v.incertain).toBe(true);
      expect(v.raisonsIncertitude[0]).toMatch(/non reconnu/);
    }
  });

  it("marque INCERTAIN si un régime non évalué est présent (jamais sûr à tort)", () => {
    const c = construireContraintes([{ type: "REGIME", valeur: "Halal" }]);
    const v = mur(c, sansInconnu([]));
    expect(v.exclu).toBe(false);
    if (!v.exclu) expect(v.incertain).toBe(true);
  });

  it("EXCLUT sur propriété interdite par un régime alimentaire (végétarien + viande)", () => {
    const c = construireContraintes([{ type: "REGIME", valeur: "Végétarien" }]);
    const v = mur(c, sansInconnu([]), { proprietes: ["VIANDE"], ingredientsNonReconnus: [] });
    expect(v.exclu).toBe(true);
    if (v.exclu) {
      expect(v.raisons).toContainEqual({ type: "REGIME_ALIMENTAIRE", propriete: "VIANDE", libelle: "viande" });
    }
  });

  it("pescétarien : exclut la viande mais autorise le poisson", () => {
    const c = construireContraintes([{ type: "REGIME", valeur: "Pescétarien" }]);
    const viande = mur(c, sansInconnu([]), { proprietes: ["VIANDE"], ingredientsNonReconnus: [] });
    const poisson = mur(c, sansInconnu([]), { proprietes: ["POISSON"], ingredientsNonReconnus: [] });
    expect(viande.exclu).toBe(true);
    expect(poisson.exclu).toBe(false);
  });

  it("INCERTAIN si régime alimentaire déclaré + ingrédient non classé (jamais sûr à tort)", () => {
    const c = construireContraintes([{ type: "REGIME", valeur: "Vegan" }]);
    const v = mur(c, sansInconnu([]), { proprietes: [], ingredientsNonReconnus: ["substitut mystere"] });
    expect(v.exclu).toBe(false);
    if (!v.exclu) {
      expect(v.incertain).toBe(true);
      expect(v.raisonsIncertitude.join(" ")).toMatch(/non classé/);
    }
  });

  it("verdict SÛR quand rien n'est violé ni incertain", () => {
    const c = construireContraintes([{ type: "ALLERGIE", valeur: "Arachides" }]);
    const v = mur(c, sansInconnu(["LAIT"]));
    expect(v).toEqual({ exclu: false, incertain: false, raisonsIncertitude: [] });
  });
});

describe("INVARIANT de sécurité (AC6)", () => {
  it("aucune recette retenue ne contient un allergène interdit", () => {
    const codes = ALLERGENES_UE_CODES;
    // Boucle déterministe sur des combinaisons interdits × détectés.
    for (let i = 0; i < codes.length; i++) {
      for (let j = 0; j < codes.length; j++) {
        const interdits = [codes[i]!, codes[(i + 3) % codes.length]!];
        const detectes = [codes[j]!, codes[(j + 5) % codes.length]!];
        const v = mur(
          { allergenesInterdits: interdits, incertitudes: [] },
          { allergenes: detectes, ingredientsNonReconnus: [] },
        );
        if (!v.exclu) {
          // Retenue ⇒ aucune intersection interdits ∩ détectés.
          const inter = detectes.filter((a) => interdits.includes(a));
          expect(inter).toEqual([]);
        }
      }
    }
  });
});
