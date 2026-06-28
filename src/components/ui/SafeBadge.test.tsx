import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SafeBadge } from "./SafeBadge";

describe("SafeBadge", () => {
  it("affiche ✓ et le libellé par défaut", () => {
    render(<SafeBadge />);
    expect(screen.getByText(/pris en compte/)).toBeInTheDocument();
  });

  it("accepte un libellé personnalisé", () => {
    render(<SafeBadge>compatible avec tout le groupe</SafeBadge>);
    expect(
      screen.getByText(/compatible avec tout le groupe/),
    ).toBeInTheDocument();
  });
});
