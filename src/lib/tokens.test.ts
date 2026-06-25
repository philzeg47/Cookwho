// @vitest-environment node
import { describe, expect, it } from "vitest";

import { genererAccessToken } from "./tokens";

describe("genererAccessToken", () => {
  it("produit un token URL-safe d'au moins 43 caractères (256 bits base64url)", () => {
    const token = genererAccessToken();
    expect(token.length).toBeGreaterThanOrEqual(43);
    expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it("produit des tokens différents à chaque appel", () => {
    const tokens = new Set(
      Array.from({ length: 100 }, () => genererAccessToken()),
    );
    expect(tokens.size).toBe(100);
  });
});
