import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const { retirerMutate } = vi.hoisted(() => ({ retirerMutate: vi.fn() }));

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("~/trpc/react", () => ({
  api: {
    organisateur: {
      retirerParticipant: {
        useMutation: () => ({ mutate: retirerMutate, isPending: false, isError: false }),
      },
    },
  },
}));

import { RetirerParticipant } from "./RetirerParticipant";

describe("RetirerParticipant", () => {
  it("demande confirmation avant de retirer (action destructive)", () => {
    retirerMutate.mockClear();
    render(<RetirerParticipant participantId="p1" prenom="Léa" />);

    // 1er clic : pas de suppression, on affiche la confirmation.
    fireEvent.click(screen.getByRole("button", { name: /^retirer$/i }));
    expect(retirerMutate).not.toHaveBeenCalled();
    expect(screen.getByText(/Retirer Léa du repas/)).toBeInTheDocument();

    // Confirmation → la mutation part avec le bon id.
    fireEvent.click(screen.getByRole("button", { name: /oui, retirer/i }));
    expect(retirerMutate).toHaveBeenCalledTimes(1);
    expect(retirerMutate.mock.calls[0]![0]).toEqual({ participantId: "p1" });
  });

  it("« Annuler » referme la confirmation sans retirer", () => {
    retirerMutate.mockClear();
    render(<RetirerParticipant participantId="p1" prenom="Léa" />);
    fireEvent.click(screen.getByRole("button", { name: /^retirer$/i }));
    fireEvent.click(screen.getByRole("button", { name: /annuler/i }));
    expect(retirerMutate).not.toHaveBeenCalled();
    expect(screen.queryByText(/du repas/)).not.toBeInTheDocument();
  });
});
