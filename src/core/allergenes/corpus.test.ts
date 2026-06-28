import { describe, expect, it } from "vitest";

import { ALLERGENES_UE_CODES, type AllergeneUE } from "./allergenes-ue";
import { detect } from "./detect";
import corpus from "./fixtures/ingredients-annotes.json";

type CasCorpus = {
  ingredients: string[];
  allergenesAttendus: AllergeneUE[];
  note?: string;
};

const cas = corpus as CasCorpus[];

describe("corpus d'or — gate de sécurité (assertion asymétrique)", () => {
  // NFR3 : un FAUX NÉGATIF (allergène attendu non détecté) fait échouer le
  // build. Les faux positifs ne cassent pas le build (moteur conservateur).
  it.each(cas)(
    "détecte au moins les allergènes attendus : $note",
    ({ ingredients, allergenesAttendus }) => {
      const { allergenes } = detect(ingredients);
      expect(allergenes).toEqual(expect.arrayContaining(allergenesAttendus));
    },
  );

  it("couvre les 14 allergènes UE (le gate teste bien chacun)", () => {
    const couverts = new Set(cas.flatMap((c) => c.allergenesAttendus));
    for (const code of ALLERGENES_UE_CODES) {
      expect(couverts.has(code)).toBe(true);
    }
  });
});
