import type { ComponentProps } from "react";

type ButtonVariant = "primary" | "secondary" | "danger" | "quiet";
type ButtonSize = "md" | "sm";

const variantClassName: Record<ButtonVariant, string> = {
  primary: "border-ink bg-brand text-on-brand shadow-[0_3px_0_var(--color-ink)] hover:bg-ink hover:text-canvas active:translate-y-[2px] active:shadow-[0_1px_0_var(--color-ink)]",
  secondary:
    "border-ink bg-surface text-ink hover:bg-ink hover:text-canvas",
  danger:
    "border-transparent bg-transparent text-danger hover:border-danger hover:bg-danger hover:text-on-danger",
  quiet:
    "border-transparent bg-transparent text-muted hover:border-transparent hover:bg-surface-muted hover:text-ink"
};

const sizeClassName: Record<ButtonSize, string> = {
  md: "min-h-11 px-4 py-2.5 text-[0.8rem]",
  sm: "min-h-10 px-3 text-[0.75rem]"
};

export default function Button({
  variant = "primary",
  size = "md",
  className = "",
  type = "button",
  ...props
}: ComponentProps<"button"> & { variant?: ButtonVariant; size?: ButtonSize }) {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center rounded-sm border-[1.5px] font-mono font-semibold uppercase tracking-[0.06em] ${sizeClassName[size]} ${variantClassName[variant]} ${className}`}
      {...props}
    />
  );
}
