// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("~/env", () => ({ env: { CRON_SECRET: "test-secret" } }));
vi.mock("~/server/db", () => ({ db: {} }));
vi.mock("~/server/purge", () => ({ purgerRepasExpires: vi.fn() }));

import { GET } from "./route";
import { purgerRepasExpires } from "~/server/purge";

function requete(authorization?: string) {
  const headers = new Headers();
  if (authorization) headers.set("authorization", authorization);
  return new Request("http://localhost/api/cron/purge", { headers });
}

describe("GET /api/cron/purge", () => {
  beforeEach(() => vi.mocked(purgerRepasExpires).mockReset());

  it("répond 401 sans secret et ne purge rien", async () => {
    const res = await GET(requete());
    expect(res.status).toBe(401);
    expect(purgerRepasExpires).not.toHaveBeenCalled();
  });

  it("répond 401 avec un mauvais secret et ne purge rien", async () => {
    const res = await GET(requete("Bearer mauvais"));
    expect(res.status).toBe(401);
    expect(purgerRepasExpires).not.toHaveBeenCalled();
  });

  it("purge et renvoie le compte avec le bon secret", async () => {
    vi.mocked(purgerRepasExpires).mockResolvedValue({ count: 5 } as never);
    const res = await GET(requete("Bearer test-secret"));
    expect(res.status).toBe(200);
    expect(purgerRepasExpires).toHaveBeenCalledTimes(1);
    await expect(res.json()).resolves.toEqual({ purges: 5 });
  });
});
