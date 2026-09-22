export const curatedMediaKeys = [
  "canvas-market-tote",
  "stoneware-pour-over-set",
  "workshop-workbench"
] as const;

const mediaSourceByKey: Record<string, string> = {
  "canvas-market-tote": "/media/canvas-market-tote.jpg",
  "stoneware-pour-over-set": "/media/stoneware-pour-over-set.jpg",
  "workshop-workbench": "/media/workshop-workbench.jpg"
};

export function mediaSourceFor(mediaKey: string | null): string | undefined {
  if (mediaKey === null) {
    return undefined;
  }

  return mediaSourceByKey[mediaKey];
}
