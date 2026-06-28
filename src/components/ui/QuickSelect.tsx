"use client";

type QuickSelectVariant = "primary" | "danger";

const variantClasses: Record<
  QuickSelectVariant,
  { selected: string; icon: string }
> = {
  // Sélectionné : abricot doux + ✓ (régimes).
  primary: {
    selected: "bg-primary-soft border-primary text-primary-strong",
    icon: "✓",
  },
  // Sélectionné : danger + ⚠ (allergènes) — la couleur n'est jamais seule
  // porteuse de sens (NFR8) : l'icône ⚠ + le libellé accompagnent toujours.
  danger: {
    selected: "bg-danger-soft border-danger text-danger-strong",
    icon: "⚠",
  },
};

export interface QuickSelectProps {
  options: readonly string[];
  selection: string[];
  onToggle: (valeur: string) => void;
  variant?: QuickSelectVariant;
}

export function QuickSelect({
  options,
  selection,
  onToggle,
  variant = "primary",
}: QuickSelectProps) {
  const v = variantClasses[variant];
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const selectionne = selection.includes(option);
        return (
          <button
            key={option}
            type="button"
            aria-pressed={selectionne}
            onClick={() => onToggle(option)}
            className={`inline-flex min-h-11 items-center gap-1.5 rounded-pill border px-4 py-2 text-sm font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-primary-strong focus-visible:ring-offset-2 focus-visible:outline-none ${
              selectionne
                ? v.selected
                : "border-edge text-ink hover:bg-surface-muted"
            }`}
          >
            {selectionne ? <span aria-hidden="true">{v.icon}</span> : null}
            {option}
          </button>
        );
      })}
    </div>
  );
}
