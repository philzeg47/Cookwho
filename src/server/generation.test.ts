// @vitest-environment node
import { describe, expect, it, vi } from "vitest";

import { genererPourRepas } from "./generation";
import type { RecetteBrute, SourceDeRecettes } from "./sources/SourceDeRecettes";

type Restriction = {
  type: "REGIME" | "ALLERGIE" | "NON_AIME";
  valeur: string;
  seuilTolerance: number | null;
};
type Participant = { statut: "EN_ATTENTE" | "REPONDU"; restrictions: Restriction[] };

function recetteBrute(ref: string, ingredients: string[]): RecetteBrute {
  return { source: "demo", sourceRef: ref, titre: `Plat ${ref}`, ingredientsTexte: ingredients };
}

/** Source factice (aucun réseau). */
function sourceFactice(recettes: RecetteBrute[]): SourceDeRecettes {
  return { nom: "demo", chercher: vi.fn(async () => recettes) };
}

/** db mocké : repas.findFirst + cache (findMany vide → la source est appelée). */
function dbMock(participants: Participant[] | null) {
  const repas = {
    findFirst: vi.fn(async () =>
      participants === null ? null : { participants },
    ),
  };
  const recetteCache = {
    findMany: vi.fn(async () => [] as RecetteBrute[]),
    upsert: vi.fn(async () => ({})),
  };
  return { db: { repas, recetteCache }, repas, recetteCache };
}

const OPTS = { repasId: "r1", organisateurId: "o1" };

describe("genererPourRepas", () => {
  it("lève NOT_FOUND si le repas n'appartient pas à l'organisateur", async () => {
    const m = dbMock(null);
    await expect(
      genererPourRepas(m.db, sourceFactice([]), OPTS),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("génère 3-10 recettes sûres pour des participants ayant répondu", async () => {
    const m = dbMock([
      { statut: "REPONDU", restrictions: [{ type: "ALLERGIE", valeur: "Arachides", seuilTolerance: null }] },
    ]);
    const recettes = Array.from({ length: 5 }, (_, i) =>
      recetteBrute(`r${i}`, ["tomate", "basilic"]),
    );
    const res = await genererPourRepas(m.db, sourceFactice(recettes), OPTS);
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.recettes.length).toBeGreaterThanOrEqual(3);
  });

  it("exclut de bout en bout une recette contenant un allergène déclaré", async () => {
    const m = dbMock([
      { statut: "REPONDU", restrictions: [{ type: "ALLERGIE", valeur: "Arachides", seuilTolerance: null }] },
    ]);
    const recettes = [
      recetteBrute("danger", ["arachide", "sel"]),
      recetteBrute("a", ["tomate"]),
      recetteBrute("b", ["riz"]),
      recetteBrute("c", ["carotte"]),
    ];
    const res = await genererPourRepas(m.db, sourceFactice(recettes), OPTS);
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.recettes.map((r) => r.ref)).not.toContain("danger");
  });

  it("n'utilise QUE les restrictions des participants REPONDU", async () => {
    // Un EN_ATTENTE allergique aux arachides ne doit PAS exclure la recette.
    const m = dbMock([
      { statut: "EN_ATTENTE", restrictions: [{ type: "ALLERGIE", valeur: "Arachides", seuilTolerance: null }] },
      { statut: "REPONDU", restrictions: [] },
    ]);
    const recettes = [
      recetteBrute("arach", ["arachide"]),
      recetteBrute("a", ["tomate"]),
      recetteBrute("b", ["riz"]),
    ];
    const res = await genererPourRepas(m.db, sourceFactice(recettes), OPTS);
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.recettes.map((r) => r.ref)).toContain("arach");
  });

  it("propage l'incertitude (ingrédient non reconnu)", async () => {
    const m = dbMock([{ statut: "REPONDU", restrictions: [] }]);
    const recettes = [
      recetteBrute("inc", ["ingredient mystere zzz"]),
      recetteBrute("a", ["tomate"]),
      recetteBrute("b", ["riz"]),
    ];
    const res = await genererPourRepas(m.db, sourceFactice(recettes), OPTS);
    expect(res.ok).toBe(true);
    if (res.ok) {
      const inc = res.recettes.find((r) => r.ref === "inc")!;
      expect(inc.incertain).toBe(true);
    }
  });

  it("« régénérer » via exclure → sélection disjointe", async () => {
    const m = dbMock([{ statut: "REPONDU", restrictions: [] }]);
    const recettes = Array.from({ length: 6 }, (_, i) => recetteBrute(`r${i}`, ["tomate"]));
    const src = sourceFactice(recettes);
    const premiere = await genererPourRepas(m.db, src, OPTS);
    if (!premiere.ok) throw new Error("attendu ok");
    const vues = premiere.recettes.map((r) => r.ref);
    const seconde = await genererPourRepas(dbMock([{ statut: "REPONDU", restrictions: [] }]).db, src, {
      ...OPTS,
      exclure: vues,
    });
    if (seconde.ok) for (const r of seconde.recettes) expect(vues).not.toContain(r.ref);
  });
});
