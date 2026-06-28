import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { RepasListe } from "./RepasListe";

describe("RepasListe", () => {
  it("affiche le lieu, la date et l'heure d'un repas", () => {
    const date = new Date(2026, 6, 1);
    render(
      <RepasListe
        repas={[
          {
            id: "r1",
            organisateurId: "orga-1",
            lieu: "Chez Léa",
            date,
            heure: "12:30",
            createdAt: date,
            expiresAt: date,
            platRetenuRef: null,
            platRetenuTitre: null,
          },
        ]}
      />,
    );
    expect(screen.getByText("Chez Léa")).toBeInTheDocument();
    expect(screen.getByText(/12:30/)).toBeInTheDocument();
  });
});
