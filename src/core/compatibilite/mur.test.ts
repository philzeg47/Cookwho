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

  it("signale un régime alimentaire non évalué (incertitude, pas interdit)", () => {
    const c = construireContraintes([{ type: "REGIME", valeur: "Végétarien" }]);
    expect(c.allergenesInterdits).toEqual([]);
    expect(c.incertitudes).toHaveLength(1);
    expect(c.incertitudes[0]).toMatch(/Végétarien/);
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
    const c = construireContraintes([{ type: "REGIME", valeur: "Vegan" }]);
    const v = mur(c, sansInconnu([]));
    expect(v.exclu).toBe(false);
    if (!v.exclu) expect(v.incertain).toBe(true);
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
