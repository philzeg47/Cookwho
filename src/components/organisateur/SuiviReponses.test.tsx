import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SuiviReponses } from "./SuiviReponses";

type Statut = "EN_ATTENTE" | "REPONDU";

function participant(id: string, statut: Statut) {
  return {
    id,
    repasId: "r1",
    prenom: `P-${id}`,
    email: null,
    accessToken: `tok-${id}`,
    statut,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

describe("SuiviReponses", () => {
  it("n'affiche rien sans participant", () => {
    const { container } = render(<SuiviReponses participants={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("affiche un message rassurant quand personne n'a répondu", () => {
    render(
      <SuiviReponses
        participants={[
          participant("1", "EN_ATTENTE"),
          participant("2", "EN_ATTENTE"),
        ]}
      />,
    );
    expect(screen.getByText(/Aucune réponse pour l'instant/)).toBeInTheDocument();
  });

  it("affiche la synthèse « X sur Y » dès qu'il y a des réponses", () => {
    render(
      <SuiviReponses
        participants={[
          participant("1", "REPONDU"),
          participant("2", "EN_ATTENTE"),
          participant("3", "EN_ATTENTE"),
        ]}
      />,
    );
    expect(screen.getByText(/1 sur 3 ont répondu/)).toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toHaveAttribute(
      "aria-valuenow",
      "1",
    );
  });
});
