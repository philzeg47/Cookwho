import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const { retenirMutate, genererData } = vi.hoisted(() => ({
  retenirMutate: vi.fn(),
  genererData: {
    value: undefined as unknown,
  },
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
          isPending: false,
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
  it("affiche la liste et le badge « X plats compatibles » sur un succès plein", () => {
    genererData.value = {
      statut: "GENERE",
      force: false,
      nonCouverts: [],
      genantsParConvive: {},
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
      resolution: { ok: true, mode: "TOUS_CONTENTS", recettes: [recette("u1", "Tajine")] },
    };
    render(<RecettesSection repasId="r1" platRetenuRef="u1" />);
    expect(screen.getByText(/Plat retenu/)).toBeInTheDocument();
  });

  it("en dégradation : message d'explication + ingrédient gênant attribué (5.2)", () => {
    genererData.value = {
      statut: "GENERE",
      force: false,
      nonCouverts: [],
      genantsParConvive: { Champignons: ["Paul"] },
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
