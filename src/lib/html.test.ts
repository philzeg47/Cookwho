// @vitest-environment node
import { describe, expect, it } from "vitest";

import { echapperHtml } from "./html";

describe("echapperHtml", () => {
  it("neutralise les balises et guillemets", () => {
    expect(echapperHtml('<img src=x onerror="alert(1)">')).toBe(
      "&lt;img src=x onerror=&quot;alert(1)&quot;&gt;",
    );
  });

  it("laisse un texte simple intact", () => {
    expect(echapperHtml("Léa")).toBe("Léa");
  });
});
