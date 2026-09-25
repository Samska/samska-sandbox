import { useState } from "react";
import type { ProductResponse } from "./catalogApi";
import { productMediaSource } from "./mediaCatalog";

const mediaAccentClassName = [
  "border-media-teal/35 text-media-teal",
  "border-media-olive/35 text-media-olive",
  "border-media-rose/35 text-media-rose",
  "border-media-slate/35 text-media-slate"
] as const;

type ProductMediaVariant = "card" | "detail" | "thumbnail" | "square";

const mediaVariantClassName: Record<ProductMediaVariant, string> = {
  card: "aspect-[16/10] rounded-md",
  detail: "aspect-[4/3] rounded-lg",
  thumbnail: "h-12 w-12 rounded-sm",
  square: "aspect-square rounded-md"
};

const monogramVariantClassName: Record<ProductMediaVariant, string> = {
  card: "h-14 w-14 text-xl",
  detail: "h-20 w-20 text-3xl",
  thumbnail: "h-8 w-8 text-sm",
  square: "h-16 w-16 text-2xl"
};

type ProductMediaProduct = Pick<ProductResponse, "id" | "name" | "mediaKey" | "uploadedMediaId">;

export default function ProductMedia({
  product,
  variant,
  sourceOverride
}: {
  product: ProductMediaProduct;
  variant: ProductMediaVariant;
  sourceOverride?: string | null;
}) {
  const [failedSource, setFailedSource] = useState<string | null>(null);
  const source =
    sourceOverride !== undefined ? (sourceOverride ?? undefined) : productMediaSource(product);

  if (source !== undefined && failedSource !== source) {
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
          onError={() => setFailedSource(source)}
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
        className={`grid place-items-center rounded-full border bg-surface/80 font-extrabold tracking-[0.04em] ${monogramVariantClassName[variant]} ${mediaAccentClassName[productMediaTone(product.name)]}`}
      >
        {productInitial(product.name)}
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
