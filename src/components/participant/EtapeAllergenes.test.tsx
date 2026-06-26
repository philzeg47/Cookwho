import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { EtapeAllergenes } from "./EtapeAllergenes";

function setup(allergenes: string[] = []) {
  const handlers = {
    onToggle: vi.fn(),
    onAjouter: vi.fn(),
    onRetirer: vi.fn(),
  };
  render(<EtapeAllergenes allergenes={allergenes} {...handlers} />);
  return handlers;
}

describe("EtapeAllergenes", () => {
  it("porte un ton posé + icône ⚠ (gravité jamais banalisée)", () => {
    setup();
    expect(screen.getByRole("alert")).toHaveTextContent(
      /on ne plaisante pas/i,
    );
  });

  it("bascule un allergène standard parmi les 14 UE", () => {
    const h = setup();
    fireEvent.click(screen.getByRole("button", { name: /Arachides/ }));
    expect(h.onToggle).toHaveBeenCalledWith("Arachides");
  });

  it("ajoute un allergène libre après trim, et vide la saisie", () => {
    const h = setup();
    const champ = screen.getByLabelText(/Un autre allergène/);
    fireEvent.change(champ, { target: { value: "  Sarrasin  " } });
    fireEvent.click(screen.getByRole("button", { name: "Ajouter" }));
    expect(h.onAjouter).toHaveBeenCalledWith("Sarrasin");
  });

  it("n'ajoute rien pour une saisie vide", () => {
    const h = setup();
    fireEvent.click(screen.getByRole("button", { name: "Ajouter" }));
    expect(h.onAjouter).not.toHaveBeenCalled();
  });

  it("affiche un allergène libre comme chip supprimable", () => {
    const h = setup(["Sarrasin"]);
    const retirer = screen.getByRole("button", { name: /Retirer Sarrasin/ });
    fireEvent.click(retirer);
    expect(h.onRetirer).toHaveBeenCalledWith("Sarrasin");
  });
});
