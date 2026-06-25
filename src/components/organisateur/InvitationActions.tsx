"use client";

import { useState } from "react";

import { Button } from "~/components/ui/Button";
import { api } from "~/trpc/react";

export function InvitationActions({
  participantId,
  token,
  hasEmail,
}: {
  participantId: string;
  token: string;
  hasEmail: boolean;
}) {
  const [copie, setCopie] = useState(false);
  const envoyer = api.organisateur.envoyerInvitation.useMutation();

  const lienAffiche = `/p/${token}`;

  async function copier() {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/p/${token}`);
      setCopie(true);
      setTimeout(() => setCopie(false), 2000);
    } catch {
      // Presse-papiers indisponible (contexte non sécurisé / vieux navigateur) :
      // le lien reste affiché ci-dessus pour une copie manuelle.
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <code className="text-ink-soft bg-surface-muted rounded-md px-2 py-1 text-xs break-all">
        {lienAffiche}
      </code>
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="secondary" type="button" onClick={copier}>
          {copie ? "Copié ✓" : "Copier le lien"}
        </Button>
        {hasEmail ? (
          <Button
            variant="text"
            type="button"
            disabled={envoyer.isPending || envoyer.isSuccess}
            onClick={() => {
              if (envoyer.isPending) return;
              envoyer.mutate({ participantId });
            }}
          >
            {envoyer.isPending
              ? "Envoi…"
              : envoyer.isSuccess
                ? "Invitation envoyée ✓"
                : "Envoyer l'invitation"}
          </Button>
        ) : null}
      </div>
      {envoyer.isError ? (
        <p className="text-danger-strong text-sm">
          ⚠ L&apos;envoi a échoué. Réessaie, ou copie le lien.
        </p>
      ) : null}
    </div>
  );
}
