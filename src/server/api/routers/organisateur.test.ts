// @vitest-environment node
import { describe, expect, it, vi } from "vitest";

// Importer le router charge la chaîne tRPC (auth + db + env) : on neutralise
// les modules à I/O ; le contexte est injecté à la main dans chaque test.
vi.mock("~/server/auth", () => ({ auth: vi.fn() }));
vi.mock("~/server/db", () => ({ db: {} }));

import { appRouter } from "~/server/api/root";

type Session = { user: { id: string } } | null;

function caller(session: Session, db: unknown) {
  return appRouter.createCaller({
    session,
    db,
    headers: new Headers(),
  } as never);
}

describe("organisateurRouter", () => {
  it("creerRepas rattache le repas à la session et calcule expiresAt", async () => {
    const create = vi.fn().mockResolvedValue({ id: "r1" });
    const db = { repas: { create, findMany: vi.fn() } };

    await caller({ user: { id: "orga-1" } }, db).organisateur.creerRepas({
      lieu: "Chez Léa",
      date: new Date(2026, 6, 1),
      heure: "12:30",
    });

    expect(create).toHaveBeenCalledTimes(1);
    const data = create.mock.calls[0]![0].data as {
      organisateurId: string;
      expiresAt: Date;
      date: Date;
    };
    expect(data.organisateurId).toBe("orga-1");
    expect(data.expiresAt).toBeInstanceOf(Date);
    expect(data.expiresAt.getTime()).toBeGreaterThan(data.date.getTime());
  });

  it("mesRepas filtre sur l'organisateur de la session", async () => {
    const findMany = vi.fn().mockResolvedValue([]);
    const db = { repas: { create: vi.fn(), findMany } };

    await caller({ user: { id: "orga-9" } }, db).organisateur.mesRepas();

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { organisateurId: "orga-9" } }),
    );
  });

  it("refuse un appel non authentifié (UNAUTHORIZED)", async () => {
    const db = { repas: { create: vi.fn(), findMany: vi.fn() } };
    await expect(
      caller(null, db).organisateur.mesRepas(),
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("rejette une heure mal formée (validation Zod)", async () => {
    const db = { repas: { create: vi.fn(), findMany: vi.fn() } };
    await expect(
      caller({ user: { id: "orga-1" } }, db).organisateur.creerRepas({
        lieu: "Chez Léa",
        date: new Date(2026, 6, 1),
        heure: "midi",
      }),
    ).rejects.toBeTruthy();
  });

  it("rejette un lieu composé uniquement d'espaces (trim)", async () => {
    const create = vi.fn();
    const db = { repas: { create, findMany: vi.fn() } };
    await expect(
      caller({ user: { id: "orga-1" } }, db).organisateur.creerRepas({
        lieu: "   ",
        date: new Date(2026, 6, 1),
        heure: "12:30",
      }),
    ).rejects.toBeTruthy();
    expect(create).not.toHaveBeenCalled();
  });

  it("rejette une date dans le passé", async () => {
    const create = vi.fn();
    const db = { repas: { create, findMany: vi.fn() } };
    await expect(
      caller({ user: { id: "orga-1" } }, db).organisateur.creerRepas({
        lieu: "Chez Léa",
        date: new Date(2020, 0, 1),
        heure: "12:30",
      }),
    ).rejects.toBeTruthy();
    expect(create).not.toHaveBeenCalled();
  });
});
