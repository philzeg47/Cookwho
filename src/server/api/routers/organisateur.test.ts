// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

// Importer le router charge la chaîne tRPC (auth + db + env) : on neutralise
// les modules à I/O ; le contexte est injecté à la main dans chaque test.
vi.mock("~/server/auth", () => ({ auth: vi.fn() }));
vi.mock("~/server/db", () => ({ db: {} }));
vi.mock("~/env", () => ({
  env: {
    APP_URL: "https://cookwho.test",
    AUTH_RESEND_KEY: "test-key",
    EMAIL_FROM: "CookWho <test@exemple.fr>",
    NODE_ENV: "test",
  },
}));
vi.mock("~/server/email", () => ({ envoyerEmail: vi.fn() }));

import { appRouter } from "~/server/api/root";
import { envoyerEmail } from "~/server/email";

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

describe("organisateurRouter — participants", () => {
  it("ajouterParticipant refuse un repas non possédé (NOT_FOUND, pas de création)", async () => {
    const participantCreate = vi.fn();
    const db = {
      repas: { findFirst: vi.fn().mockResolvedValue(null) },
      participant: { create: participantCreate },
    };
    await expect(
      caller({ user: { id: "orga-1" } }, db).organisateur.ajouterParticipant({
        repasId: "repas-autrui",
        prenom: "Léa",
      }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(participantCreate).not.toHaveBeenCalled();
  });

  it("ajouterParticipant crée le participant avec un accessToken quand le repas appartient", async () => {
    const create = vi.fn().mockResolvedValue({ id: "p1" });
    const db = {
      repas: { findFirst: vi.fn().mockResolvedValue({ id: "repas-1" }) },
      participant: { create, count: vi.fn().mockResolvedValue(0) },
    };
    await caller({ user: { id: "orga-1" } }, db).organisateur.ajouterParticipant({
      repasId: "repas-1",
      prenom: "Léa",
      email: "lea@exemple.fr",
    });
    const data = create.mock.calls[0]![0].data as {
      repasId: string;
      accessToken: string;
      email?: string;
    };
    expect(data.repasId).toBe("repas-1");
    expect(data.accessToken.length).toBeGreaterThan(0);
    expect(data.email).toBe("lea@exemple.fr");
  });

  it("ajouterParticipant accepte un email absent", async () => {
    const create = vi.fn().mockResolvedValue({ id: "p1" });
    const db = {
      repas: { findFirst: vi.fn().mockResolvedValue({ id: "repas-1" }) },
      participant: { create, count: vi.fn().mockResolvedValue(0) },
    };
    await caller({ user: { id: "orga-1" } }, db).organisateur.ajouterParticipant({
      repasId: "repas-1",
      prenom: "Sans Email",
    });
    const data = create.mock.calls[0]![0].data as { email?: string };
    expect(data.email).toBeUndefined();
  });

  it("ajouterParticipant refuse au-delà du plafond de participants", async () => {
    const create = vi.fn();
    const db = {
      repas: { findFirst: vi.fn().mockResolvedValue({ id: "repas-1" }) },
      participant: { create, count: vi.fn().mockResolvedValue(50) },
    };
    await expect(
      caller({ user: { id: "orga-1" } }, db).organisateur.ajouterParticipant({
        repasId: "repas-1",
        prenom: "Trop",
      }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(create).not.toHaveBeenCalled();
  });

  it("repasDetail filtre sur l'organisateur de la session", async () => {
    const findFirst = vi
      .fn()
      .mockResolvedValue({ id: "repas-1", participants: [] });
    const db = { repas: { findFirst } };
    await caller({ user: { id: "orga-9" } }, db).organisateur.repasDetail({
      repasId: "repas-1",
    });
    expect(findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "repas-1", organisateurId: "orga-9" },
      }),
    );
  });
});

describe("organisateurRouter — envoyerInvitation", () => {
  beforeEach(() => {
    vi.mocked(envoyerEmail).mockClear();
  });

  it("refuse un participant d'un repas non possédé (NOT_FOUND)", async () => {
    const db = { participant: { findFirst: vi.fn().mockResolvedValue(null) } };
    await expect(
      caller({ user: { id: "orga-1" } }, db).organisateur.envoyerInvitation({
        participantId: "p-autrui",
      }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(envoyerEmail).not.toHaveBeenCalled();
  });

  it("refuse un participant sans email (BAD_REQUEST)", async () => {
    const db = {
      participant: {
        findFirst: vi.fn().mockResolvedValue({
          id: "p1",
          email: null,
          accessToken: "tok",
          prenom: "Léa",
          repas: { lieu: "Chez Léa" },
        }),
      },
    };
    await expect(
      caller({ user: { id: "orga-1" } }, db).organisateur.envoyerInvitation({
        participantId: "p1",
      }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(envoyerEmail).not.toHaveBeenCalled();
  });

  it("envoie l'invitation au participant quand tout est valide", async () => {
    const db = {
      participant: {
        findFirst: vi.fn().mockResolvedValue({
          id: "p1",
          email: "lea@exemple.fr",
          accessToken: "tok-123",
          prenom: "Léa",
          repas: { lieu: "Chez Léa" },
        }),
      },
    };
    await caller({ user: { id: "orga-1" } }, db).organisateur.envoyerInvitation({
      participantId: "p1",
    });
    expect(envoyerEmail).toHaveBeenCalledTimes(1);
    const arg = vi.mocked(envoyerEmail).mock.calls[0]![0];
    expect(arg.to).toBe("lea@exemple.fr");
    expect(arg.html).toContain("https://cookwho.test/p/tok-123");
  });

  it("échappe le prénom dans le HTML de l'email (anti-injection)", async () => {
    const db = {
      participant: {
        findFirst: vi.fn().mockResolvedValue({
          id: "p1",
          email: "lea@exemple.fr",
          accessToken: "tok",
          prenom: '<img src=x onerror="alert(1)">',
          repas: { lieu: "Chez Léa" },
        }),
      },
    };
    await caller({ user: { id: "orga-1" } }, db).organisateur.envoyerInvitation({
      participantId: "p1",
    });
    const html = vi.mocked(envoyerEmail).mock.calls[0]![0].html;
    expect(html).not.toContain("<img");
    expect(html).toContain("&lt;img");
  });
});
