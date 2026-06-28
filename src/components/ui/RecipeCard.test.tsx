import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { RecipeCard } from "./RecipeCard";

describe("RecipeCard", () => {
  it("affiche le titre et révèle les ingrédients à la demande", () => {
    render(<RecipeCard titre="Tajine de légumes" ingredients={["carotte", "pois chiches"]} />);
    expect(screen.getByRole("heading", { name: "Tajine de légumes" })).toBeInTheDocument();
    // Les ingrédients sont dans un disclosure (présents dans le DOM, révélables).
    expect(screen.getByText("carotte")).toBeInTheDocument();
    expect(screen.getByText(/Voir les ingrédients \(2\)/)).toBeInTheDocument();
  });

  it("appelle onChoisir au clic sur « Choisir ce plat »", () => {
    const onChoisir = vi.fn();
    render(<RecipeCard titre="Plat" ingredients={["riz"]} onChoisir={onChoisir} />);
    fireEvent.click(screen.getByRole("button", { name: /choisir ce plat/i }));
    expect(onChoisir).toHaveBeenCalledTimes(1);
  });

  it("affiche l'état « Plat retenu » et masque le bouton quand sélectionné", () => {
    render(<RecipeCard titre="Plat" ingredients={["riz"]} selectionne onChoisir={vi.fn()} />);
    expect(screen.getByText(/Plat retenu/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /choisir ce plat/i })).not.toBeInTheDocument();
  });

  it("signale les ingrédients gênants avec qui ils gênent (icône + texte, 5.2)", () => {
    render(
      <RecipeCard
        titre="Risotto"
        ingredients={["riz", "champignons"]}
        genants={[{ valeur: "Champignons", genePar: ["Paul", "Max"] }]}
      />,
    );
    expect(screen.getByText(/Ingrédients qui gênent/)).toBeInTheDocument();
    expect(screen.getByText(/Champignons — gêne Paul, Max/)).toBeInTheDocument();
  });

  it("n'affiche aucun bloc gênants sans `genants`", () => {
    render(<RecipeCard titre="Plat" ingredients={["riz"]} />);
    expect(screen.queryByText(/Ingrédients qui gênent/)).not.toBeInTheDocument();
  });
});
