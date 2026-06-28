import { describe, expect, it } from "vitest";

import { detecterProprietes } from "./proprietes";

describe("detecterProprietes", () => {
  it("classe un porcin avec PORC ET VIANDE", () => {
    const { proprietes } = detecterProprietes(["Lardons"]);
    expect(proprietes).toContain("PORC");
    expect(proprietes).toContain("VIANDE");
  });

  it("matche par tokens, pas en sous-chaîne (« ail » ⊄ « volaille »)", () => {
    expect(detecterProprietes(["Gousse d'ail"]).proprietes).toEqual([]);
    expect(detecterProprietes(["Cuisse de volaille"]).proprietes).toContain("VIANDE");
  });

  it("ne compte PAS le lait végétal comme produit animal", () => {
    expect(detecterProprietes(["Lait de coco"]).proprietes).toEqual([]);
    expect(detecterProprietes(["Lait d'amande", "Sucre"]).proprietes).toEqual([]);
    // mais une ligne « lait » animal reste détectée
    expect(detecterProprietes(["Lait entier"]).proprietes).toContain("PRODUIT_ANIMAL");
  });

  it("un lait végétal n'efface pas les autres produits animaux d'une recette", () => {
    const { proprietes } = detecterProprietes(["Lait de coco", "Fromage râpé"]);
    expect(proprietes).toContain("PRODUIT_ANIMAL");
  });

  it("sur une MÊME ligne, un produit laitier réel reste détecté malgré un lait végétal (patch revue)", () => {
    expect(detecterProprietes(["Lait de coco et crème fraîche"]).proprietes).toContain("PRODUIT_ANIMAL");
  });

  it("laits végétaux supplémentaires (cajou/chanvre) ≠ produit animal", () => {
    expect(detecterProprietes(["Lait de cajou"]).proprietes).toEqual([]);
    expect(detecterProprietes(["Lait de chanvre"]).proprietes).toEqual([]);
  });

  it("« saucisse » est conservativement classée porc (garantie sans porc)", () => {
    expect(detecterProprietes(["Saucisse de Toulouse"]).proprietes).toContain("PORC");
  });

  it("ne confond pas le poisson « lieu » avec le mot courant « au lieu de »", () => {
    expect(detecterProprietes(["Cuire au lieu de frire"]).proprietes).toEqual([]);
    expect(detecterProprietes(["Filet de lieu noir"]).proprietes).toContain("POISSON");
  });

  it("signale les ingrédients non reconnus (incertitude régime)", () => {
    const { ingredientsNonReconnus } = detecterProprietes(["Tofu fumé zzz", "Bœuf"]);
    expect(ingredientsNonReconnus).toContain("Tofu fumé zzz");
  });

  it("sortie déterministe dans l'ordre canonique", () => {
    const { proprietes } = detecterProprietes(["Bœuf", "Saumon", "Lait"]);
    expect(proprietes).toEqual(["VIANDE", "POISSON", "PRODUIT_ANIMAL"]);
  });
});
