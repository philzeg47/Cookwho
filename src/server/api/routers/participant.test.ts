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
import { SEUIL_TOLERANCE_DEFAUT } from "~/lib/restrictions";

function caller(db: unknown) {
  return appRouter.createCaller({
    session: null,
    db,
    headers: new Headers(),
  } as never);
}

describe("participantRouter.monAcces", () => {
  it("renvoie le prénom, le statut, le repas et ses restrictions, sans exposer de recette", async () => {
    const findFirst = vi.fn().mockResolvedValue({
      prenom: "Léa",
      statut: "REPONDU",
      repas: { lieu: "Chez Léa", date: new Date(2026, 6, 1), heure: "12:30" },
      restrictions: [
        { type: "REGIME", valeur: "Végétarien", seuilTolerance: null },
      ],
    });
    const db = { participant: { findFirst } };

    const res = await caller(db).participant.monAcces({ token: "tok" });

    expect(res.prenom).toBe("Léa");
    expect(res.statut).toBe("REPONDU");
    expect(res.restrictions).toHaveLength(1);
    const arg = findFirst.mock.calls[0]![0] as {
      where: { accessToken: string; repas: { expiresAt: { gt: Date } } };
      select: { statut?: unknown; restrictions?: unknown };
    };
    expect(arg.where.accessToken).toBe("tok");
    // Story 3.5 : filtre les repas expirés (pas de lecture après expiration).
    expect(arg.where.repas.expiresAt.gt).toBeInstanceOf(Date);
    // Réouverture (3.4) : le select demande statut + restrictions du participant.
    expect(arg.select.statut).toBe(true);
    expect(arg.select.restrictions).toBeTruthy();
    // Frontière étanche : ni recette ni "participants" (autres convives).
    expect(JSON.stringify(arg.select)).not.toMatch(/recette|recipe|participants/i);
  });

  it("lève NOT_FOUND pour un token inconnu OU un repas expiré (pas de fuite)", async () => {
    // findFirst → null couvre les deux cas (token inconnu et repas expiré) :
    // indistinguables côté client, donc aucune fuite.
    const db = { participant: { findFirst: vi.fn().mockResolvedValue(null) } };
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
  const findFirst = vi.fn().mockResolvedValue(participant);
  const tx = {
    restriction: { deleteMany, createMany },
    participant: { update },
  };
  const $transaction = vi.fn((fn: (t: typeof tx) => Promise<unknown>) =>
    fn(tx),
  );
  const db = { participant: { findFirst }, $transaction };
  return { db, deleteMany, createMany, update, findFirst, $transaction };
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
    const argResolve = m.findFirst.mock.calls[0]![0] as {
      where: { accessToken: string; repas: { expiresAt: { gt: Date } } };
      select: { id: boolean };
    };
    expect(argResolve.where.accessToken).toBe("tok");
    // Story 3.5 : impossible d'écrire sur un repas expiré.
    expect(argResolve.where.repas.expiresAt.gt).toBeInstanceOf(Date);
    expect(argResolve.select).toEqual({ id: true });
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

  it("applique le seuil neutre par défaut à un non-aimé sans seuil fourni", async () => {
    const m = dbPourEnregistrement({ id: "p1" });

    await caller(m.db).participant.enregistrerRestrictions({
      token: "tok",
      restrictions: [{ type: "NON_AIME", valeur: "Olives" }],
    });

    const dataCreee = m.createMany.mock.calls[0]![0] as {
      data: Array<{ seuilTolerance: number | null }>;
    };
    // Défaut serveur = SEUIL_TOLERANCE_DEFAUT (« Équilibré ») = source unique.
    expect(dataCreee.data[0]!.seuilTolerance).toBe(SEUIL_TOLERANCE_DEFAUT);
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

  it("lève NOT_FOUND pour un token inconnu ou un repas expiré (pas de transaction)", async () => {
    // findFirst → null = token inconnu OU repas expiré (filtre expiresAt 3.5).
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
