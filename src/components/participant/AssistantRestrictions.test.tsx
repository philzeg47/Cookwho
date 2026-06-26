import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// L'assistant est un Client Component qui appelle une mutation tRPC : on
// neutralise le client et on capture l'appel `mutate`.
const mutate = vi.fn();
let onSuccessCapture: (() => void) | undefined;

vi.mock("~/trpc/react", () => ({
  api: {
    participant: {
      enregistrerRestrictions: {
        useMutation: (opts?: { onSuccess?: () => void }) => {
          onSuccessCapture = opts?.onSuccess;
          return { mutate, isPending: false, isError: false };
        },
      },
    },
  },
}));

import { AssistantRestrictions } from "./AssistantRestrictions";

const acces = {
  prenom: "Léa",
  repas: { lieu: "Chez Léa", date: new Date(2026, 6, 1), heure: "12:30" },
};

function renderAssistant() {
  return render(<AssistantRestrictions token="tok" acces={acces} />);
}

beforeEach(() => {
  mutate.mockReset();
  onSuccessCapture = undefined;
});

describe("AssistantRestrictions", () => {
  it("accueille par le prénom puis lance le stepper", () => {
    renderAssistant();
    expect(screen.getByText(/Bonjour Léa/)).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: /Déclarer mes restrictions/ }),
    );
    expect(screen.getByText("Étape 1 sur 3")).toBeInTheDocument();
    expect(screen.getByText("Régime alimentaire")).toBeInTheDocument();
  });

  it("navigue en avant et en arrière en conservant l'avancée", () => {
    renderAssistant();
    fireEvent.click(
      screen.getByRole("button", { name: /Déclarer mes restrictions/ }),
    );

    fireEvent.click(screen.getByRole("button", { name: "Suivant" }));
    expect(screen.getByText("Étape 2 sur 3")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Suivant" }));
    expect(screen.getByText("Étape 3 sur 3")).toBeInTheDocument();
    // Dernière étape : Suivant disparaît, Valider apparaît.
    expect(
      screen.queryByRole("button", { name: "Suivant" }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Valider" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Précédent" }));
    expect(screen.getByText("Étape 2 sur 3")).toBeInTheDocument();
  });

  it("masque Précédent à la première étape", () => {
    renderAssistant();
    fireEvent.click(
      screen.getByRole("button", { name: /Déclarer mes restrictions/ }),
    );
    expect(
      screen.queryByRole("button", { name: "Précédent" }),
    ).not.toBeInTheDocument();
  });

  it("valide sans sélection en envoyant un tableau vide, puis confirme", () => {
    renderAssistant();
    fireEvent.click(
      screen.getByRole("button", { name: /Déclarer mes restrictions/ }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Suivant" }));
    fireEvent.click(screen.getByRole("button", { name: "Suivant" }));
    fireEvent.click(screen.getByRole("button", { name: "Valider" }));

    expect(mutate).toHaveBeenCalledWith({ token: "tok", restrictions: [] });

    // Le onSuccess de la mutation bascule sur l'écran de confirmation.
    act(() => onSuccessCapture?.());
    expect(screen.getByText(/Merci Léa/)).toBeInTheDocument();
  });

  it("collecte les 3 étapes et envoie le bon payload (multi-régime + seuil global)", () => {
    renderAssistant();
    fireEvent.click(
      screen.getByRole("button", { name: /Déclarer mes restrictions/ }),
    );

    // Étape 1 — deux régimes cumulés.
    fireEvent.click(screen.getByRole("button", { name: /Végétarien/ }));
    fireEvent.click(screen.getByRole("button", { name: /Sans gluten/ }));
    fireEvent.click(screen.getByRole("button", { name: "Suivant" }));

    // Étape 2 — un allergène standard.
    fireEvent.click(screen.getByRole("button", { name: /Arachides/ }));
    fireEvent.click(screen.getByRole("button", { name: "Suivant" }));

    // Étape 3 — un aliment non-aimé + curseur global.
    fireEvent.change(screen.getByLabelText(/Un aliment non-aimé/), {
      target: { value: "Champignons" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Ajouter" }));
    fireEvent.change(screen.getByRole("slider"), { target: { value: "4" } });

    fireEvent.click(screen.getByRole("button", { name: "Valider" }));

    expect(mutate).toHaveBeenCalledWith({
      token: "tok",
      restrictions: [
        { type: "REGIME", valeur: "Végétarien" },
        { type: "REGIME", valeur: "Sans gluten" },
        { type: "ALLERGIE", valeur: "Arachides" },
        { type: "NON_AIME", valeur: "Champignons", seuilTolerance: 4 },
      ],
    });
  });
});
