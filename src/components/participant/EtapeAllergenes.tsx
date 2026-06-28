"use client";

import { useState } from "react";

import { Banner } from "~/components/ui/Banner";
import { Button } from "~/components/ui/Button";
import { Chip } from "~/components/ui/Chip";
import { Input } from "~/components/ui/Input";
import { QuickSelect } from "~/components/ui/QuickSelect";
import { ALLERGENES_UE } from "~/lib/restrictions";

export function EtapeAllergenes({
  allergenes,
  onToggle,
  onAjouter,
  onRetirer,
}: {
  allergenes: string[];
  onToggle: (valeur: string) => void;
  onAjouter: (valeur: string) => void;
  onRetirer: (valeur: string) => void;
}) {
  const [saisie, setSaisie] = useState("");

  // Allergènes saisis librement (hors des 14 standards) → affichés en chips
  // supprimables, car la quick-select ne les liste pas.
  const allergenesLibres = allergenes.filter(
    (a) => !ALLERGENES_UE.includes(a as (typeof ALLERGENES_UE)[number]),
  );

  function ajouter() {
    const valeur = saisie.trim();
    if (!valeur) return;
    onAjouter(valeur);
    setSaisie("");
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Ton posé/sérieux : la gravité allergène n'est jamais banalisée. */}
      <Banner variant="danger">
        Tes allergies : on ne plaisante pas avec ça. Sélectionne tout ce qui te
        concerne.
      </Banner>

      <QuickSelect
        options={ALLERGENES_UE}
        selection={allergenes}
        onToggle={onToggle}
        variant="danger"
      />

      <form
        className="flex items-end gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          ajouter();
        }}
      >
        <div className="flex-1">
          <Input
            id="allergene-libre"
            label="Un autre allergène ?"
            value={saisie}
            onChange={(e) => setSaisie(e.target.value)}
            placeholder="ex. Sarrasin"
          />
        </div>
        <Button type="submit" variant="secondary">
          Ajouter
        </Button>
      </form>

      {allergenesLibres.length > 0 ? (
        <ul className="flex flex-wrap gap-2">
          {allergenesLibres.map((a) => (
            <li key={a}>
              <button
                type="button"
                onClick={() => onRetirer(a)}
                aria-label={`Retirer ${a}`}
                className="rounded-pill focus-visible:ring-2 focus-visible:ring-primary-strong focus-visible:ring-offset-2 focus-visible:outline-none"
              >
                <Chip variant="allergie" icon="⚠">
                  {a} ✕
                </Chip>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
