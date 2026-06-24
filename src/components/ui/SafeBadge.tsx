import { type ReactNode } from "react";

export interface SafeBadgeProps {
  children?: ReactNode;
}

export function SafeBadge({ children = "pris en compte" }: SafeBadgeProps) {
  return (
    <span className="bg-safe text-safe-text inline-flex items-center gap-1.5 rounded-pill px-3 py-1 text-sm font-semibold">
      <span aria-hidden="true">✓</span>
      {children}
    </span>
  );
}
