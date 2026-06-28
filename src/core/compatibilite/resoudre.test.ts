import { describe, expect, it } from "vitest";

import { type AllergeneUE, LIBELLES_ALLERGENES, type ResultatDetection } from "../allergenes";
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

  it("clamp `max` sous `min` : `ok:true` renvoie au moins `min` recettes", () => {
    const recettes = Array.from({ length: 5 }, (_, i) => recette(`r${i}`));
    const res = resoudre(recettes, sansContrainte, [], { min: 3, max: 1 });
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.recettes.length).toBe(3);
  });

  it("renvoie PAS_ASSEZ quand < 3 compatibles (pool trop petit → aucune contrainte bloquante)", () => {
    const res = resoudre([recette("r0"), recette("r1")], sansContrainte, []);
    expect(res).toEqual({
      ok: false,
      raison: "PAS_ASSEZ",
      compatibles: 2,
      contraintesBloquantes: [],
    });
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

  it("mode TOUS_CONTENTS quand ≥ 3 recettes plaisent à tout le groupe (pénalité 0)", () => {
    const recettes = Array.from({ length: 4 }, (_, i) => recette(`r${i}`, { ingredients: ["riz"] }));
    const res = resoudre(recettes, sansContrainte, [{ valeur: "Champignons", seuilTolerance: 0 }]);
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.mode).toBe("TOUS_CONTENTS");
      for (const r of res.recettes) {
        expect(r.penalite).toBe(0);
        expect(r.ingredientsGenants).toEqual([]);
      }
    }
  });

  it("mode DEGRADATION quand aucun lot de 3 n'a une pénalité nulle", () => {
    // 3 recettes contenant toutes le non-aimé → aucune à pénalité 0.
    const recettes = Array.from({ length: 3 }, (_, i) =>
      recette(`r${i}`, { ingredients: ["champignons", `garniture${i}`] }),
    );
    const res = resoudre(recettes, sansContrainte, [{ valeur: "Champignons", seuilTolerance: 0 }]);
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.mode).toBe("DEGRADATION");
      expect(res.recettes.length).toBeGreaterThanOrEqual(3);
      // Ingrédients gênants signalés sur les recettes froissées.
      for (const r of res.recettes) {
        expect(r.penalite).toBeGreaterThan(0);
        expect(r.ingredientsGenants).toContain("Champignons");
      }
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

  it("en mode DEGRADATION, aucune recette retenue ne franchit le mur (AC4)", () => {
    const c = construireContraintes([{ type: "ALLERGIE", valeur: "Arachides" }]);
    const interdits = c.allergenesInterdits;
    // Mélange : recettes dangereuses + recettes saines qui froissent TOUTES le
    // goût (champignons) → force la dégradation tout en testant la sécurité.
    const recettes: RecetteEntree[] = [];
    for (let i = 0; i < 12; i++) {
      const danger = i % 2 === 0;
      recettes.push(
        recette(`r${i}`, {
          ingredients: ["champignons", `g${i}`],
          detection: {
            allergenes: danger ? ["ARACHIDES"] : [],
            ingredientsNonReconnus: [],
          },
        }),
      );
    }
    const res = resoudre(recettes, c, [{ valeur: "Champignons", seuilTolerance: 0 }]);
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.mode).toBe("DEGRADATION");
      const refsRetenues = new Set(res.recettes.map((r) => r.ref));
      for (const r of recettes) {
        if (refsRetenues.has(r.ref)) {
          expect(r.detection.allergenes.filter((a) => interdits.includes(a))).toEqual([]);
        }
      }
    }
  });
});

describe("échec explicatif (4.6)", () => {
  const danger = (ref: string, allergenes: AllergeneUE[]): RecetteEntree =>
    recette(ref, { detection: { allergenes, ingredientsNonReconnus: [] } });

  it("nomme l'allergène bloquant avec son type, libellé FR et compte", () => {
    const c = construireContraintes([{ type: "ALLERGIE", valeur: "Arachides" }]);
    const res = resoudre(
      [danger("d0", ["ARACHIDES"]), danger("d1", ["ARACHIDES"]), danger("d2", ["ARACHIDES"]), recette("ok")],
      c,
      [],
    );
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.contraintesBloquantes).toEqual([
        {
          type: "ALLERGIE",
          cle: "ARACHIDES",
          libelle: LIBELLES_ALLERGENES.ARACHIDES,
          recettesBloquees: 3,
        },
      ]);
    }
  });

  it("trie les contraintes par impact décroissant (la plus bloquante en tête)", () => {
    const c = construireContraintes([
      { type: "ALLERGIE", valeur: "Arachides" },
      { type: "ALLERGIE", valeur: "Moutarde" },
    ]);
    const res = resoudre(
      [
        danger("a0", ["ARACHIDES"]),
        danger("a1", ["ARACHIDES"]),
        danger("a2", ["ARACHIDES"]),
        danger("m0", ["MOUTARDE"]),
        recette("ok"),
      ],
      c,
      [],
    );
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.contraintesBloquantes.map((x) => x.cle)).toEqual(["ARACHIDES", "MOUTARDE"]);
      expect(res.contraintesBloquantes[0]!.recettesBloquees).toBe(3);
      expect(res.contraintesBloquantes[1]!.recettesBloquees).toBe(1);
    }
  });

  it("étiquette une contrainte de régime-allergène comme REGIME", () => {
    const c = construireContraintes([{ type: "REGIME", valeur: "Sans gluten" }]);
    const res = resoudre(
      [danger("g0", ["GLUTEN"]), danger("g1", ["GLUTEN"]), danger("g2", ["GLUTEN"]), recette("ok")],
      c,
      [],
    );
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.contraintesBloquantes[0]).toMatchObject({ type: "REGIME", cle: "GLUTEN" });
    }
  });

  it("ne fusionne PAS un allergène et une propriété de même nom (POISSON allergène vs propriété)", () => {
    const c = construireContraintes([
      { type: "ALLERGIE", valeur: "Poisson" },
      { type: "REGIME", valeur: "Végétarien" },
    ]);
    const saumon = (ref: string): RecetteEntree => ({
      ...recette(ref),
      detection: { allergenes: ["POISSON"], ingredientsNonReconnus: [] },
      detectionProprietes: { proprietes: ["POISSON"], ingredientsNonReconnus: [] },
    });
    const res = resoudre([saumon("s0"), saumon("s1"), saumon("s2"), recette("ok")], c, []);
    expect(res.ok).toBe(false);
    if (!res.ok) {
      const types = res.contraintesBloquantes.filter((x) => x.cle === "POISSON").map((x) => x.type);
      expect(new Set(types)).toEqual(new Set(["ALLERGIE", "REGIME_ALIMENTAIRE"]));
      for (const cb of res.contraintesBloquantes) expect(cb.recettesBloquees).toBe(3);
    }
  });

  it("nomme un régime alimentaire bloquant (REGIME_ALIMENTAIRE, libellé propriété)", () => {
    const c = construireContraintes([{ type: "REGIME", valeur: "Végétarien" }]);
    const viande = (ref: string): RecetteEntree => ({
      ...recette(ref),
      detectionProprietes: { proprietes: ["VIANDE"], ingredientsNonReconnus: [] },
    });
    const res = resoudre([viande("v0"), viande("v1"), viande("v2"), recette("ok")], c, []);
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.contraintesBloquantes[0]).toMatchObject({
        type: "REGIME_ALIMENTAIRE",
        cle: "VIANDE",
        libelle: "viande",
        recettesBloquees: 3,
      });
    }
  });
});
