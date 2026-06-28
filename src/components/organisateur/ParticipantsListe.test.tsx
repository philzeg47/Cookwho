import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

// La liste rend InvitationActions (client tRPC) — on neutralise le client.
vi.mock("~/trpc/react", () => ({
  api: {
    organisateur: {
      envoyerInvitation: {
        useMutation: () => ({
          mutate: vi.fn(),
          isPending: false,
          isSuccess: false,
          isError: false,
        }),
      },
    },
  },
}));

import { ParticipantsListe } from "./ParticipantsListe";

const baseParticipant = {
  id: "p1",
  repasId: "r1",
  prenom: "Léa",
  email: null,
  accessToken: "tok",
  statut: "EN_ATTENTE" as const,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("ParticipantsListe", () => {
  it("affiche le prénom et le statut « En attente »", () => {
    render(<ParticipantsListe participants={[baseParticipant]} />);
    expect(screen.getByText("Léa")).toBeInTheDocument();
    expect(screen.getByText(/En attente/)).toBeInTheDocument();
  });

  it("affiche un état vide quand il n'y a aucun participant", () => {
    render(<ParticipantsListe participants={[]} />);
    expect(screen.getByText(/Aucun participant/)).toBeInTheDocument();
  });
});
