"use client";

export interface ToleranceSliderProps {
  valeur: number;
  onChange: (valeur: number) => void;
  labels: readonly string[];
  /** Libellé d'accessibilité de la question (lu avant la valeur courante). */
  ariaLabel?: string;
}

/**
 * Curseur de tolérance unique (global aux aliments non-aimés).
 * EXPERIENCE.md : « valeur lisible en clair, pas de chiffre » → on affiche le
 * libellé courant, jamais l'index. `aria-valuetext` annonce le libellé pour
 * que le lecteur d'écran ne lise pas un nombre nu.
 */
export function ToleranceSlider({
  valeur,
  onChange,
  labels,
  ariaLabel = "Niveau de tolérance",
}: ToleranceSliderProps) {
  const max = labels.length - 1;
  const courant = labels[valeur] ?? "";
  return (
    <div className="flex flex-col gap-2">
      <p className="text-ink font-semibold" aria-hidden="true">
        {courant}
      </p>
      <input
        type="range"
        min={0}
        max={max}
        step={1}
        value={valeur}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label={ariaLabel}
        aria-valuetext={courant}
        className="min-h-11 w-full accent-primary"
      />
      <div className="text-ink-soft flex justify-between text-xs">
        <span>{labels[0]}</span>
        <span>{labels[max]}</span>
      </div>
    </div>
  );
}
