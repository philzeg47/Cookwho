import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Chip } from "./Chip";

describe("Chip", () => {
  it("variante allergie en danger + libellé", () => {
    render(<Chip variant="allergie">Arachides</Chip>);
    const el = screen.getByText("Arachides");
    expect(el.className).toContain("bg-danger-soft");
  });

  it("variante régime en safe", () => {
    render(<Chip variant="regime">Végétarien</Chip>);
    expect(screen.getByText("Végétarien").className).toContain("bg-safe-soft");
  });

  it("variante non-aimé en accent", () => {
    render(<Chip variant="non-aime">Coriandre</Chip>);
    expect(screen.getByText("Coriandre").className).toContain("bg-accent-soft");
  });
});
