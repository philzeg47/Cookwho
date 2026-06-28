import { type ReactNode } from "react";

type BannerVariant = "info" | "danger";

const config: Record<
  BannerVariant,
  { classes: string; role: "status" | "alert"; defaultIcon: string }
> = {
  info: {
    classes: "bg-primary-soft text-primary-strong",
    role: "status",
    defaultIcon: "ℹ",
  },
  danger: {
    classes: "bg-danger-soft text-danger-strong border border-danger",
    role: "alert",
    defaultIcon: "⚠",
  },
};

export interface BannerProps {
  variant: BannerVariant;
  icon?: ReactNode;
  children: ReactNode;
}

export function Banner({ variant, icon, children }: BannerProps) {
  const c = config[variant];
  return (
    <div
      role={c.role}
      className={`flex items-start gap-2 rounded-md px-4 py-3 text-sm ${c.classes}`}
    >
      <span aria-hidden="true">{icon ?? c.defaultIcon}</span>
      <span>{children}</span>
    </div>
  );
}
