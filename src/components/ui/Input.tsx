import { type InputHTMLAttributes } from "react";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  id: string;
  label: string;
}

export function Input({ id, label, className = "", ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-ink text-sm font-semibold">
        {label}
      </label>
      <input
        id={id}
        className={`border-edge bg-surface text-ink focus-visible:ring-primary-strong h-11 rounded-md border px-3 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none ${className}`}
        {...props}
      />
    </div>
  );
}
