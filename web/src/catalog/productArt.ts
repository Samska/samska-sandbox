/*
 * Original Bench-style illustrations for the sample Products (prototype: docs/design/samska-store/prototypes/product-art.html).
 * The drawings are static, repository-owned markup, never user input. They use the theme tokens, so they follow light and dark.
 */

export type ProductArtTone = "teal" | "olive" | "rose" | "slate";

export interface ProductArt {
  tone: ProductArtTone;
  label: string;
  markup: string;
}

const productArtByKey: Record<string, ProductArt> = {
  "art-tote": {
    tone: "slate",
    label: "canvas tote bag",
    markup:
      '<ellipse cx="200" cy="352" rx="118" ry="12" fill="var(--color-ink)" opacity=".16"/><path d="M142 150c-6-84 110-84 116 0" fill="none" stroke="var(--color-ink)" stroke-width="13" stroke-linecap="round"/><path d="M100 150h200l16 196H84z" fill="var(--color-surface)" stroke="var(--color-ink)" stroke-width="5" stroke-linejoin="round"/><path d="M100 150h200v26H98z" fill="var(--color-ink)"/><path d="M94 238h212M91 262h218" stroke="var(--color-ink)" stroke-width="5"/><rect x="146" y="282" width="108" height="48" fill="var(--color-brand)" stroke="var(--color-ink)" stroke-width="5"/><path d="M166 306h68" stroke="var(--color-ink)" stroke-width="6" stroke-linecap="round"/>'
  },
  "art-pour-over": {
    tone: "rose",
    label: "pour-over coffee set",
    markup:
      '<ellipse cx="200" cy="354" rx="140" ry="12" fill="var(--color-ink)" opacity=".16"/><path d="M118 270h92l-8 76h-76z" fill="var(--color-surface)" stroke="var(--color-ink)" stroke-width="5" stroke-linejoin="round"/><rect x="127" y="300" width="74" height="12" fill="var(--color-brand)"/><path d="M210 284c36-8 38 42 0 36" fill="none" stroke="var(--color-ink)" stroke-width="9"/><path d="M222 188h122l-26 -22h-70z" fill="var(--color-surface)" stroke="var(--color-ink)" stroke-width="5" stroke-linejoin="round"/><path d="M232 192h104l-28 98h-48z" fill="var(--color-ink)"/><rect x="252" y="290" width="64" height="12" fill="var(--color-ink)"/><rect x="236" y="302" width="96" height="44" fill="var(--color-surface)" stroke="var(--color-ink)" stroke-width="5"/><circle cx="284" cy="244" r="12" fill="var(--color-brand)"/><path d="M96 232c-14-18 14-24 0-44M130 232c-14-18 14-24 0-44" fill="none" stroke="var(--color-ink)" stroke-width="4" stroke-linecap="round"/>'
  },
  "art-workbench": {
    tone: "teal",
    label: "workshop workbench",
    markup:
      '<ellipse cx="200" cy="356" rx="160" ry="12" fill="var(--color-ink)" opacity=".16"/><rect x="44" y="176" width="312" height="34" rx="4" fill="var(--color-brand)" stroke="var(--color-ink)" stroke-width="5"/><rect x="68" y="210" width="24" height="142" fill="var(--color-ink)"/><rect x="308" y="210" width="24" height="142" fill="var(--color-ink)"/><rect x="68" y="276" width="264" height="14" fill="var(--color-ink)"/><rect x="104" y="226" width="92" height="42" fill="var(--color-surface)" stroke="var(--color-ink)" stroke-width="5"/><circle cx="150" cy="247" r="7" fill="var(--color-ink)"/><rect x="292" y="132" width="30" height="44" fill="var(--color-ink)"/><rect x="270" y="150" width="22" height="10" fill="var(--color-ink)"/><path d="M106 176v-52h14v52M130 176v-34h14v34" stroke="var(--color-ink)" stroke-width="5" fill="var(--color-surface)"/><path d="M178 176l56-34 8 14-52 36z" fill="var(--color-surface)" stroke="var(--color-ink)" stroke-width="5" stroke-linejoin="round"/>'
  },
  "art-linen-apron": {
    tone: "olive",
    label: "linen apron",
    markup:
      '<ellipse cx="200" cy="360" rx="108" ry="10" fill="var(--color-ink)" opacity=".16"/><path d="M150 66c0-26 100-26 100 0l-18 80h-64z" fill="none" stroke="var(--color-ink)" stroke-width="8" stroke-linejoin="round"/><path d="M150 112h100l12 62 40 176H98l40-176z" fill="var(--color-surface)" stroke="var(--color-ink)" stroke-width="5" stroke-linejoin="round"/><path d="M122 190h156" stroke="var(--color-ink)" stroke-width="5"/><rect x="134" y="242" width="132" height="66" fill="none" stroke="var(--color-ink)" stroke-width="5"/><path d="M200 242v66" stroke="var(--color-ink)" stroke-width="5"/><path d="M122 190c-34 6-50 28-62 56M278 190c34 6 50 28 62 56" fill="none" stroke="var(--color-ink)" stroke-width="8" stroke-linecap="round"/><rect x="150" y="150" width="100" height="14" fill="var(--color-brand)"/>'
  },
  "art-camp-mug": {
    tone: "teal",
    label: "enamel camp mug",
    markup:
      '<ellipse cx="200" cy="356" rx="104" ry="12" fill="var(--color-ink)" opacity=".16"/><path d="M126 150h148l-10 188c0 12-8 16-18 16h-92c-10 0-18-4-18-16z" fill="var(--color-surface)" stroke="var(--color-ink)" stroke-width="5" stroke-linejoin="round"/><path d="M274 190c58-8 58 90-4 82" fill="none" stroke="var(--color-ink)" stroke-width="14" stroke-linecap="round"/><rect x="120" y="136" width="160" height="22" rx="6" fill="var(--color-ink)"/><rect x="132" y="228" width="136" height="38" fill="var(--color-brand)"/><path d="M170 100c-14-16 14-22 0-40M206 100c-14-16 14-22 0-40M242 100c-14-16 14-22 0-40" fill="none" stroke="var(--color-ink)" stroke-width="5" stroke-linecap="round"/>'
  },
  "art-serving-board": {
    tone: "olive",
    label: "walnut serving board",
    markup:
      '<ellipse cx="200" cy="352" rx="150" ry="10" fill="var(--color-ink)" opacity=".16"/><path d="M60 120h190a22 22 0 0 1 22 22v26h66a18 18 0 0 1 18 18v20a18 18 0 0 1-18 18h-66v26a22 22 0 0 1-22 22H60a22 22 0 0 1-22-22V142a22 22 0 0 1 22-22z" fill="var(--color-ink)" transform="translate(0 12)"/><path d="M60 120h190a22 22 0 0 1 22 22v26h66a18 18 0 0 1 18 18v20a18 18 0 0 1-18 18h-66v26a22 22 0 0 1-22 22H60a22 22 0 0 1-22-22V142a22 22 0 0 1 22-22z" fill="var(--color-surface)" stroke="var(--color-ink)" stroke-width="5" stroke-linejoin="round"/><circle cx="328" cy="206" r="10" fill="var(--color-ink)"/><path d="M62 150h190M62 178h150M62 262h190M62 290h120" stroke="var(--color-ink)" stroke-width="3" opacity=".3" stroke-linecap="round"/><path d="M84 250l58-72 58 72z" fill="var(--color-brand)" stroke="var(--color-ink)" stroke-width="5" stroke-linejoin="round"/><circle cx="122" cy="232" r="5" fill="var(--color-surface)" stroke="var(--color-ink)" stroke-width="3"/><circle cx="226" cy="214" r="17" fill="var(--color-ink)"/><circle cx="212" cy="260" r="13" fill="var(--color-surface)" stroke="var(--color-ink)" stroke-width="5"/><circle cx="212" cy="260" r="5" fill="var(--color-ink)"/>'
  },
};

export function productArt(mediaKey: string | null): ProductArt | undefined {
  return mediaKey === null ? undefined : productArtByKey[mediaKey];
}
