"use client";

import { useState } from "react";

import { Button } from "~/components/ui/Button";
import { Chip } from "~/components/ui/Chip";
import { Input } from "~/components/ui/Input";
import { ToleranceSlider } from "~/components/ui/ToleranceSlider";
import { TOLERANCE_LABELS } from "~/lib/restrictions";

export function EtapeNonAimes({
  nonAimes,
  seuil,
  onAjouter,
  onRetirer,
  onSeuil,
}: {
  nonAimes: string[];
  seuil: number;
  onAjouter: (valeur: string) => void;
  onRetirer: (valeur: string) => void;
  onSeuil: (valeur: number) => void;
}) {
  const [saisie, setSaisie] = useState("");

  function ajouter() {
    const valeur = saisie.trim();
    if (!valeur) return;
    onAjouter(valeur);
    setSaisie("");
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Ton léger : « ceci, bof » — accent, jamais danger. */}
      <p className="text-ink-soft">
        Des aliments que tu préfères éviter, sans que ce soit grave ? Ajoute-les
        ici.
      </p>

      <form
        className="flex items-end gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          ajouter();
        }}
      >
        <div className="flex-1">
          <Input
            id="non-aime-libre"
            label="Un aliment non-aimé ?"
            value={saisie}
            onChange={(e) => setSaisie(e.target.value)}
            placeholder="ex. Champignons"
          />
        </div>
        <Button type="submit" variant="secondary">
          Ajouter
        </Button>
      </form>

      {nonAimes.length > 0 ? (
        <>
          <ul className="flex flex-wrap gap-2">
            {nonAimes.map((a) => (
              <li key={a}>
                <button
                  type="button"
                  onClick={() => onRetirer(a)}
                  aria-label={`Retirer ${a}`}
                  className="rounded-pill focus-visible:ring-2 focus-visible:ring-primary-strong focus-visible:ring-offset-2 focus-visible:outline-none"
                >
                  <Chip variant="non-aime">{a} ✕</Chip>
                </button>
              </li>
            ))}
          </ul>

          {/* Le curseur global ne concerne QUE les aliments non-aimés : il
              n'apparaît que s'il y en a au moins un. */}
          <div className="flex flex-col gap-1">
            <p className="text-ink text-sm font-semibold">
              À quel point tu tiens à les éviter ?
            </p>
            <ToleranceSlider
              valeur={seuil}
              onChange={onSeuil}
              labels={TOLERANCE_LABELS}
              ariaLabel="À quel point tu tiens à éviter tes aliments non-aimés"
            />
          </div>
        </>
      ) : null}
    </div>
  );
}
