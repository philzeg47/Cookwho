import { describe, expect, it } from "vitest";

import { detect } from "./detect";

describe("detect — match sur tokens délimités", () => {
  it("ne matche pas en sous-chaîne (« ail » ≠ « volaille », « lait » ≠ « volaille »)", () => {
    const res = detect(["Cuisse de volaille", "Ail"]);
    expect(res.allergenes).toEqual([]);
    expect(res.ingredientsNonReconnus).toEqual(["Cuisse de volaille", "Ail"]);
  });

  it("matche « lait » quand c'est un token entier", () => {
    expect(detect(["Chocolat au lait"]).allergenes).toEqual(["LAIT"]);
  });

  it("matche une clé multi-mots (sous-séquence contiguë)", () => {
    expect(detect(["200 g de noix de cajou"]).allergenes).toEqual([
      "FRUITS_A_COQUE",
    ]);
  });
});

describe("detect — tolérance pluriel", () => {
  it("matche le pluriel vers la clé au singulier", () => {
    expect(detect(["Œufs entiers"]).allergenes).toEqual(["OEUFS"]);
    expect(detect(["Crevettes roses"]).allergenes).toEqual(["CRUSTACES"]);
    expect(detect(["Moules de bouchot"]).allergenes).toEqual(["MOLLUSQUES"]);
  });
});

describe("detect — dérivés et multi-allergènes", () => {
  it("détecte les dérivés", () => {
    expect(detect(["Mayonnaise"]).allergenes).toEqual(["OEUFS"]);
    expect(detect(["Sauce soja"]).allergenes).toEqual(["SOJA"]);
  });

  it("agrège plusieurs allergènes d'une même ligne (surimi)", () => {
    // surimi → CRUSTACES + POISSON, ordre canonique de la taxonomie
    // (CRUSTACES est 2ᵉ, POISSON 4ᵉ dans ALLERGENES_UE_CODES).
    expect(detect(["Surimi"]).allergenes).toEqual(["CRUSTACES", "POISSON"]);
  });
});

describe("detect — ingrédients non reconnus & déterminisme", () => {
  it("range les ingrédients sans allergène dans ingredientsNonReconnus (forme d'origine)", () => {
    const res = detect(["Tomate", "Arachide", "Basilic"]);
    expect(res.allergenes).toEqual(["ARACHIDES"]);
    expect(res.ingredientsNonReconnus).toEqual(["Tomate", "Basilic"]);
  });

  it("ne déclare jamais un ingrédient « sûr » (aucun allergène ⇒ non reconnu)", () => {
    const res = detect(["Carotte"]);
    expect(res.allergenes).toEqual([]);
    expect(res.ingredientsNonReconnus).toEqual(["Carotte"]);
  });

  it("renvoie une sortie ordonnée (taxonomie) et sans doublon", () => {
    // Ordre saisie inversé, doublon de lait → sortie canonique GLUTEN avant LAIT.
    const res = detect(["Beurre", "Farine de blé", "Lait"]);
    expect(res.allergenes).toEqual(["GLUTEN", "LAIT"]);
  });

  it("est déterministe (deux appels identiques)", () => {
    const a = detect(["Œufs", "Farine de blé"]);
    const b = detect(["Œufs", "Farine de blé"]);
    expect(a).toEqual(b);
  });

  it("gère une liste vide", () => {
    expect(detect([])).toEqual({ allergenes: [], ingredientsNonReconnus: [] });
  });
});
