import { describe, expect, it } from "vitest";

import { contientTokens, tokeniser } from "./texte";

describe("tokeniser", () => {
  it("normalise et découpe en tokens", () => {
    expect(tokeniser("Farine de Blé")).toEqual(["farine", "de", "ble"]);
    expect(tokeniser("  ")).toEqual([]);
  });
});

describe("contientTokens", () => {
  it("matche sur tokens entiers, jamais en sous-chaîne", () => {
    expect(contientTokens(tokeniser("cuisse de volaille"), tokeniser("ail"))).toBe(false);
    expect(contientTokens(tokeniser("gousse d'ail"), tokeniser("ail"))).toBe(true);
  });

  it("matche une cible multi-mots (sous-séquence contiguë)", () => {
    expect(
      contientTokens(tokeniser("200 g de noix de cajou"), tokeniser("noix de cajou")),
    ).toBe(true);
    expect(
      contientTokens(tokeniser("noix et cajou"), tokeniser("noix de cajou")),
    ).toBe(false);
  });

  it("tolère le pluriel dans les deux sens", () => {
    expect(contientTokens(tokeniser("oeufs"), tokeniser("oeuf"))).toBe(true);
    expect(contientTokens(tokeniser("sulfite"), tokeniser("sulfites"))).toBe(true);
  });
});
