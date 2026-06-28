// @vitest-environment node
import { describe, expect, it, vi } from "vitest";

import { genererPourRepas } from "./generation";
import type { RecetteBrute, SourceDeRecettes } from "./sources/SourceDeRecettes";

type Restriction = {
  type: "REGIME" | "ALLERGIE" | "NON_AIME";
  valeur: string;
  seuilTolerance: number | null;
};
type Participant = {
  prenom: string;
  statut: "EN_ATTENTE" | "REPONDU";
  restrictions: Restriction[];
};

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

const repondu = (prenom: string, restrictions: Restriction[] = []): Participant => ({
  prenom,
  statut: "REPONDU",
  restrictions,
});
const enAttente = (prenom: string): Participant => ({
  prenom,
  statut: "EN_ATTENTE",
  restrictions: [],
});

const OPTS = { repasId: "r1", organisateurId: "o1" };

describe("genererPourRepas", () => {
  it("lève NOT_FOUND si le repas n'appartient pas à l'organisateur", async () => {
    const m = dbMock(null);
    await expect(
      genererPourRepas(m.db, sourceFactice([]), OPTS),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("génère (force:false, aucun non-couvert) quand tous ont répondu", async () => {
    const m = dbMock([
      repondu("Léa", [{ type: "ALLERGIE", valeur: "Arachides", seuilTolerance: null }]),
    ]);
    const recettes = Array.from({ length: 5 }, (_, i) =>
      recetteBrute(`r${i}`, ["tomate", "basilic"]),
    );
    const res = await genererPourRepas(m.db, sourceFactice(recettes), OPTS);
    expect(res.statut).toBe("GENERE");
    if (res.statut === "GENERE") {
      expect(res.force).toBe(false);
      expect(res.nonCouverts).toEqual([]);
      expect(res.resolution.ok).toBe(true);
      if (res.resolution.ok) expect(res.resolution.recettes.length).toBeGreaterThanOrEqual(3);
    }
  });

  it("exclut de bout en bout une recette contenant un allergène déclaré", async () => {
    const m = dbMock([
      repondu("Léa", [{ type: "ALLERGIE", valeur: "Arachides", seuilTolerance: null }]),
    ]);
    const recettes = [
      recetteBrute("danger", ["arachide", "sel"]),
      recetteBrute("a", ["tomate"]),
      recetteBrute("b", ["riz"]),
      recetteBrute("c", ["carotte"]),
    ];
    const res = await genererPourRepas(m.db, sourceFactice(recettes), OPTS);
    expect(res.statut).toBe("GENERE");
    if (res.statut === "GENERE" && res.resolution.ok) {
      expect(res.resolution.recettes.map((r) => r.ref)).not.toContain("danger");
    }
  });

  it("propage l'incertitude (ingrédient non reconnu)", async () => {
    const m = dbMock([repondu("Léa")]);
    const recettes = [
      recetteBrute("inc", ["ingredient mystere zzz"]),
      recetteBrute("a", ["tomate"]),
      recetteBrute("b", ["riz"]),
    ];
    const res = await genererPourRepas(m.db, sourceFactice(recettes), OPTS);
    expect(res.statut).toBe("GENERE");
    if (res.statut === "GENERE" && res.resolution.ok) {
      const inc = res.resolution.recettes.find((r) => r.ref === "inc")!;
      expect(inc.incertain).toBe(true);
    }
  });

  it("« régénérer » via exclure → sélection disjointe", async () => {
    const recettes = Array.from({ length: 6 }, (_, i) => recetteBrute(`r${i}`, ["tomate"]));
    const src = sourceFactice(recettes);
    const premiere = await genererPourRepas(dbMock([repondu("Léa")]).db, src, OPTS);
    if (premiere.statut !== "GENERE" || !premiere.resolution.ok) throw new Error("attendu généré");
    const vues = premiere.resolution.recettes.map((r) => r.ref);
    const seconde = await genererPourRepas(dbMock([repondu("Léa")]).db, src, {
      ...OPTS,
      exclure: vues,
    });
    if (seconde.statut === "GENERE" && seconde.resolution.ok) {
      for (const r of seconde.resolution.recettes) expect(vues).not.toContain(r.ref);
    }
  });
});

describe("genererPourRepas — génération forcée (4.7)", () => {
  it("ATTENTE_REPONSES sans forçage quand un participant n'a pas répondu (source NON appelée)", async () => {
    const m = dbMock([repondu("Léa"), enAttente("Paul")]);
    const src = sourceFactice(Array.from({ length: 5 }, (_, i) => recetteBrute(`r${i}`, ["tomate"])));
    const res = await genererPourRepas(m.db, src, OPTS);
    expect(res.statut).toBe("ATTENTE_REPONSES");
    if (res.statut === "ATTENTE_REPONSES") expect(res.nonCouverts).toEqual(["Paul"]);
    // Court-circuit : aucun appel à la source ni au cache.
    expect(src.chercher).not.toHaveBeenCalled();
    expect(m.recetteCache.findMany).not.toHaveBeenCalled();
  });

  it("forcer:true génère, nomme les non-couverts, et le mur des REPONDU tient", async () => {
    // Léa (REPONDU) allergique arachides ; Paul/Max EN_ATTENTE non couverts.
    const m = dbMock([
      repondu("Léa", [{ type: "ALLERGIE", valeur: "Arachides", seuilTolerance: null }]),
      enAttente("Paul"),
      enAttente("Max"),
    ]);
    const recettes = [
      recetteBrute("danger", ["arachide"]),
      recetteBrute("a", ["tomate"]),
      recetteBrute("b", ["riz"]),
      recetteBrute("c", ["carotte"]),
    ];
    const res = await genererPourRepas(m.db, sourceFactice(recettes), { ...OPTS, forcer: true });
    expect(res.statut).toBe("GENERE");
    if (res.statut === "GENERE") {
      expect(res.force).toBe(true);
      expect(res.nonCouverts).toEqual(["Paul", "Max"]);
      expect(res.resolution.ok).toBe(true);
      if (res.resolution.ok) {
        // Le mur du REPONDU reste garanti malgré le forçage.
        expect(res.resolution.recettes.map((r) => r.ref)).not.toContain("danger");
      }
    }
  });

  it("forcer:true avec TOUS en attente → génère sans contrainte et avertit tout le monde", async () => {
    // Aucun REPONDU → aucune contrainte déclarée. L'avertissement (force:true +
    // nonCouverts) garantit que l'UI signale que personne n'est couvert.
    const m = dbMock([enAttente("Paul"), enAttente("Max")]);
    const recettes = Array.from({ length: 4 }, (_, i) => recetteBrute(`r${i}`, ["tomate"]));
    const res = await genererPourRepas(m.db, sourceFactice(recettes), { ...OPTS, forcer: true });
    expect(res.statut).toBe("GENERE");
    if (res.statut === "GENERE") {
      expect(res.force).toBe(true);
      expect(res.nonCouverts).toEqual(["Paul", "Max"]);
      expect(res.resolution.ok).toBe(true);
    }
  });
});
