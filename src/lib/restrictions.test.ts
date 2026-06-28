import { describe, expect, it } from "vitest";

import {
  ALLERGENES_UE,
  REGIMES_COURANTS,
  SEUIL_TOLERANCE_DEFAUT,
  TOLERANCE_LABELS,
} from "./restrictions";

describe("données de référence des restrictions", () => {
  it("couvre exactement les 14 allergènes réglementaires UE", () => {
    expect(ALLERGENES_UE).toHaveLength(14);
    // Pas de doublon dans la liste.
    expect(new Set(ALLERGENES_UE).size).toBe(14);
  });

  it("propose au moins un régime courant, sans doublon", () => {
    expect(REGIMES_COURANTS.length).toBeGreaterThan(0);
    expect(new Set(REGIMES_COURANTS).size).toBe(REGIMES_COURANTS.length);
  });

  it("garde le seuil par défaut dans les bornes des libellés et du serveur (0-5)", () => {
    expect(SEUIL_TOLERANCE_DEFAUT).toBeGreaterThanOrEqual(0);
    expect(SEUIL_TOLERANCE_DEFAUT).toBeLessThanOrEqual(TOLERANCE_LABELS.length - 1);
    // Borne serveur Zod (story 3.2a) : seuilTolerance ∈ [0, 5].
    expect(TOLERANCE_LABELS.length - 1).toBeLessThanOrEqual(5);
  });
});
