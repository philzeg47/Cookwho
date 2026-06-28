import { describe, expect, it } from "vitest";

import { detecterProprietes, type ProprieteAlimentaire, PROPRIETES_CODES } from "./proprietes";
import corpus from "./fixtures/ingredients-regimes.json";

type CasCorpus = {
  ingredients: string[];
  proprietesAttendues: ProprieteAlimentaire[];
  note?: string;
};

const cas = corpus as CasCorpus[];

describe("corpus d'or régimes — gate de sécurité (assertion asymétrique)", () => {
  // Un FAUX NÉGATIF (propriété attendue non détectée) fait échouer le build.
  // Les faux positifs ne cassent pas le build (moteur conservateur).
  it.each(cas)(
    "détecte au moins les propriétés attendues : $note",
    ({ ingredients, proprietesAttendues }) => {
      const { proprietes } = detecterProprietes(ingredients);
      expect(proprietes).toEqual(expect.arrayContaining(proprietesAttendues));
    },
  );

  it("couvre les 5 propriétés (le gate teste bien chacune)", () => {
    const couvertes = new Set(cas.flatMap((c) => c.proprietesAttendues));
    for (const code of PROPRIETES_CODES) {
      expect(couvertes.has(code)).toBe(true);
    }
  });
});
