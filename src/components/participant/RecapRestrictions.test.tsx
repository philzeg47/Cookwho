import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { RecapRestrictions } from "./RecapRestrictions";

describe("RecapRestrictions", () => {
  it("récapitule par type et rappelle le seuil en clair", () => {
    render(
      <RecapRestrictions
        donnees={{
          regimes: ["Végétarien"],
          allergenes: ["Arachides"],
          nonAimes: ["Champignons"],
          seuilNonAimes: 3,
        }}
      />,
    );
    expect(screen.getByText("Végétarien")).toBeInTheDocument();
    expect(screen.getByText("Arachides")).toBeInTheDocument();
    expect(screen.getByText("Champignons")).toBeInTheDocument();
    // Seuil affiché en libellé (index 3 → « Plutôt souple »), jamais le chiffre.
    expect(screen.getByText("Plutôt souple")).toBeInTheDocument();
    expect(screen.queryByText("3")).not.toBeInTheDocument();
  });

  it("distingue l'allergène (⚠) de l'aliment non-aimé (sans ⚠)", () => {
    render(
      <RecapRestrictions
        donnees={{
          regimes: [],
          allergenes: ["Arachides"],
          nonAimes: ["Champignons"],
          seuilNonAimes: 2,
        }}
      />,
    );
    const allergie = screen.getByText("Arachides").closest("span");
    const nonAime = screen.getByText("Champignons").closest("span");
    expect(allergie).toHaveTextContent("⚠");
    expect(nonAime).not.toHaveTextContent("⚠");
  });

  it("n'affiche que les sections non vides", () => {
    render(
      <RecapRestrictions
        donnees={{
          regimes: ["Vegan"],
          allergenes: [],
          nonAimes: [],
          seuilNonAimes: 2,
        }}
      />,
    );
    expect(screen.getByText("Régimes")).toBeInTheDocument();
    expect(screen.queryByText("Allergies")).not.toBeInTheDocument();
    expect(screen.queryByText("Aliments non-aimés")).not.toBeInTheDocument();
    // Pas de non-aimé → pas de rappel de tolérance.
    expect(screen.queryByText(/Tolérance/)).not.toBeInTheDocument();
  });

  it("affiche un message rassurant quand rien n'est sélectionné", () => {
    render(
      <RecapRestrictions
        donnees={{ regimes: [], allergenes: [], nonAimes: [], seuilNonAimes: 2 }}
      />,
    );
    expect(screen.getByText(/Tu manges de tout/)).toBeInTheDocument();
  });

  it("liste plusieurs régimes (multi-select)", () => {
    render(
      <RecapRestrictions
        donnees={{
          regimes: ["Vegan", "Sans gluten"],
          allergenes: [],
          nonAimes: [],
          seuilNonAimes: 2,
        }}
      />,
    );
    const sectionRegimes = screen.getByText("Régimes").closest("section")!;
    expect(within(sectionRegimes).getByText("Vegan")).toBeInTheDocument();
    expect(within(sectionRegimes).getByText("Sans gluten")).toBeInTheDocument();
  });
});
