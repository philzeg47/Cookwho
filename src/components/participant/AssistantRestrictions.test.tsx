import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// L'assistant est un Client Component qui appelle une mutation tRPC : on
// neutralise le client et on capture l'appel `mutate`.
const mutate = vi.fn();
let onSuccessCapture: (() => void) | undefined;
let onErrorCapture: ((error: { data?: { code?: string } }) => void) | undefined;

vi.mock("~/trpc/react", () => ({
  api: {
    participant: {
      enregistrerRestrictions: {
        useMutation: (opts?: {
          onSuccess?: () => void;
          onError?: (error: { data?: { code?: string } }) => void;
        }) => {
          onSuccessCapture = opts?.onSuccess;
          onErrorCapture = opts?.onError;
          return { mutate, isPending: false, isError: false };
        },
      },
    },
  },
}));

import { AssistantRestrictions, versDonnees } from "./AssistantRestrictions";

describe("versDonnees (mapping restrictions → état)", () => {
  it("regroupe par type et reprend le seuil de la 1ʳᵉ ligne NON_AIME", () => {
    expect(
      versDonnees([
        { type: "REGIME", valeur: "Vegan", seuilTolerance: null },
        { type: "ALLERGIE", valeur: "Arachides", seuilTolerance: null },
        { type: "NON_AIME", valeur: "Olives", seuilTolerance: 4 },
        { type: "NON_AIME", valeur: "Câpres", seuilTolerance: 4 },
      ]),
    ).toEqual({
      regimes: ["Vegan"],
      allergenes: ["Arachides"],
      nonAimes: ["Olives", "Câpres"],
      seuilNonAimes: 4,
    });
  });

  it("retombe sur le seuil par défaut s'il n'y a aucun non-aimé", () => {
    expect(versDonnees([]).seuilNonAimes).toBe(2);
  });
});

type AccesTest = {
  prenom: string;
  statut: "EN_ATTENTE" | "REPONDU";
  repas: { lieu: string; date: Date; heure: string };
  restrictions: {
    type: "REGIME" | "ALLERGIE" | "NON_AIME";
    valeur: string;
    seuilTolerance: number | null;
  }[];
};

const acces: AccesTest = {
  prenom: "Léa",
  statut: "EN_ATTENTE",
  repas: { lieu: "Chez Léa", date: new Date(2026, 6, 1), heure: "12:30" },
  restrictions: [],
};

function renderAssistant(override?: Partial<AccesTest>) {
  return render(
    <AssistantRestrictions token="tok" acces={{ ...acces, ...override }} />,
  );
}

beforeEach(() => {
  mutate.mockReset();
  onSuccessCapture = undefined;
  onErrorCapture = undefined;
});

/** Amène l'assistant jusqu'à l'étape 3 (Valider visible). */
function allerJusquAValider() {
  fireEvent.click(
    screen.getByRole("button", { name: /Déclarer mes restrictions/ }),
  );
  fireEvent.click(screen.getByRole("button", { name: "Suivant" }));
  fireEvent.click(screen.getByRole("button", { name: "Suivant" }));
}

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

  it("affiche le récap + la confirmation après succès, et permet de modifier", () => {
    renderAssistant();
    fireEvent.click(
      screen.getByRole("button", { name: /Déclarer mes restrictions/ }),
    );

    // Étape 1 — un régime.
    fireEvent.click(screen.getByRole("button", { name: /Végétarien/ }));
    fireEvent.click(screen.getByRole("button", { name: "Suivant" }));
    fireEvent.click(screen.getByRole("button", { name: "Suivant" }));
    fireEvent.click(screen.getByRole("button", { name: "Valider" }));

    // Confirmation après enregistrement effectif (onSuccess).
    act(() => onSuccessCapture?.());
    expect(screen.getByText("C'est pris en compte")).toBeInTheDocument();
    expect(screen.getByText("Ce qu'on a retenu")).toBeInTheDocument();
    // Le récap reprend la sélection.
    expect(screen.getByText("Végétarien")).toBeInTheDocument();

    // « Modifier mes réponses » → retour étape 1, sélection conservée.
    fireEvent.click(
      screen.getByRole("button", { name: /Modifier mes réponses/ }),
    );
    expect(screen.getByText("Étape 1 sur 3")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Végétarien/ })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
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

  it("accueille un lien déjà répondu par l'écran de retour (pas le stepper)", () => {
    renderAssistant({
      statut: "REPONDU",
      restrictions: [
        { type: "REGIME", valeur: "Végétarien", seuilTolerance: null },
        { type: "NON_AIME", valeur: "Champignons", seuilTolerance: 4 },
      ],
    });

    expect(screen.getByText(/On a déjà tes préférences/)).toBeInTheDocument();
    expect(screen.getByText("Ce qu'on a retenu")).toBeInTheDocument();
    expect(screen.getByText("Végétarien")).toBeInTheDocument();
    // Pas de parcours « première fois ».
    expect(
      screen.queryByRole("button", { name: /Déclarer mes restrictions/ }),
    ).not.toBeInTheDocument();
  });

  it("pré-remplit l'assistant à la modification depuis l'écran de retour", () => {
    renderAssistant({
      statut: "REPONDU",
      restrictions: [
        { type: "REGIME", valeur: "Végétarien", seuilTolerance: null },
        { type: "ALLERGIE", valeur: "Arachides", seuilTolerance: null },
      ],
    });

    fireEvent.click(
      screen.getByRole("button", { name: /Modifier mes réponses/ }),
    );
    // Étape 1 pré-remplie : le régime précédent est déjà sélectionné.
    expect(screen.getByText("Étape 1 sur 3")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Végétarien/ })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("garde le parcours première fois pour un lien en attente", () => {
    renderAssistant({ statut: "EN_ATTENTE", restrictions: [] });
    expect(
      screen.getByRole("button", { name: /Déclarer mes restrictions/ }),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/On a déjà tes préférences/),
    ).not.toBeInTheDocument();
  });

  it("bascule sur l'état « lien invalide » si la validation échoue en NOT_FOUND (terminal)", () => {
    renderAssistant();
    allerJusquAValider();
    fireEvent.click(screen.getByRole("button", { name: "Valider" }));

    // Repas expiré/purgé en cours de session → erreur terminale.
    act(() => onErrorCapture?.({ data: { code: "NOT_FOUND" } }));

    expect(screen.getByText("Lien non valide")).toBeInTheDocument();
    expect(
      screen.getByText(/recontacte la personne qui organise/i),
    ).toBeInTheDocument();
    // Plus de bouton qui rejouerait l'échec.
    expect(
      screen.queryByRole("button", { name: "Valider" }),
    ).not.toBeInTheDocument();
  });

  it("reste sur le stepper pour une erreur transitoire (pas de data.code)", () => {
    renderAssistant();
    allerJusquAValider();
    fireEvent.click(screen.getByRole("button", { name: "Valider" }));

    // Erreur réseau sans code → on ne bascule PAS en terminal (retry possible).
    act(() => onErrorCapture?.({ data: undefined }));

    expect(screen.getByText("Étape 3 sur 3")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Valider" })).toBeInTheDocument();
    expect(screen.queryByText("Lien non valide")).not.toBeInTheDocument();
  });
});
