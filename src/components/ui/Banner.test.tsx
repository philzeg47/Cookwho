import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Banner } from "./Banner";

describe("Banner", () => {
  it("variante danger porte role alert + icône + texte (sens non porté par la seule couleur)", () => {
    render(<Banner variant="danger">Léa a une allergie</Banner>);
    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("Léa a une allergie");
    expect(alert).toHaveTextContent("⚠");
  });

  it("variante info porte role status", () => {
    render(<Banner variant="info">2 invités n&apos;ont pas répondu</Banner>);
    expect(screen.getByRole("status")).toBeInTheDocument();
  });
});
