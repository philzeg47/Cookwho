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

type Restriction = {
  id: string;
  participantId: string;
  type: "REGIME" | "ALLERGIE" | "NON_AIME";
  valeur: string;
  seuilTolerance: number | null;
  createdAt: Date;
};

const baseParticipant = {
  id: "p1",
  repasId: "r1",
  prenom: "Léa",
  email: null,
  accessToken: "tok",
  statut: "EN_ATTENTE" as const,
  createdAt: new Date(),
  updatedAt: new Date(),
  restrictions: [] as Restriction[],
};

function restriction(over: Partial<Restriction>): Restriction {
  return {
    id: "x",
    participantId: "p1",
    type: "ALLERGIE",
    valeur: "Arachides",
    seuilTolerance: null,
    createdAt: new Date(),
    ...over,
  };
}

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

  it("affiche les restrictions d'un participant ayant répondu", () => {
    render(
      <ParticipantsListe
        participants={[
          {
            ...baseParticipant,
            statut: "REPONDU",
            restrictions: [
              restriction({ id: "1", type: "ALLERGIE", valeur: "Arachides" }),
              restriction({ id: "2", type: "REGIME", valeur: "Végétarien" }),
              restriction({ id: "3", type: "NON_AIME", valeur: "Coriandre", seuilTolerance: 1 }),
            ],
          },
        ]}
      />,
    );
    expect(screen.getByText("Arachides")).toBeInTheDocument();
    expect(screen.getByText("Végétarien")).toBeInTheDocument();
    expect(screen.getByText("Coriandre")).toBeInTheDocument();
    // Libellé de catégorie accessible (lecteur d'écran).
    expect(screen.getByText(/Allergie :/)).toBeInTheDocument();
  });

  it("indique « aucune restriction » pour un répondant sans contrainte", () => {
    render(
      <ParticipantsListe
        participants={[{ ...baseParticipant, statut: "REPONDU", restrictions: [] }]}
      />,
    );
    expect(screen.getByText(/aucune restriction/)).toBeInTheDocument();
  });
});
