import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

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

import { InvitationActions } from "./InvitationActions";

describe("InvitationActions", () => {
  it("affiche le lien et le bouton de copie", () => {
    render(
      <InvitationActions participantId="p1" token="tok-123" hasEmail={false} />,
    );
    expect(screen.getByText("/p/tok-123")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /copier le lien/i }),
    ).toBeInTheDocument();
  });

  it("propose l'envoi par email seulement si le participant a un email", () => {
    const { rerender } = render(
      <InvitationActions participantId="p1" token="tok" hasEmail={false} />,
    );
    expect(
      screen.queryByRole("button", { name: /envoyer l'invitation/i }),
    ).not.toBeInTheDocument();

    rerender(
      <InvitationActions participantId="p1" token="tok" hasEmail={true} />,
    );
    expect(
      screen.getByRole("button", { name: /envoyer l'invitation/i }),
    ).toBeInTheDocument();
  });
});
