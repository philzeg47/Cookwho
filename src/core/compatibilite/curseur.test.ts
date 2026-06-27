import { describe, expect, it } from "vitest";

import { curseur } from "./curseur";

describe("curseur — pénalité des goûts", () => {
  it("renvoie 0 si aucun non-aimé n'est présent", () => {
    expect(curseur(["Tomate", "Basilic"], [{ valeur: "Champignons", seuilTolerance: 0 }])).toBe(0);
  });

  it("pénalise plus un non-aimé STRICT qu'un non-aimé SOUPLE", () => {
    const recette = ["Risotto aux champignons"];
    const strict = curseur(recette, [{ valeur: "Champignons", seuilTolerance: 0 }]);
    const souple = curseur(recette, [{ valeur: "Champignons", seuilTolerance: 4 }]);
    expect(strict).toBeGreaterThan(souple);
    expect(souple).toBeGreaterThanOrEqual(0);
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
