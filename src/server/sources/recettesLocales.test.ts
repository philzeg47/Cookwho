import { describe, expect, it } from "vitest";

import { recettesLocales } from "./recettesLocales";

describe("recettesLocales (source intégrée)", () => {
  it("renvoie un pool substantiel de recettes en français", async () => {
    const res = await recettesLocales.chercher({});
    expect(res.length).toBeGreaterThanOrEqual(40);
    for (const r of res) {
      expect(r.source).toBe("locale");
      expect(r.titre.length).toBeGreaterThan(0);
      expect(r.sourceRef).toMatch(/^locale-/);
      expect(r.ingredientsTexte.length).toBeGreaterThan(0);
    }
  });

  it("respecte la limite demandée", async () => {
    const res = await recettesLocales.chercher({ limite: 10 });
    expect(res.length).toBe(10);
  });

  it("filtre par requête sur le titre quand fournie", async () => {
    const res = await recettesLocales.chercher({ requete: "poulet" });
    expect(res.length).toBeGreaterThan(0);
    for (const r of res) expect(r.titre.toLowerCase()).toContain("poulet");
  });

  it("produit des sourceRef uniques (clés de cache stables)", async () => {
    const res = await recettesLocales.chercher({});
    const refs = res.map((r) => r.sourceRef);
    expect(new Set(refs).size).toBe(refs.length);
  });
});
