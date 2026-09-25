import type { ProductResponse } from "./catalogApi";

const mediaSourceByKey: Record<string, string> = {
  "canvas-market-tote": "/media/canvas-market-tote.jpg",
  "stoneware-pour-over-set": "/media/stoneware-pour-over-set.jpg",
  "workshop-workbench": "/media/workshop-workbench.jpg"
};

export function curatedMediaSource(mediaKey: string | null): string | undefined {
  if (mediaKey === null) {
    return undefined;
  }

  return mediaSourceByKey[mediaKey];
}

export function productMediaSource(
  product: Pick<ProductResponse, "id" | "mediaKey" | "uploadedMediaId">
): string | undefined {
  if (product.uploadedMediaId !== null) {
    return `/api/products/${encodeURIComponent(product.id)}/media/${encodeURIComponent(
      product.uploadedMediaId
    )}`;
  }

  return curatedMediaSource(product.mediaKey);
}
