import type { inferRouterOutputs } from "@trpc/server";

import { InvitationActions } from "~/components/organisateur/InvitationActions";
import { Chip, type ChipProps } from "~/components/ui/Chip";
import type { AppRouter } from "~/server/api/root";

type Participant =
  inferRouterOutputs<AppRouter>["organisateur"]["repasDetail"]["participants"][number];
type Restriction = Participant["restrictions"][number];

/** Type de restriction → variante de puce + icône + libellé de catégorie. */
const RESTRICTION_UI: Record<
  Restriction["type"],
  { variant: ChipProps["variant"]; icon: string; label: string }
> = {
  ALLERGIE: { variant: "allergie", icon: "⚠", label: "Allergie" },
  REGIME: { variant: "regime", icon: "🌱", label: "Régime" },
  NON_AIME: { variant: "non-aime", icon: "🙁", label: "N'aime pas" },
};

function Restrictions({ restrictions }: { restrictions: Restriction[] }) {
  if (restrictions.length === 0) {
    return <p className="text-ink-soft text-sm">Mange de tout — aucune restriction 🎉</p>;
  }
  return (
    <ul className="flex flex-wrap gap-1.5">
      {restrictions.map((r) => {
        const ui = RESTRICTION_UI[r.type];
        return (
          <li key={r.id}>
            <Chip variant={ui.variant} icon={ui.icon}>
              <span className="sr-only">{ui.label} : </span>
              {r.valeur}
            </Chip>
          </li>
        );
      })}
    </ul>
  );
}

function BadgeStatut({ statut }: { statut: Participant["statut"] }) {
  const aRepondu = statut === "REPONDU";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-pill px-3 py-1 text-sm font-semibold ${
        aRepondu ? "bg-safe-soft text-safe-text" : "bg-surface-muted text-ink-soft"
      }`}
    >
      <span aria-hidden="true">{aRepondu ? "✓" : "⏳"}</span>
      {aRepondu ? "A répondu" : "En attente"}
    </span>
  );
}

export function ParticipantsListe({ participants }: { participants: Participant[] }) {
  if (participants.length === 0) {
    return (
      <p className="text-ink-soft text-sm">
        Aucun participant pour l&apos;instant — ajoute ton premier convive.
      </p>
    );
  }
  return (
    <ul className="flex flex-col gap-2">
      {participants.map((p) => (
        <li
          key={p.id}
          className="border-edge bg-surface flex flex-col gap-3 rounded-md border px-4 py-3"
        >
          <div className="flex items-center justify-between gap-4">
            <span>
              <span className="text-ink font-semibold">{p.prenom}</span>
              {p.email ? (
                <span className="text-ink-soft text-sm"> · {p.email}</span>
              ) : null}
            </span>
            <BadgeStatut statut={p.statut} />
          </div>
          {p.statut === "REPONDU" ? (
            <Restrictions restrictions={p.restrictions} />
          ) : null}
          <InvitationActions
            participantId={p.id}
            token={p.accessToken}
            hasEmail={p.email !== null}
          />
        </li>
      ))}
    </ul>
  );
}
