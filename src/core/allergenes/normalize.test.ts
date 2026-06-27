import { describe, expect, it } from "vitest";

import { DICTIONNAIRE_ALLERGENES } from "./dictionnaire";
import { normalize } from "./normalize";

describe("normalize", () => {
  it("met en minuscules et retire les accents", () => {
    expect(normalize("Farine de Blé T55")).toBe("farine de ble t55");
    expect(normalize("Crème fraîche")).toBe("creme fraiche");
  });

  it("expanse les ligatures œ et æ", () => {
    expect(normalize("Œufs")).toBe("oeufs");
    expect(normalize("Cœur de bœuf")).toBe("coeur de boeuf");
    expect(normalize("Curaçao æthéré")).toBe("curacao aethere");
  });

  it("réduit ponctuation et séparateurs à un espace simple", () => {
    expect(normalize("huile d'arachide")).toBe("huile d arachide");
    expect(normalize("Céleri-rave")).toBe("celeri rave");
    expect(normalize("Sel & poivre")).toBe("sel poivre");
    expect(normalize("Noix de cajou (grillées)")).toBe("noix de cajou grillees");
  });

  it("compacte les espaces et trim", () => {
    expect(normalize("  Lait   entier  ")).toBe("lait entier");
  });

  it("renvoie une chaîne vide pour une entrée vide ou uniquement ponctuation", () => {
    expect(normalize("")).toBe("");
    expect(normalize("-, () &")).toBe("");
    expect(normalize("   ")).toBe("");
  });

  it("ne fait aucun stemming/désingularisation (le pluriel est conservé)", () => {
    expect(normalize("Œufs")).toBe("oeufs"); // pas "oeuf"
    expect(normalize("Crevettes")).toBe("crevettes"); // pas "crevette"
  });

  it("est idempotente", () => {
    const echantillon = [
      "Farine de Blé T55",
      "huile d'arachide",
      "Cœur de bœuf",
      "Noix de cajou (grillées)",
      "",
    ];
    for (const x of echantillon) {
      expect(normalize(normalize(x))).toBe(normalize(x));
    }
  });

  it("rend toutes les clés du dictionnaire matchables ([a-z0-9 ]) et stables", () => {
    for (const entree of DICTIONNAIRE_ALLERGENES) {
      const n = normalize(entree.ingredient);
      expect(n).toMatch(/^[a-z0-9 ]*$/);
      expect(normalize(n)).toBe(n); // idempotence sur les clés
    }
  });
});
