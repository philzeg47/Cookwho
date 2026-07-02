"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "~/components/ui/Button";
import { api } from "~/trpc/react";

/**
 * Retire un participant (action destructive → confirmation explicite).
 * Réservé organisateur ; la mutation vérifie l'ownership côté serveur.
 */
export function RetirerParticipant({
  participantId,
  prenom,
}: {
  participantId: string;
  prenom: string;
}) {
  const router = useRouter();
  const retirer = api.organisateur.retirerParticipant.useMutation();
  const [confirme, setConfirme] = useState(false);

  if (!confirme) {
    return (
      <Button variant="text" type="button" onClick={() => setConfirme(true)}>
        Retirer
      </Button>
    );
  }

  return (
    <div
      role="group"
      aria-label={`Confirmer le retrait de ${prenom}`}
      className="flex flex-wrap items-center gap-2"
    >
      <span className="text-ink-soft text-sm">Retirer {prenom} du repas ?</span>
      <Button
        variant="secondary"
        type="button"
        disabled={retirer.isPending}
        onClick={() =>
          retirer.mutate(
            { participantId },
            { onSuccess: () => router.refresh() },
          )
        }
      >
        {retirer.isPending ? "Retrait…" : "Oui, retirer"}
      </Button>
      <Button variant="text" type="button" onClick={() => setConfirme(false)}>
        Annuler
      </Button>
      {retirer.isError ? (
        <span className="text-danger-strong text-sm">Échec, réessaie.</span>
      ) : null}
    </div>
  );
}
