import { useState } from "react";
import type { ProductResponse } from "./catalogApi";
import { productMediaSource } from "./mediaCatalog";
import { productArt, type ProductArtTone } from "./productArt";

const stageClassName = [
  "bg-media-teal",
  "bg-media-olive",
  "bg-media-rose",
  "bg-media-slate"
] as const;

const toneClassName: Record<ProductArtTone, string> = {
  teal: "bg-media-teal",
  olive: "bg-media-olive",
  rose: "bg-media-rose",
  slate: "bg-media-slate"
};

const stageGridStyle = {
  backgroundImage:
    "linear-gradient(to right, color-mix(in srgb, var(--color-ink) 14%, transparent) 1px, transparent 1px), linear-gradient(to bottom, color-mix(in srgb, var(--color-ink) 14%, transparent) 1px, transparent 1px)",
  backgroundSize: "25% 25%"
} as const;

type ProductMediaVariant = "card" | "detail" | "thumbnail" | "square";

const mediaVariantClassName: Record<ProductMediaVariant, string> = {
  card: "aspect-square rounded-sm",
  detail: "aspect-[4/3] rounded-lg",
  thumbnail: "h-12 w-12 shrink-0 rounded-sm",
  square: "aspect-square rounded-md"
};

const monogramVariantClassName: Record<ProductMediaVariant, string> = {
  card: "h-28 w-28 text-6xl",
  detail: "h-32 w-32 text-7xl",
  thumbnail: "h-8 w-8 text-sm",
  square: "h-20 w-20 text-4xl"
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
        className={`relative overflow-hidden border-[1.5px] border-ink bg-surface-muted ${mediaVariantClassName[variant]}`}
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

  const showMarks = variant === "card" || variant === "detail";
  const art = source === undefined ? productArt(product.mediaKey) : undefined;

  if (art !== undefined) {
    return (
      <div
        className={`relative overflow-hidden border-[1.5px] border-ink ${toneClassName[art.tone]} ${mediaVariantClassName[variant]}`}
        style={showMarks ? stageGridStyle : undefined}
        aria-hidden="true"
        data-product-art={product.mediaKey ?? undefined}
      >
        {showMarks ? (
          <span className="absolute left-3 top-3 z-10 rounded-[3px] border-[1.5px] border-ink bg-surface px-1.5 font-mono text-[0.7rem] text-ink">
            No. {catalogNumber(product.id)}
          </span>
        ) : null}
        <svg
          viewBox="0 0 400 400"
          className="absolute inset-0 h-full w-full"
          focusable="false"
          dangerouslySetInnerHTML={{ __html: art.markup }}
        />
      </div>
    );
  }

  return (
    <div
      className={`relative grid place-items-center overflow-hidden border-[1.5px] border-ink ${stageClassName[productMediaTone(product.name)]} ${mediaVariantClassName[variant]}`}
      style={showMarks ? stageGridStyle : undefined}
      aria-hidden="true"
    >
      {showMarks ? (
        <span className="absolute left-3 top-3 rounded-[3px] border-[1.5px] border-ink bg-surface px-1.5 font-mono text-[0.7rem] text-ink">
          No. {catalogNumber(product.id)}
        </span>
      ) : null}
      <span
        className={`grid place-items-center rounded-full border-[1.5px] border-ink bg-surface font-black text-ink [font-stretch:125%] ${monogramVariantClassName[variant]}`}
      >
        {productInitial(product.name)}
      </span>
    </div>
  );
}

function catalogNumber(id: string): string {
  const total = [...id].reduce((sum, character) => (sum * 31 + character.charCodeAt(0)) % 9000, 0);
  return String(1000 + total).padStart(4, "0");
}

function productInitial(name: string): string {
  return name.trim().charAt(0).toUpperCase() || "P";
}

function productMediaTone(name: string): number {
  return [...name].reduce((total, character) => total + character.charCodeAt(0), 0) % 4;
}
