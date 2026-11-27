import { useState } from "react";
import type { ProductResponse } from "./catalogApi";
import { productMediaSource } from "./mediaCatalog";

const mediaTileClassName = [
  "bg-media-teal",
  "bg-media-olive",
  "bg-media-rose",
  "bg-media-slate"
] as const;

type ProductMediaVariant = "card" | "detail" | "thumbnail" | "square";

const mediaVariantClassName: Record<ProductMediaVariant, string> = {
  card: "aspect-square rounded-lg",
  detail: "aspect-square w-full max-w-md rounded-lg",
  thumbnail: "h-12 w-12 rounded-sm",
  square: "aspect-square rounded-md"
};

const monogramVariantClassName: Record<ProductMediaVariant, string> = {
  card: "h-24 w-24 text-4xl",
  detail: "h-28 w-28 text-5xl",
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
        className={`relative overflow-hidden bg-surface-muted ${mediaVariantClassName[variant]}`}
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
      className={`grid place-items-center ${mediaTileClassName[productMediaTone(product.name)]} ${mediaVariantClassName[variant]}`}
      aria-hidden="true"
    >
      <span
        className={`grid place-items-center rounded-full bg-media-ink font-display font-extrabold tracking-[0.04em] text-white ${monogramVariantClassName[variant]}`}
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
  return (name.trim().charCodeAt(0) || 0) % 4;
}
