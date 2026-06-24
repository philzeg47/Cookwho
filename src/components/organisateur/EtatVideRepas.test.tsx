import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { EtatVideRepas } from "./EtatVideRepas";

describe("EtatVideRepas", () => {
  it("affiche un message d'onboarding accueillant", () => {
    render(<EtatVideRepas />);
    expect(screen.getByText(/Aucun repas pour l'instant/)).toBeInTheDocument();
  });

  it("propose un bouton « Créer un repas »", () => {
    render(<EtatVideRepas />);
    expect(
      screen.getByRole("button", { name: /Créer un repas/ }),
    ).toBeInTheDocument();
  });
});
