// @vitest-environment node
import { describe, expect, it } from "vitest";

import { computeExpiresAt, TTL_REPAS_JOURS } from "./repas";

describe("computeExpiresAt", () => {
  it(`ajoute ${TTL_REPAS_JOURS} jours à la date du repas`, () => {
    const date = new Date(2026, 6, 1); // 1er juillet 2026 (heure locale)
    const expires = computeExpiresAt(date);
    const diffJours = Math.round(
      (expires.getTime() - date.getTime()) / (24 * 60 * 60 * 1000),
    );
    expect(diffJours).toBe(TTL_REPAS_JOURS);
  });

  it("ne mute pas la date d'entrée", () => {
    const date = new Date(2026, 6, 1);
    const avant = date.getTime();
    computeExpiresAt(date);
    expect(date.getTime()).toBe(avant);
  });
});
