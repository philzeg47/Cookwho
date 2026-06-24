import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Input } from "./Input";

describe("Input", () => {
  it("associe le label au champ (accessibilité)", () => {
    render(<Input id="prenom" label="Prénom" />);
    expect(screen.getByLabelText("Prénom")).toBeInTheDocument();
  });
});
