import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ToleranceSlider } from "./ToleranceSlider";

const labels = ["Strict", "Plutôt strict", "Équilibré", "Plutôt souple", "Souple"];

describe("ToleranceSlider", () => {
  it("affiche le libellé courant en clair (pas de chiffre)", () => {
    render(<ToleranceSlider valeur={2} onChange={vi.fn()} labels={labels} />);
    expect(screen.getByText("Équilibré")).toBeInTheDocument();
    // Le slider annonce le libellé, pas l'index, au lecteur d'écran.
    expect(screen.getByRole("slider")).toHaveAttribute(
      "aria-valuetext",
      "Équilibré",
    );
  });

  it("appelle onChange avec la nouvelle valeur numérique", () => {
    const onChange = vi.fn();
    render(<ToleranceSlider valeur={2} onChange={onChange} labels={labels} />);
    fireEvent.change(screen.getByRole("slider"), { target: { value: "4" } });
    expect(onChange).toHaveBeenCalledWith(4);
  });

  it("étiquette les extrémités du curseur", () => {
    // valeur médiane → les extrémités « Strict »/« Souple » sont uniques
    // (pas de collision avec le libellé courant « Équilibré »).
    render(<ToleranceSlider valeur={2} onChange={vi.fn()} labels={labels} />);
    expect(screen.getByText("Strict")).toBeInTheDocument();
    expect(screen.getByText("Souple")).toBeInTheDocument();
  });
});
