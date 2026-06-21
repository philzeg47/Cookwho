import { describe, expect, it } from "vitest";

import { CORE_PLACEHOLDER } from "./index";

describe("socle /core", () => {
  it("expose le placeholder du noyau", () => {
    expect(CORE_PLACEHOLDER).toBe("cookwho-core");
  });
});
