import { describe, expect, it } from "vitest";

import type { ResultatDetection } from "../allergenes";
import { construireContraintes } from "./mur";
import { type RecetteEntree, resoudre } from "./resoudre";

const detSans = (): ResultatDetection => ({ allergenes: [], ingredientsNonReconnus: [] });

function recette(ref: string, over: Partial<RecetteEntree> = {}): RecetteEntree {
  return { ref, titre: `Recette ${ref}`, ingredients: ["tomate"], detection: detSans(), ...over };
}

const sansContrainte = { allergenesInterdits: [], incertitudes: [] };

describe("resoudre — chemin nominal", () => {
  it("renvoie 3 à 10 recettes quand il y a ≥ 3 compatibles", () => {
    const recettes = Array.from({ length: 12 }, (_, i) => recette(`r${i}`));
    const res = resoudre(recettes, sansContrainte, []);
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.recettes.length).toBe(10); // plafonné à max
      expect(res.recettes.length).toBeGreaterThanOrEqual(3);
    }
  });

  it("renvoie PAS_ASSEZ quand < 3 compatibles", () => {
    const res = resoudre([recette("r0"), recette("r1")], sansContrainte, []);
    expect(res).toEqual({ ok: false, raison: "PAS_ASSEZ", compatibles: 2 });
  });

  it("EXCLUT les recettes violant le mur (jamais retenues)", () => {
    const c = construireContraintes([{ type: "ALLERGIE", valeur: "Arachides" }]);
    const dangereuse = recette("danger", {
      detection: { allergenes: ["ARACHIDES"], ingredientsNonReconnus: [] },
    });
    const ok1 = recette("a");
    const ok2 = recette("b");
    const ok3 = recette("c");
    const res = resoudre([dangereuse, ok1, ok2, ok3], c, []);
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.recettes.map((r) => r.ref)).not.toContain("danger");
  });

  it("classe par pénalité croissante (goûts)", () => {
    const aime = recette("aime", { ingredients: ["tomate"] });
    const naime = recette("naime", { ingredients: ["champignons"] });
    const r3 = recette("neutre", { ingredients: ["riz"] });
    const res = resoudre(
      [naime, aime, r3],
      sansContrainte,
      [{ valeur: "Champignons", seuilTolerance: 0 }],
    );
    expect(res.ok).toBe(true);
    if (res.ok) {
      // « naime » (pénalisée) doit être en dernier.
      expect(res.recettes[res.recettes.length - 1]!.ref).toBe("naime");
    }
  });

  it("« régénérer » via exclure → sélection disjointe", () => {
    const recettes = Array.from({ length: 6 }, (_, i) => recette(`r${i}`));
    const premiere = resoudre(recettes, sansContrainte, []);
    expect(premiere.ok).toBe(true);
    if (!premiere.ok) return;
    const vues = premiere.recettes.map((r) => r.ref);
    const seconde = resoudre(recettes, sansContrainte, [], { exclure: vues });
    if (seconde.ok) {
      for (const r of seconde.recettes) expect(vues).not.toContain(r.ref);
    } else {
      expect(seconde.raison).toBe("PAS_ASSEZ");
    }
  });

  it("propage le drapeau d'incertitude du mur", () => {
    const incertaine = recette("inc", {
      detection: { allergenes: [], ingredientsNonReconnus: ["ingredient mystere"] },
    });
    const res = resoudre(
      [incertaine, recette("a"), recette("b")],
      sansContrainte,
      [],
    );
    expect(res.ok).toBe(true);
    if (res.ok) {
      const inc = res.recettes.find((r) => r.ref === "inc")!;
      expect(inc.incertain).toBe(true);
      expect(inc.raisonsIncertitude.join(" ")).toMatch(/non reconnu/);
    }
  });
});

describe("INVARIANT de sécurité (AC6)", () => {
  it("aucune recette retenue ne franchit le mur", () => {
    const c = construireContraintes([
      { type: "ALLERGIE", valeur: "Arachides" },
      { type: "REGIME", valeur: "Sans gluten" },
    ]);
    const interdits = c.allergenesInterdits;
    // Échantillon déterministe : recettes avec détections variées.
    const recettes: RecetteEntree[] = [];
    for (let i = 0; i < 20; i++) {
      const allergenes =
        i % 3 === 0 ? (["ARACHIDES"] as const) : i % 3 === 1 ? (["GLUTEN"] as const) : ([] as const);
      recettes.push(
        recette(`r${i}`, {
          detection: { allergenes: [...allergenes], ingredientsNonReconnus: [] },
        }),
      );
    }
    const res = resoudre(recettes, c, []);
    if (res.ok) {
      // Toute recette retenue n'a aucun allergène interdit.
      const refsRetenues = new Set(res.recettes.map((r) => r.ref));
      for (const r of recettes) {
        if (refsRetenues.has(r.ref)) {
          const inter = r.detection.allergenes.filter((a) => interdits.includes(a));
          expect(inter).toEqual([]);
        }
      }
    }
  });
});
