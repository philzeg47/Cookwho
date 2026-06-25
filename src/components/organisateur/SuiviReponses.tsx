import type { inferRouterOutputs } from "@trpc/server";

import type { AppRouter } from "~/server/api/root";

type Participant =
  inferRouterOutputs<AppRouter>["organisateur"]["repasDetail"]["participants"][number];

export function SuiviReponses({
  participants,
}: {
  participants: Participant[];
}) {
  const total = participants.length;
  if (total === 0) return null;

  const repondu = participants.filter((p) => p.statut === "REPONDU").length;

  if (repondu === 0) {
    return (
      <div className="bg-primary-soft text-primary-strong flex items-start gap-2 rounded-md px-4 py-3 text-sm">
        <span aria-hidden="true">🕊️</span>
        <span>
          Aucune réponse pour l&apos;instant — pas d&apos;inquiétude, ça arrive
          vite.
        </span>
      </div>
    );
  }

  // `floor` (et 100 % seulement si tout le monde a répondu) pour ne jamais
  // afficher 100 % alors qu'il reste un répondant en attente (ex. 199/200).
  const pourcentage =
    repondu === total ? 100 : Math.floor((repondu / total) * 100);

  return (
    <div className="flex flex-col gap-2">
      <p className="text-ink font-semibold">
        {repondu} sur {total} ont répondu
      </p>
      <div
        role="progressbar"
        aria-valuenow={repondu}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-label={`${repondu} sur ${total} participants ont répondu`}
        className="bg-surface-muted h-2 w-full overflow-hidden rounded-pill"
      >
        <div
          className="bg-safe h-full rounded-pill"
          style={{ width: `${pourcentage}%` }}
        />
      </div>
    </div>
  );
}
