import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { LienInvalide } from "./LienInvalide";

describe("LienInvalide", () => {
  it("affiche un message d'invalidité sans fuite d'information", () => {
    render(<LienInvalide />);
    expect(screen.getByText("Lien non valide")).toBeInTheDocument();
    expect(screen.getByText(/recontacte la personne qui organise/i)).toBeInTheDocument();
  });
});
