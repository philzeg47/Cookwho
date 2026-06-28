import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { EtapeRegime } from "./EtapeRegime";

describe("EtapeRegime", () => {
  it("permet de (dé)sélectionner un régime (multi-select)", () => {
    const onToggle = vi.fn();
    render(<EtapeRegime regimes={["Vegan"]} onToggle={onToggle} />);

    // Sélection en cours reflétée.
    expect(screen.getByRole("button", { name: /Vegan/ })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    // Cumul possible : cliquer un autre régime.
    fireEvent.click(screen.getByRole("button", { name: "Sans gluten" }));
    expect(onToggle).toHaveBeenCalledWith("Sans gluten");
  });
});
