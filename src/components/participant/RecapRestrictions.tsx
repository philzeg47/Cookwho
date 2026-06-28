import { Chip } from "~/components/ui/Chip";
import { TOLERANCE_LABELS } from "~/lib/restrictions";

import type { DonneesRestrictions } from "./AssistantRestrictions";

/**
 * Récap des sélections du participant (story 3.3). Présentation pure : pas
 * d'état, pas d'événement, pas d'appel réseau. Ne montre QUE les saisies du
 * participant — jamais de recette ni d'autre participant (NFR5).
 */
export function RecapRestrictions({ donnees }: { donnees: DonneesRestrictions }) {
  const { regimes, allergenes, nonAimes, seuilNonAimes } = donnees;
  const rienSaisi =
    regimes.length === 0 && allergenes.length === 0 && nonAimes.length === 0;

  if (rienSaisi) {
    return (
      <div className="flex flex-col gap-2">
        <h2 className="text-lg font-bold">Ce qu&apos;on a retenu</h2>
        <p className="text-ink-soft">Tu manges de tout, c&apos;est noté !</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-bold">Ce qu&apos;on a retenu</h2>

      {regimes.length > 0 ? (
        <section className="flex flex-col gap-2">
          <h3 className="text-ink-soft text-sm font-semibold">Régimes</h3>
          <ul className="flex flex-wrap gap-2">
            {regimes.map((r) => (
              <li key={r}>
                <Chip variant="regime">{r}</Chip>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {allergenes.length > 0 ? (
        <section className="flex flex-col gap-2">
          <h3 className="text-ink-soft text-sm font-semibold">Allergies</h3>
          <ul className="flex flex-wrap gap-2">
            {allergenes.map((a) => (
              <li key={a}>
                <Chip variant="allergie" icon="⚠">
                  {a}
                </Chip>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {nonAimes.length > 0 ? (
        <section className="flex flex-col gap-2">
          <h3 className="text-ink-soft text-sm font-semibold">
            Aliments non-aimés
          </h3>
          <ul className="flex flex-wrap gap-2">
            {nonAimes.map((n) => (
              <li key={n}>
                <Chip variant="non-aime">{n}</Chip>
              </li>
            ))}
          </ul>
          {/* Rappel du seuil EN CLAIR (libellé), jamais le chiffre. */}
          <p className="text-ink-soft text-sm">
            Tolérance :{" "}
            <span className="text-ink font-semibold">
              {TOLERANCE_LABELS[seuilNonAimes] ?? ""}
            </span>
          </p>
        </section>
      ) : null}
    </div>
  );
}
