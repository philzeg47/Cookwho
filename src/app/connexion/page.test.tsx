import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

// La page importe `signIn` (server-only) et `redirect` — on les neutralise.
vi.mock("~/server/auth", () => ({ signIn: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));

import ConnexionPage from "./page";

describe("ConnexionPage", () => {
  it("rend un champ email et un bouton d'envoi du lien magique", async () => {
    render(await ConnexionPage({ searchParams: Promise.resolve({}) }));
    expect(screen.getByLabelText("Ton email")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /lien de connexion/i }),
    ).toBeInTheDocument();
  });

  it("affiche un message d'erreur quand ?error est présent", async () => {
    render(await ConnexionPage({ searchParams: Promise.resolve({ error: "envoi" }) }));
    expect(screen.getByText(/l'envoi du lien a échoué/i)).toBeInTheDocument();
  });
});
