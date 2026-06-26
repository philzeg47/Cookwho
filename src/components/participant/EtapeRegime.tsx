"use client";

import { QuickSelect } from "~/components/ui/QuickSelect";
import { REGIMES_COURANTS } from "~/lib/restrictions";

export function EtapeRegime({
  regimes,
  onToggle,
}: {
  regimes: string[];
  onToggle: (valeur: string) => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-ink-soft">
        Tu suis un régime particulier ? Sélectionne ce qui te concerne — tu peux
        en cumuler plusieurs, ou n&apos;en choisir aucun.
      </p>
      <QuickSelect
        options={REGIMES_COURANTS}
        selection={regimes}
        onToggle={onToggle}
        variant="primary"
      />
    </div>
  );
}
