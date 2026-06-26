import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AccueilParticipant } from "./AccueilParticipant";

describe("AccueilParticipant", () => {
  it("accueille le participant par son prénom et situe le repas", () => {
    render(
      <AccueilParticipant
        acces={{
          prenom: "Léa",
          repas: { lieu: "Chez Léa", date: new Date(2026, 6, 1), heure: "12:30" },
        }}
      />,
    );
    expect(screen.getByText(/Bonjour Léa/)).toBeInTheDocument();
    expect(screen.getByText(/Chez Léa/)).toBeInTheDocument();
  });
});
