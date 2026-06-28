import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { EtatGenerationEnCours } from "./EtatGenerationEnCours";

describe("EtatGenerationEnCours", () => {
  it("annonce l'attente (role status) avec un message narratif", () => {
    render(<EtatGenerationEnCours />);
    const region = screen.getByRole("status");
    expect(region).toHaveAttribute("aria-busy", "true");
    expect(region).toHaveTextContent(/On vérifie chaque assiette/);
  });
});
