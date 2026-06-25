import type { inferRouterOutputs } from "@trpc/server";
import Link from "next/link";

import type { AppRouter } from "~/server/api/root";

type RepasItem =
  inferRouterOutputs<AppRouter>["organisateur"]["mesRepas"][number];

// Fuseau figé (Europe/Paris) : l'affichage ne dépend pas du fuseau du serveur RSC.
const formatDate = new Intl.DateTimeFormat("fr-FR", {
  dateStyle: "long",
  timeZone: "Europe/Paris",
});

export function RepasListe({ repas }: { repas: RepasItem[] }) {
  return (
    <ul className="flex flex-col gap-3">
      {repas.map((r) => (
        <li key={r.id}>
          <Link
            href={`/repas/${r.id}`}
            className="border-edge bg-surface focus-visible:ring-primary-strong block rounded-lg border px-4 py-3 transition-colors hover:bg-surface-muted focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            <p className="text-ink font-semibold">{r.lieu}</p>
            <p className="text-ink-soft text-sm">
              {formatDate.format(r.date)} à {r.heure}
            </p>
          </Link>
        </li>
      ))}
    </ul>
  );
}
