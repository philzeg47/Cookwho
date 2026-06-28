import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { EtapeNonAimes } from "./EtapeNonAimes";

function setup(nonAimes: string[] = [], seuil = 2) {
  const handlers = {
    onAjouter: vi.fn(),
    onRetirer: vi.fn(),
    onSeuil: vi.fn(),
  };
  render(<EtapeNonAimes nonAimes={nonAimes} seuil={seuil} {...handlers} />);
  return handlers;
}

describe("EtapeNonAimes", () => {
  it("masque le curseur tant qu'il n'y a aucun aliment non-aimé", () => {
    setup([]);
    expect(screen.queryByRole("slider")).not.toBeInTheDocument();
  });

  it("ajoute un aliment non-aimé après trim", () => {
    const h = setup([]);
    fireEvent.change(screen.getByLabelText(/Un aliment non-aimé/), {
      target: { value: "  Champignons " },
    });
    fireEvent.click(screen.getByRole("button", { name: "Ajouter" }));
    expect(h.onAjouter).toHaveBeenCalledWith("Champignons");
  });

  it("affiche le curseur global dès qu'il y a un non-aimé et remonte la valeur", () => {
    const h = setup(["Champignons"], 2);
    const slider = screen.getByRole("slider");
    expect(slider).toBeInTheDocument();
    fireEvent.change(slider, { target: { value: "4" } });
    expect(h.onSeuil).toHaveBeenCalledWith(4);
  });

  it("permet de retirer un aliment non-aimé", () => {
    const h = setup(["Champignons"]);
    fireEvent.click(screen.getByRole("button", { name: /Retirer Champignons/ }));
    expect(h.onRetirer).toHaveBeenCalledWith("Champignons");
  });
});
