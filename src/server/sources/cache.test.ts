// @vitest-environment node
import { describe, expect, it, vi } from "vitest";

import { recupererRecettes, TTL_CACHE_JOURS } from "./cache";
import type { RecetteBrute, SourceDeRecettes } from "./SourceDeRecettes";

const RECETTE: RecetteBrute = {
  source: "demo",
  sourceRef: "r1",
  titre: "Curry de pois chiches",
  ingredientsTexte: ["pois chiches", "lait de coco"],
};

/** Source factice : `chercher` mockable, `nom` paramétrable (interchangeabilité). */
function sourceFactice(
  nom: string,
  resultat: RecetteBrute[] | Error,
): SourceDeRecettes {
  return {
    nom,
    chercher: vi.fn(async () => {
      if (resultat instanceof Error) throw resultat;
      return resultat;
    }),
  };
}

/** Db mocké : findMany renvoie `enCache`, upsert capturé. */
function dbMock(enCache: RecetteBrute[]) {
  const findMany = vi.fn(async () => enCache);
  const upsert = vi.fn(async () => ({}));
  return { db: { recetteCache: { findMany, upsert } }, findMany, upsert };
}

describe("recupererRecettes — fetch-through cache", () => {
  it("MISS : cache vide → appelle la source une fois et met en cache", async () => {
    const src = sourceFactice("demo", [RECETTE]);
    const m = dbMock([]); // findMany (lecture cache) renvoie vide

    const res = await recupererRecettes(m.db, src, { requete: "curry" });

    expect(res).toEqual([RECETTE]);
    expect(src.chercher).toHaveBeenCalledTimes(1);
    expect(m.upsert).toHaveBeenCalledTimes(1);
  });

  it("HIT : cache frais → resservi SANS appeler la source", async () => {
    const src = sourceFactice("demo", [RECETTE]);
    const m = dbMock([RECETTE]); // cache frais

    const res = await recupererRecettes(m.db, src);

    expect(res).toEqual([RECETTE]);
    expect(src.chercher).not.toHaveBeenCalled();
    expect(m.upsert).not.toHaveBeenCalled();
  });

  it("rafraichir=true : ignore le cache frais et rappelle la source", async () => {
    const src = sourceFactice("demo", [RECETTE]);
    const m = dbMock([RECETTE]);

    await recupererRecettes(m.db, src, {}, { rafraichir: true });

    expect(src.chercher).toHaveBeenCalledTimes(1);
    expect(m.upsert).toHaveBeenCalledTimes(1);
  });

  it("RÉSILIENCE : source en panne + cache présent → resert le cache", async () => {
    const src = sourceFactice("demo", new Error("réseau KO"));
    // 1er findMany (lecture fraîche) = vide → tente la source ; 2e findMany (repli) = cache.
    const findMany = vi
      .fn()
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([RECETTE]);
    const db = { recetteCache: { findMany, upsert: vi.fn(async () => ({})) } };

    const res = await recupererRecettes(db, src);

    expect(res).toEqual([RECETTE]);
  });

  it("RÉSILIENCE : source en panne ET cache vide → propage l'erreur", async () => {
    const src = sourceFactice("demo", new Error("réseau KO"));
    const m = dbMock([]); // toujours vide

    await expect(recupererRecettes(m.db, src)).rejects.toThrow("réseau KO");
  });

  it("INTERCHANGEABILITÉ : deux sources distinctes passent par le même orchestrateur", async () => {
    const a = sourceFactice("sourceA", [{ ...RECETTE, source: "sourceA" }]);
    const b = sourceFactice("sourceB", [{ ...RECETTE, source: "sourceB" }]);

    const resA = await recupererRecettes(dbMock([]).db, a);
    const resB = await recupererRecettes(dbMock([]).db, b);

    expect(resA[0]!.source).toBe("sourceA");
    expect(resB[0]!.source).toBe("sourceB");
    expect(a.chercher).toHaveBeenCalledTimes(1);
    expect(b.chercher).toHaveBeenCalledTimes(1);
  });

  it("expose un TTL de cache positif", () => {
    expect(TTL_CACHE_JOURS).toBeGreaterThan(0);
  });
});
