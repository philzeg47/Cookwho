// @vitest-environment node
import { describe, expect, it, vi } from "vitest";

// On neutralise le scraper réseau : aucun appel réel.
const searchRecipes = vi.fn();
vi.mock("marmiton-api", () => ({
  searchRecipes: (...args: unknown[]) => searchRecipes(...args),
  MarmitonQueryBuilder: class {
    withTitleContaining() {
      return this;
    }
    build() {
      return "qs";
    }
  },
}));

import { marmitonSource } from "./marmitonSource";

describe("marmitonSource (adapter)", () => {
  it("mappe les recettes Marmiton vers RecetteBrute", async () => {
    searchRecipes.mockResolvedValueOnce([
      {
        name: "Curry de pois chiches",
        url: "https://marmiton.org/recettes/r1",
        ingredients: ["200 g de pois chiches", "lait de coco"],
      },
    ]);

    const res = await marmitonSource.chercher({ requete: "curry" });

    expect(res).toEqual([
      {
        source: "marmiton",
        sourceRef: "https://marmiton.org/recettes/r1",
        titre: "Curry de pois chiches",
        ingredientsTexte: ["200 g de pois chiches", "lait de coco"],
      },
    ]);
  });

  it("applique la limite et tolère des ingrédients absents", async () => {
    searchRecipes.mockResolvedValueOnce([
      { name: "A", url: "u1", ingredients: ["x"] },
      { name: "B", url: "u2", ingredients: undefined },
      { name: "C", url: "u3", ingredients: ["y"] },
    ]);

    const res = await marmitonSource.chercher({ requete: "test", limite: 2 });

    expect(res).toHaveLength(2);
    expect(res[1]).toEqual({
      source: "marmiton",
      sourceRef: "u2",
      titre: "B",
      ingredientsTexte: [],
    });
  });

  it("écarte les recettes sans url/nom (identifiant de cache instable)", async () => {
    searchRecipes.mockResolvedValueOnce([
      { name: "OK", url: "u1", ingredients: ["x"] },
      { name: "Sans url", url: "", ingredients: ["y"] },
      { name: "", url: "u3", ingredients: ["z"] },
    ]);
    const res = await marmitonSource.chercher({ requete: "test" });
    expect(res).toHaveLength(1);
    expect(res[0]!.sourceRef).toBe("u1");
  });

  it("porte le nom de source « marmiton »", () => {
    expect(marmitonSource.nom).toBe("marmiton");
  });
});
