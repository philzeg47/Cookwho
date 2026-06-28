import { describe, expect, it, vi, beforeEach } from "vitest";

// On neutralise le runtime auth (sinon next-auth tire `next/server`, cassé sous
// Vitest) et on espionne la redirection.
const auth = vi.fn();
const redirect = vi.fn();
vi.mock("~/server/auth", () => ({ auth: () => auth(), signOut: vi.fn() }));
// Reflète la sémantique réelle : `redirect` interrompt le rendu en levant.
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    redirect(url);
    throw new Error(`NEXT_REDIRECT:${url}`);
  },
}));

import OrganisateurLayout from "./layout";

describe("OrganisateurLayout (garde d'authentification)", () => {
  beforeEach(() => {
    auth.mockReset();
    redirect.mockReset();
  });

  it("redirige vers /connexion (et interrompt le rendu) quand aucune session", async () => {
    auth.mockResolvedValue(null);
    await expect(OrganisateurLayout({ children: null })).rejects.toThrow(
      /NEXT_REDIRECT/,
    );
    expect(redirect).toHaveBeenCalledWith("/connexion");
  });

  it("ne redirige pas quand une session organisateur est active", async () => {
    auth.mockResolvedValue({ user: { id: "orga-1" } });
    await OrganisateurLayout({ children: null });
    expect(redirect).not.toHaveBeenCalled();
  });
});
