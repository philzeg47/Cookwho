// @vitest-environment node
import { describe, expect, it, vi } from "vitest";

import { purgerRepasExpires } from "./purge";

describe("purgerRepasExpires", () => {
  it("supprime uniquement les repas dont expiresAt est dépassé", async () => {
    const deleteMany = vi.fn().mockResolvedValue({ count: 3 });
    const db = { repas: { deleteMany } } as never;
    const maintenant = new Date("2026-06-24T00:00:00Z");

    const res = await purgerRepasExpires(db, maintenant);

    expect(deleteMany).toHaveBeenCalledWith({
      where: { expiresAt: { lt: maintenant } },
    });
    expect(res.count).toBe(3);
  });
});
