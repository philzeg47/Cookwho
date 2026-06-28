import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { retenirMutate, genererData, genererState } = vi.hoisted(() => ({
  retenirMutate: vi.fn(),
  genererData: {
    value: undefined as unknown,
  },
  genererState: { isPending: false },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

vi.mock("~/trpc/react", () => ({
  api: {
    organisateur: {
      genererRecettes: {
        useMutation: () => ({
          mutate: vi.fn(),
          isPending: genererState.isPending,
          isError: false,
          data: genererData.value,
        }),
      },
      retenirPlat: {
        useMutation: () => ({ mutate: retenirMutate }),
      },
    },
  },
}));

beforeEach(() => {
  genererState.isPending = false;
  genererData.value = undefined;
});

import { RecettesSection } from "./RecettesSection";

function recette(ref: string, titre: string) {
  return {
    ref,
    titre,
    ingredients: ["tomate", "basilic"],
    ingredientsGenants: [],
    incertain: false,
    raisonsIncertitude: [],
    penalite: 0,
  };
}

describe("RecettesSection", () => {
  it("affiche l'état d'attente habillé pendant la génération (5.4)", () => {
    genererState.isPending = true;
    genererData.value = undefined;
    render(<RecettesSection repasId="r1" />);
    expect(screen.getByRole("status")).toHaveTextContent(/On vérifie chaque assiette/);
  });

  it("masque l'état d'attente une fois la génération résolue (5.4)", () => {
    genererState.isPending = false;
    genererData.value = {
      statut: "GENERE",
      force: false,
      nonCouverts: [],
      genantsParConvive: {},
      prenomsAvecAllergie: [],
      resolution: { ok: true, mode: "TOUS_CONTENTS", recettes: [recette("u1", "Tajine"), recette("u2", "Riz"), recette("u3", "Curry")] },
    };
    render(<RecettesSection repasId="r1" />);
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Tajine" })).toBeInTheDocument();
  });

  it("affiche la liste et le badge « X plats compatibles » sur un succès plein", () => {
    genererData.value = {
      statut: "GENERE",
      force: false,
      nonCouverts: [],
      genantsParConvive: {},
      prenomsAvecAllergie: [],
      resolution: {
        ok: true,
        mode: "TOUS_CONTENTS",
        recettes: [recette("u1", "Tajine"), recette("u2", "Risotto"), recette("u3", "Curry")],
      },
    };
    render(<RecettesSection repasId="r1" />);
    expect(screen.getByText(/3 plats compatibles avec tout le groupe/)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Tajine" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Curry" })).toBeInTheDocument();
  });

  it("« Choisir ce plat » appelle retenirPlat avec ref + titre", () => {
    genererData.value = {
      statut: "GENERE",
      force: false,
      nonCouverts: [],
      genantsParConvive: {},
      prenomsAvecAllergie: [],
      resolution: { ok: true, mode: "TOUS_CONTENTS", recettes: [recette("u1", "Tajine")] },
    };
    retenirMutate.mockClear();
    render(<RecettesSection repasId="r1" />);
    fireEvent.click(screen.getByRole("button", { name: /choisir ce plat/i }));
    expect(retenirMutate).toHaveBeenCalledTimes(1);
    expect(retenirMutate.mock.calls[0]![0]).toEqual({ repasId: "r1", ref: "u1", titre: "Tajine" });
  });

  it("marque le plat déjà retenu (platRetenuRef)", () => {
    genererData.value = {
      statut: "GENERE",
      force: false,
      nonCouverts: [],
      genantsParConvive: {},
      prenomsAvecAllergie: [],
      resolution: { ok: true, mode: "TOUS_CONTENTS", recettes: [recette("u1", "Tajine")] },
    };
    render(<RecettesSection repasId="r1" platRetenuRef="u1" />);
    expect(screen.getByText(/Plat retenu/)).toBeInTheDocument();
  });

  it("avec allergie : « Choisir » N'appelle PAS retenirPlat, l'avertissement nomme le convive, « Valider » retient (5.3)", () => {
    genererData.value = {
      statut: "GENERE",
      force: false,
      nonCouverts: [],
      genantsParConvive: {},
      prenomsAvecAllergie: ["Léa"],
      resolution: { ok: true, mode: "TOUS_CONTENTS", recettes: [recette("u1", "Tajine")] },
    };
    retenirMutate.mockClear();
    render(<RecettesSection repasId="r1" />);
    fireEvent.click(screen.getByRole("button", { name: /choisir ce plat/i }));
    // Human-in-the-loop : pas de persistance sans confirmation.
    expect(retenirMutate).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent(/Léa a déclaré une allergie/);
    fireEvent.click(screen.getByRole("button", { name: /valider ce plat/i }));
    expect(retenirMutate).toHaveBeenCalledTimes(1);
    expect(retenirMutate.mock.calls[0]![0]).toEqual({ repasId: "r1", ref: "u1", titre: "Tajine" });
  });

  it("« Régénérer » referme une confirmation allergie périmée sans retenir (patch revue)", () => {
    genererData.value = {
      statut: "GENERE",
      force: false,
      nonCouverts: [],
      genantsParConvive: {},
      prenomsAvecAllergie: ["Léa"],
      resolution: { ok: true, mode: "TOUS_CONTENTS", recettes: [recette("u1", "Tajine")] },
    };
    retenirMutate.mockClear();
    render(<RecettesSection repasId="r1" />);
    fireEvent.click(screen.getByRole("button", { name: /choisir ce plat/i }));
    expect(screen.getByRole("alert")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /générer|régénérer/i }));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(retenirMutate).not.toHaveBeenCalled();
  });

  it("synchronise le surlignage « retenu » sur la prop platRetenuRef (patch revue)", () => {
    genererData.value = {
      statut: "GENERE",
      force: false,
      nonCouverts: [],
      genantsParConvive: {},
      prenomsAvecAllergie: [],
      resolution: { ok: true, mode: "TOUS_CONTENTS", recettes: [recette("u1", "Tajine")] },
    };
    const { rerender } = render(<RecettesSection repasId="r1" />);
    expect(screen.queryByText(/Plat retenu/)).not.toBeInTheDocument();
    rerender(<RecettesSection repasId="r1" platRetenuRef="u1" />);
    expect(screen.getByText(/Plat retenu/)).toBeInTheDocument();
  });

  it("« Annuler » referme l'avertissement sans retenir (5.3)", () => {
    genererData.value = {
      statut: "GENERE",
      force: false,
      nonCouverts: [],
      genantsParConvive: {},
      prenomsAvecAllergie: ["Léa"],
      resolution: { ok: true, mode: "TOUS_CONTENTS", recettes: [recette("u1", "Tajine")] },
    };
    retenirMutate.mockClear();
    render(<RecettesSection repasId="r1" />);
    fireEvent.click(screen.getByRole("button", { name: /choisir ce plat/i }));
    fireEvent.click(screen.getByRole("button", { name: /annuler/i }));
    expect(retenirMutate).not.toHaveBeenCalled();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("en dégradation : message d'explication + ingrédient gênant attribué (5.2)", () => {
    genererData.value = {
      statut: "GENERE",
      force: false,
      nonCouverts: [],
      genantsParConvive: { Champignons: ["Paul"] },
      prenomsAvecAllergie: [],
      resolution: {
        ok: true,
        mode: "DEGRADATION",
        recettes: [
          {
            ref: "u1",
            titre: "Risotto",
            ingredients: ["riz", "champignons"],
            ingredientsGenants: ["Champignons"],
            incertain: false,
            raisonsIncertitude: [],
            penalite: 4,
          },
        ],
      },
    };
    render(<RecettesSection repasId="r1" />);
    expect(screen.getByText(/voici ceux qui froissent le moins/)).toBeInTheDocument();
    expect(screen.getByText(/Ingrédients qui gênent/)).toBeInTheDocument();
    expect(screen.getByText(/Champignons — gêne Paul/)).toBeInTheDocument();
    expect(
      screen.queryByText(/plats compatibles avec tout le groupe/),
    ).not.toBeInTheDocument();
  });
});
