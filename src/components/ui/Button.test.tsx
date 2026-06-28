import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Button } from "./Button";

describe("Button", () => {
  it("rend le libellé et la variante primaire par défaut (texte foncé sur abricot)", () => {
    render(<Button>Valider</Button>);
    const btn = screen.getByRole("button", { name: "Valider" });
    expect(btn).toBeInTheDocument();
    expect(btn.className).toContain("bg-primary");
    expect(btn.className).toContain("text-on-primary");
  });

  it("applique la variante secondaire", () => {
    render(<Button variant="secondary">Annuler</Button>);
    expect(screen.getByRole("button", { name: "Annuler" }).className).toContain(
      "border-edge",
    );
  });
});
