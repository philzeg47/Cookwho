import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { QuickSelect } from "./QuickSelect";

describe("QuickSelect", () => {
  it("rend les options et reflète la sélection via aria-pressed", () => {
    render(
      <QuickSelect
        options={["Végétarien", "Vegan"]}
        selection={["Vegan"]}
        onToggle={vi.fn()}
      />,
    );
    expect(
      screen.getByRole("button", { name: /Végétarien/ }),
    ).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByRole("button", { name: /Vegan/ })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("appelle onToggle avec la valeur cliquée", () => {
    const onToggle = vi.fn();
    render(
      <QuickSelect
        options={["Végétarien", "Vegan"]}
        selection={[]}
        onToggle={onToggle}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Végétarien" }));
    expect(onToggle).toHaveBeenCalledWith("Végétarien");
  });

  it("porte l'icône ⚠ + le libellé en variante danger sélectionnée (pas la couleur seule)", () => {
    render(
      <QuickSelect
        options={["Arachides"]}
        selection={["Arachides"]}
        onToggle={vi.fn()}
        variant="danger"
      />,
    );
    const bouton = screen.getByRole("button", { name: /Arachides/ });
    expect(bouton).toHaveTextContent("⚠");
    expect(bouton).toHaveTextContent("Arachides");
  });
});
