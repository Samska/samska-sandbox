import type { ReactNode } from "react";

export interface FormControlProps {
  id: string;
  className: string;
  "aria-invalid": boolean;
  "aria-describedby": string | undefined;
}

export default function FormField({
  id,
  label,
  error,
  children
}: {
  id: string;
  label: string;
  error: string | null;
  children: (control: FormControlProps) => ReactNode;
}) {
  return (
    <div className="grid gap-1.5">
      <label className="text-[0.9375rem] font-bold text-ink" htmlFor={id}>
        {label}
      </label>
      {children({
        id,
        className:
          "min-h-11 w-full rounded-sm border border-border-strong bg-surface px-3 py-2.5",
        "aria-invalid": error !== null,
        "aria-describedby": error !== null ? `${id}-error` : undefined
      })}
      {error !== null ? (
        <p id={`${id}-error`} className="font-bold">
          {error}
        </p>
      ) : null}
    </div>
  );
}
