// @vitest-environment node
import { describe, expect, it, vi } from "vitest";

vi.mock("~/server/auth", () => ({ auth: vi.fn() }));
vi.mock("~/server/db", () => ({ db: {} }));
vi.mock("~/env", () => ({
  env: {
    APP_URL: "https://cookwho.test",
    AUTH_RESEND_KEY: "k",
    EMAIL_FROM: "f",
    CRON_SECRET: "c",
    NODE_ENV: "test",
  },
}));

import { appRouter } from "~/server/api/root";

function caller(db: unknown) {
  return appRouter.createCaller({
    session: null,
    db,
    headers: new Headers(),
  } as never);
}

describe("participantRouter.monAcces", () => {
  it("renvoie le prénom et le repas pour un token connu, sans exposer de recette", async () => {
    const findUnique = vi.fn().mockResolvedValue({
      prenom: "Léa",
      repas: { lieu: "Chez Léa", date: new Date(2026, 6, 1), heure: "12:30" },
    });
    const db = { participant: { findUnique } };

    const res = await caller(db).participant.monAcces({ token: "tok" });

    expect(res.prenom).toBe("Léa");
    const arg = findUnique.mock.calls[0]![0] as {
      where: unknown;
      select: unknown;
    };
    expect(arg.where).toEqual({ accessToken: "tok" });
    // Frontière étanche : le select ne demande ni recette ni autres participants.
    expect(JSON.stringify(arg.select)).not.toMatch(/recette|recipe|participant/i);
  });

  it("lève NOT_FOUND pour un token inconnu (pas de fuite)", async () => {
    const db = { participant: { findUnique: vi.fn().mockResolvedValue(null) } };
    await expect(
      caller(db).participant.monAcces({ token: "inconnu" }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
});

/**
 * Construit un db mocké pour `enregistrerRestrictions`. `$transaction` est
 * pris dans sa forme callback : on injecte un `tx` portant les mocks
 * restriction/participant et on renvoie le résultat du callback.
 */
function dbPourEnregistrement(participant: { id: string } | null) {
  const deleteMany = vi.fn().mockResolvedValue({ count: 0 });
  const createMany = vi.fn().mockResolvedValue({ count: 0 });
  const update = vi.fn().mockResolvedValue({});
  const findUnique = vi.fn().mockResolvedValue(participant);
  const tx = {
    restriction: { deleteMany, createMany },
    participant: { update },
  };
  const $transaction = vi.fn((fn: (t: typeof tx) => Promise<unknown>) =>
    fn(tx),
  );
  const db = { participant: { findUnique }, $transaction };
  return { db, deleteMany, createMany, update, findUnique, $transaction };
}

describe("participantRouter.enregistrerRestrictions", () => {
  it("remplace les restrictions et passe le statut à REPONDU", async () => {
    const m = dbPourEnregistrement({ id: "p1" });

    const res = await caller(m.db).participant.enregistrerRestrictions({
      token: "tok",
      restrictions: [
        { type: "REGIME", valeur: "Végétarien" },
        { type: "ALLERGIE", valeur: "Arachide" },
        { type: "NON_AIME", valeur: "Coriandre", seuilTolerance: 1 },
      ],
    });

    expect(res).toEqual({ ok: true });
    expect(m.findUnique).toHaveBeenCalledWith({
      where: { accessToken: "tok" },
      select: { id: true },
    });
    expect(m.deleteMany).toHaveBeenCalledWith({
      where: { participantId: "p1" },
    });
    const dataCreee = m.createMany.mock.calls[0]![0] as {
      data: Array<{ type: string; seuilTolerance: number | null }>;
    };
    // Le seuil n'est porté que par le non-aimé ; régime/allergie → null.
    expect(dataCreee.data).toEqual([
      expect.objectContaining({ type: "REGIME", seuilTolerance: null }),
      expect.objectContaining({ type: "ALLERGIE", seuilTolerance: null }),
      expect.objectContaining({ type: "NON_AIME", seuilTolerance: 1 }),
    ]);
    expect(m.update).toHaveBeenCalledWith({
      where: { id: "p1" },
      data: { statut: "REPONDU" },
    });
  });

  it("applique un seuil neutre (3) à un non-aimé sans seuil fourni", async () => {
    const m = dbPourEnregistrement({ id: "p1" });

    await caller(m.db).participant.enregistrerRestrictions({
      token: "tok",
      restrictions: [{ type: "NON_AIME", valeur: "Olives" }],
    });

    const dataCreee = m.createMany.mock.calls[0]![0] as {
      data: Array<{ seuilTolerance: number | null }>;
    };
    expect(dataCreee.data[0]!.seuilTolerance).toBe(3);
  });

  it("accepte un tableau vide (aucune restriction obligatoire) sans createMany", async () => {
    const m = dbPourEnregistrement({ id: "p1" });

    const res = await caller(m.db).participant.enregistrerRestrictions({
      token: "tok",
      restrictions: [],
    });

    expect(res).toEqual({ ok: true });
    expect(m.deleteMany).toHaveBeenCalledOnce();
    expect(m.createMany).not.toHaveBeenCalled();
    expect(m.update).toHaveBeenCalledWith({
      where: { id: "p1" },
      data: { statut: "REPONDU" },
    });
  });

  it("lève NOT_FOUND pour un token inconnu (pas de transaction)", async () => {
    const m = dbPourEnregistrement(null);

    await expect(
      caller(m.db).participant.enregistrerRestrictions({
        token: "inconnu",
        restrictions: [],
      }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(m.$transaction).not.toHaveBeenCalled();
  });

  it("rejette un seuilTolerance sur une allergie (Zod refine)", async () => {
    const m = dbPourEnregistrement({ id: "p1" });

    await expect(
      caller(m.db).participant.enregistrerRestrictions({
        token: "tok",
        restrictions: [
          { type: "ALLERGIE", valeur: "Arachide", seuilTolerance: 2 },
        ],
      }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("rejette au-delà du plafond de 50 restrictions (anti-abus)", async () => {
    const m = dbPourEnregistrement({ id: "p1" });
    const trop = Array.from({ length: 51 }, (_, i) => ({
      type: "ALLERGIE" as const,
      valeur: `a${i}`,
    }));

    await expect(
      caller(m.db).participant.enregistrerRestrictions({
        token: "tok",
        restrictions: trop,
      }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(m.$transaction).not.toHaveBeenCalled();
  });
});
