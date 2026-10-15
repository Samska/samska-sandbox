interface MonogramProps {
  name: string;
  size?: "card" | "detail";
  labelledBy?: string;
}

/**
 * Visual fallback derived from the product name. Takes the first two
 * non-whitespace characters, uppercased. Either decorative (no label) or
 * announced via aria-labelledby; the two modes are mutually exclusive so
 * assistive tech never sees both aria-hidden and a name on the same node.
 */
export function Monogram({ name, size = "card", labelledBy }: MonogramProps) {
  const initials = deriveInitials(name);
  const className = size === "detail" ? "monogram monogram--detail" : "monogram";
  const labelled = Boolean(labelledBy);
  return (
    <div
      className={className}
      aria-hidden={labelled ? undefined : true}
      aria-labelledby={labelled ? labelledBy : undefined}
      data-testid="monogram"
    >
      {initials}
    </div>
  );
}

function deriveInitials(name: string): string {
  const trimmed = name.trim();
  if (trimmed.length === 0) {
    return "—";
  }
  return trimmed.slice(0, 2).toUpperCase();
}