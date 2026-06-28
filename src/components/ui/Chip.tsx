import { type ReactNode } from "react";

type ChipVariant = "allergie" | "regime" | "non-aime";

const variantClasses: Record<ChipVariant, string> = {
  allergie: "bg-danger-soft text-danger-strong",
  regime: "bg-safe-soft text-safe-text",
  "non-aime": "bg-accent-soft text-accent-strong",
};

export interface ChipProps {
  variant: ChipVariant;
  icon?: ReactNode;
  children: ReactNode;
}

export function Chip({ variant, icon, children }: ChipProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-pill px-3 py-1 text-sm font-semibold ${variantClasses[variant]}`}
    >
      {icon ? <span aria-hidden="true">{icon}</span> : null}
      {children}
    </span>
  );
}
