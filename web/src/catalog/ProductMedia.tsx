import { useState } from "react";
import { mediaSourceFor } from "./mediaCatalog";

const mediaAccentClassName = [
  "border-media-teal/35 text-media-teal",
  "border-media-olive/35 text-media-olive",
  "border-media-rose/35 text-media-rose",
  "border-media-slate/35 text-media-slate"
] as const;

const mediaVariantClassName = {
  card: "aspect-[16/10] rounded-md",
  detail: "aspect-[4/3] rounded-lg"
} as const;

const monogramVariantClassName = {
  card: "h-14 w-14 text-xl",
  detail: "h-20 w-20 text-3xl"
} as const;

export default function ProductMedia({
  name,
  mediaKey,
  variant
}: {
  name: string;
  mediaKey: string | null;
  variant: "card" | "detail";
}) {
  const [failedMediaKey, setFailedMediaKey] = useState<string | null>(null);
  const source = mediaSourceFor(mediaKey);

  if (source !== undefined && failedMediaKey !== mediaKey) {
    return (
      <div
        className={`relative overflow-hidden border border-border bg-surface-muted ${mediaVariantClassName[variant]}`}
        aria-hidden="true"
      >
        <img
          src={source}
          alt=""
          width={800}
          height={500}
          loading="lazy"
          className="h-full w-full object-cover"
          onError={() => setFailedMediaKey(mediaKey)}
        />
      </div>
    );
  }

  return (
    <div
      className={`grid place-items-center border border-border bg-linear-to-br from-surface to-surface-muted ${mediaVariantClassName[variant]}`}
      aria-hidden="true"
    >
      <span
        className={`grid place-items-center rounded-full border bg-surface/80 font-extrabold tracking-[0.04em] ${monogramVariantClassName[variant]} ${mediaAccentClassName[productMediaTone(name)]}`}
      >
        {productInitial(name)}
      </span>
    </div>
  );
}

function productInitial(name: string): string {
  return name.trim().charAt(0).toUpperCase() || "P";
}

function productMediaTone(name: string): number {
  return [...name].reduce((total, character) => total + character.charCodeAt(0), 0) % 4;
}
