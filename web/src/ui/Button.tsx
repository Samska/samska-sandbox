import type { ComponentProps } from "react";

type ButtonVariant = "primary" | "secondary" | "danger" | "quiet";
type ButtonSize = "md" | "sm";

const variantClassName: Record<ButtonVariant, string> = {
  primary: "border-brand bg-brand text-white hover:border-brand-dark hover:bg-brand-dark",
  secondary:
    "border-border-strong bg-surface text-brand-dark hover:border-brand hover:bg-brand hover:text-white",
  danger:
    "border-transparent bg-transparent text-danger hover:border-danger hover:bg-danger hover:text-white",
  quiet:
    "border-transparent bg-transparent text-muted hover:border-transparent hover:bg-surface-muted hover:text-ink"
};

const sizeClassName: Record<ButtonSize, string> = {
  md: "min-h-11 px-4 py-2.5",
  sm: "min-h-10 px-3 text-sm"
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
      className={`inline-flex items-center justify-center rounded-sm border font-bold ${sizeClassName[size]} ${variantClassName[variant]} ${className}`}
      {...props}
    />
  );
}
