import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const { mutate } = vi.hoisted(() => ({ mutate: vi.fn() }));

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("~/trpc/react", () => ({
  api: {
    organisateur: {
      enregistrerMesRestrictions: {
        useMutation: () => ({ mutate, isPending: false, isError: false }),
      },
    },
  },
}));

import { MesRestrictions } from "./MesRestrictions";

describe("MesRestrictions", () => {
  it("affiche le récap + « Modifier » quand l'organisateur a déjà répondu", () => {
    render(
      <MesRestrictions
        repasId="r1"
        aRepondu
        initiales={[{ type: "ALLERGIE", valeur: "Arachides", seuilTolerance: null }]}
      />,
    );
    expect(screen.getByRole("heading", { name: "Mes restrictions" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /modifier mes restrictions/i }),
    ).toBeInTheDocument();
  });

  it("ouvre le formulaire et enregistre (pas encore répondu)", () => {
    mutate.mockClear();
    render(<MesRestrictions repasId="r1" aRepondu={false} initiales={[]} />);
    fireEvent.click(
      screen.getByRole("button", { name: /enregistrer mes restrictions/i }),
    );
    expect(mutate).toHaveBeenCalledTimes(1);
    expect(mutate.mock.calls[0]![0]).toMatchObject({ repasId: "r1" });
  });
});
