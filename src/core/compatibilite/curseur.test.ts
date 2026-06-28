import { describe, expect, it } from "vitest";

import { curseur, genants } from "./curseur";

describe("curseur — pénalité des goûts", () => {
  it("renvoie 0 si aucun non-aimé n'est présent", () => {
    expect(curseur(["Tomate", "Basilic"], [{ valeur: "Champignons", seuilTolerance: 0 }])).toBe(0);
  });

  it("pénalise plus un non-aimé STRICT qu'un non-aimé SOUPLE", () => {
    const recette = ["Risotto aux champignons"];
    const strict = curseur(recette, [{ valeur: "Champignons", seuilTolerance: 0 }]);
    const souple = curseur(recette, [{ valeur: "Champignons", seuilTolerance: 4 }]);
    expect(strict).toBeGreaterThan(souple);
  });

  it("« Souple » (seuil max UI = 4) n'ajoute AUCUNE pénalité", () => {
    expect(
      curseur(["Risotto aux champignons"], [{ valeur: "Champignons", seuilTolerance: 4 }]),
    ).toBe(0);
  });

  it("matche un non-aimé multi-mots et ignore les sous-chaînes", () => {
    expect(curseur(["Salade de noix de cajou"], [{ valeur: "noix de cajou", seuilTolerance: 0 }])).toBeGreaterThan(0);
    // « ail » ⊄ « volaille » : pas de pénalité.
    expect(curseur(["Cuisse de volaille"], [{ valeur: "ail", seuilTolerance: 0 }])).toBe(0);
  });

  it("somme les pénalités de plusieurs non-aimés présents", () => {
    const p = curseur(
      ["Champignons", "Olives"],
      [
        { valeur: "Champignons", seuilTolerance: 0 },
        { valeur: "Olives", seuilTolerance: 0 },
      ],
    );
    expect(p).toBe(curseur(["Champignons"], [{ valeur: "Champignons", seuilTolerance: 0 }]) * 2);
  });
});

describe("genants — ingrédients gênants présents", () => {
  it("liste les non-aimés présents dans la recette", () => {
    expect(
      genants(
        ["Champignons", "Riz"],
        [
          { valeur: "Champignons", seuilTolerance: 0 },
          { valeur: "Olives", seuilTolerance: 0 },
        ],
      ),
    ).toEqual(["Champignons"]);
  });

  it("renvoie une liste vide si aucun non-aimé n'est présent", () => {
    expect(genants(["Tomate", "Basilic"], [{ valeur: "Champignons", seuilTolerance: 4 }])).toEqual([]);
  });

  it("matche un non-aimé multi-mots et ignore les sous-chaînes (« ail » ⊄ « volaille »)", () => {
    expect(genants(["Salade de noix de cajou"], [{ valeur: "noix de cajou", seuilTolerance: 0 }])).toEqual([
      "noix de cajou",
    ]);
    expect(genants(["Cuisse de volaille"], [{ valeur: "ail", seuilTolerance: 0 }])).toEqual([]);
  });

  it("dédoublonne par valeur et conserve l'ordre des non-aimés", () => {
    expect(
      genants(
        ["Olives", "Champignons"],
        [
          { valeur: "Olives", seuilTolerance: 0 },
          { valeur: "Olives", seuilTolerance: 2 },
          { valeur: "Champignons", seuilTolerance: 1 },
        ],
      ),
    ).toEqual(["Olives", "Champignons"]);
  });
});
