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
  "art-arc-lamp": {
    tone: "olive",
    label: "arc table lamp",
    markup:
      '<ellipse cx="200" cy="352" rx="110" ry="10" fill="var(--color-ink)" opacity=".16"/><rect x="104" y="328" width="132" height="20" rx="6" fill="var(--color-ink)"/><path d="M170 328C170 200 200 140 290 120" fill="none" stroke="var(--color-ink)" stroke-width="12" stroke-linecap="round"/><path d="M262 86l86 42-30 56z" fill="var(--color-surface)" stroke="var(--color-ink)" stroke-width="5" stroke-linejoin="round"/><circle cx="316" cy="196" r="12" fill="var(--color-brand)"/><path d="M296 214l-8 36M320 218l4 38M342 208l20 30" stroke="var(--color-brand)" stroke-width="5" stroke-linecap="round"/>'
  },
  "art-terra-vessel": {
    tone: "teal",
    label: "terra vessel with stems",
    markup:
      '<ellipse cx="200" cy="354" rx="112" ry="10" fill="var(--color-ink)" opacity=".16"/><path d="M200 112C196 60 170 44 150 40M200 112c4-52 30-72 56-72M200 112c-6-30 8-54 26-64" fill="none" stroke="var(--color-ink)" stroke-width="5" stroke-linecap="round"/><circle cx="150" cy="40" r="9" fill="var(--color-brand)"/><circle cx="256" cy="40" r="9" fill="var(--color-brand)"/><circle cx="226" cy="48" r="9" fill="var(--color-brand)"/><path d="M160 112h80v30c62 28 82 98 54 160-18 38-56 50-94 50s-76-12-94-50c-28-62-8-132 54-160z" fill="var(--color-surface)" stroke="var(--color-ink)" stroke-width="5" stroke-linejoin="round"/><rect x="152" y="104" width="96" height="16" rx="6" fill="var(--color-ink)"/><path d="M110 250c60 20 120 20 180 0" fill="none" stroke="var(--color-brand)" stroke-width="16"/><circle cx="160" cy="300" r="7" fill="var(--color-ink)"/><circle cx="196" cy="316" r="7" fill="var(--color-ink)"/><circle cx="234" cy="300" r="7" fill="var(--color-ink)"/>'
  },
  "art-linen-throw": {
    tone: "rose",
    label: "folded linen throw",
    markup:
      '<ellipse cx="200" cy="352" rx="150" ry="10" fill="var(--color-ink)" opacity=".16"/><rect x="70" y="268" width="260" height="68" rx="6" fill="var(--color-surface)" stroke="var(--color-ink)" stroke-width="5"/><path d="M70 292h260M70 314h260" stroke="var(--color-ink)" stroke-width="4"/><rect x="84" y="200" width="244" height="68" rx="6" fill="var(--color-brand)" stroke="var(--color-ink)" stroke-width="5"/><rect x="70" y="132" width="260" height="68" rx="6" fill="var(--color-surface)" stroke="var(--color-ink)" stroke-width="5"/><path d="M70 156h260M70 178h260" stroke="var(--color-ink)" stroke-width="4"/><path d="M330 140v52M338 140v52M346 140v52M330 276v52M338 276v52M346 276v52" stroke="var(--color-ink)" stroke-width="4" stroke-linecap="round"/>'
  },
  "art-desk-clock": {
    tone: "olive",
    label: "desk clock",
    markup:
      '<ellipse cx="200" cy="356" rx="100" ry="10" fill="var(--color-ink)" opacity=".16"/><path d="M140 284l-26 66M260 284l26 66" stroke="var(--color-ink)" stroke-width="10" stroke-linecap="round"/><circle cx="200" cy="188" r="108" fill="var(--color-surface)" stroke="var(--color-ink)" stroke-width="6"/><circle cx="200" cy="188" r="90" fill="none" stroke="var(--color-ink)" stroke-width="2" opacity=".4"/><path d="M200 98v18M200 260v18M110 188h18M272 188h18" stroke="var(--color-ink)" stroke-width="6" stroke-linecap="round"/><path d="M200 188v-62" stroke="var(--color-ink)" stroke-width="8" stroke-linecap="round"/><path d="M200 188l48 28" stroke="var(--color-brand)" stroke-width="8" stroke-linecap="round"/><circle cx="200" cy="188" r="10" fill="var(--color-ink)"/>'
  },
  "art-hand-plane": {
    tone: "teal",
    label: "beech hand plane",
    markup:
      '<ellipse cx="200" cy="352" rx="160" ry="10" fill="var(--color-ink)" opacity=".16"/><rect x="44" y="290" width="312" height="40" rx="6" fill="var(--color-ink)"/><path d="M60 290v-76h280v76z" fill="var(--color-surface)" stroke="var(--color-ink)" stroke-width="5" stroke-linejoin="round"/><circle cx="324" cy="190" r="24" fill="var(--color-brand)" stroke="var(--color-ink)" stroke-width="5"/><path d="M82 214c0-58 76-58 76 0" fill="none" stroke="var(--color-ink)" stroke-width="14" stroke-linecap="round"/><path d="M190 214l44-72 24 14-36 58z" fill="var(--color-ink)"/><rect x="180" y="248" width="58" height="12" fill="var(--color-brand)"/><path d="M250 336c26-30 56 2 28 22" fill="none" stroke="var(--color-ink)" stroke-width="4" stroke-linecap="round"/>'
  },
  "art-tape-measure": {
    tone: "slate",
    label: "steel tape measure",
    markup:
      '<ellipse cx="200" cy="354" rx="150" ry="10" fill="var(--color-ink)" opacity=".16"/><rect x="196" y="286" width="160" height="32" fill="var(--color-surface)" stroke="var(--color-ink)" stroke-width="5"/><path d="M222 286v14M248 286v14M274 286v14M300 286v14M326 286v14" stroke="var(--color-ink)" stroke-width="3"/><rect x="340" y="280" width="22" height="44" fill="var(--color-ink)"/><circle cx="170" cy="190" r="108" fill="var(--color-brand)" stroke="var(--color-ink)" stroke-width="6"/><circle cx="170" cy="190" r="58" fill="var(--color-surface)" stroke="var(--color-ink)" stroke-width="5"/><circle cx="170" cy="190" r="12" fill="var(--color-ink)"/><path d="M110 112l22 22" stroke="var(--color-ink)" stroke-width="6" stroke-linecap="round"/>'
  },
  "art-journal": {
    tone: "rose",
    label: "bound journal",
    markup:
      '<ellipse cx="200" cy="356" rx="110" ry="10" fill="var(--color-ink)" opacity=".16"/><rect x="124" y="88" width="184" height="264" rx="10" fill="var(--color-surface)" stroke="var(--color-ink)" stroke-width="5"/><rect x="104" y="72" width="184" height="264" rx="10" fill="var(--color-ink)"/><rect x="248" y="72" width="22" height="264" fill="var(--color-brand)"/><rect x="130" y="126" width="94" height="60" fill="var(--color-surface)"/><path d="M144 148h66M144 166h42" stroke="var(--color-ink)" stroke-width="5" stroke-linecap="round"/><path d="M126 72v264" stroke="var(--color-surface)" stroke-width="3" opacity=".5"/>'
  },
  "art-rucksack": {
    tone: "slate",
    label: "canvas rucksack",
    markup:
      '<ellipse cx="200" cy="356" rx="118" ry="10" fill="var(--color-ink)" opacity=".16"/><path d="M168 110c0-36 64-36 64 0" fill="none" stroke="var(--color-ink)" stroke-width="10" stroke-linecap="round"/><path d="M108 200c-26 20-26 100 0 120M292 200c26 20 26 100 0 120" fill="none" stroke="var(--color-ink)" stroke-width="9" stroke-linecap="round"/><rect x="108" y="108" width="184" height="240" rx="40" fill="var(--color-surface)" stroke="var(--color-ink)" stroke-width="5"/><path d="M108 150c0-46 184-46 184 0v54H108z" fill="var(--color-ink)"/><rect x="184" y="182" width="32" height="46" rx="4" fill="var(--color-brand)" stroke="var(--color-ink)" stroke-width="5"/><rect x="138" y="250" width="124" height="70" rx="14" fill="none" stroke="var(--color-ink)" stroke-width="5"/><path d="M138 272h124" stroke="var(--color-ink)" stroke-width="4"/>'
  },
  "art-planter": {
    tone: "olive",
    label: "clay planter with a seedling",
    markup:
      '<ellipse cx="200" cy="354" rx="100" ry="10" fill="var(--color-ink)" opacity=".16"/><path d="M200 218V112" stroke="var(--color-ink)" stroke-width="5" stroke-linecap="round"/><path d="M200 190c-42-10-72-52-60-88 42 8 62 46 60 88z" fill="var(--color-surface)" stroke="var(--color-ink)" stroke-width="5" stroke-linejoin="round"/><path d="M200 168c38-8 66-40 58-74-38 4-58 36-58 74z" fill="var(--color-brand)" stroke="var(--color-ink)" stroke-width="5" stroke-linejoin="round"/><path d="M128 244h144l-18 106H146z" fill="var(--color-brand)" stroke="var(--color-ink)" stroke-width="5" stroke-linejoin="round"/><rect x="116" y="216" width="168" height="32" rx="6" fill="var(--color-surface)" stroke="var(--color-ink)" stroke-width="5"/><path d="M150 284h100" stroke="var(--color-ink)" stroke-width="4" opacity=".5"/>'
  },
  "art-wall-shelf": {
    tone: "teal",
    label: "oak wall shelf",
    markup:
      '<ellipse cx="200" cy="352" rx="150" ry="8" fill="var(--color-ink)" opacity=".16"/><path d="M96 276v60l62-60zM304 276v60l-62-60z" fill="var(--color-surface)" stroke="var(--color-ink)" stroke-width="5" stroke-linejoin="round"/><rect x="56" y="250" width="288" height="28" rx="4" fill="var(--color-ink)"/><rect x="80" y="196" width="84" height="28" fill="var(--color-brand)" stroke="var(--color-ink)" stroke-width="5"/><rect x="88" y="168" width="68" height="28" fill="var(--color-surface)" stroke="var(--color-ink)" stroke-width="5"/><rect x="96" y="140" width="52" height="28" fill="var(--color-ink)"/><path d="M244 250l8-46h50l8 46z" fill="var(--color-surface)" stroke="var(--color-ink)" stroke-width="5" stroke-linejoin="round"/><path d="M277 204c-20-30-10-52 0-64 10 12 20 34 0 64z" fill="var(--color-brand)" stroke="var(--color-ink)" stroke-width="4" stroke-linejoin="round"/>'
  },
  "art-kettle": {
    tone: "rose",
    label: "enamel kettle",
    markup:
      '<ellipse cx="200" cy="352" rx="130" ry="10" fill="var(--color-ink)" opacity=".16"/><path d="M150 168c-34-64 8-100 50-100s84 36 50 100" fill="none" stroke="var(--color-ink)" stroke-width="10" stroke-linecap="round"/><path d="M286 268l56-72 14 10-52 82z" fill="var(--color-surface)" stroke="var(--color-ink)" stroke-width="5" stroke-linejoin="round"/><path d="M108 340c-14-92 12-176 92-176s106 84 92 176z" fill="var(--color-surface)" stroke="var(--color-ink)" stroke-width="5" stroke-linejoin="round"/><path d="M111 296h178l4 -26h-186z" fill="var(--color-brand)"/><rect x="150" y="150" width="100" height="18" rx="6" fill="var(--color-ink)"/><circle cx="200" cy="138" r="12" fill="var(--color-brand)" stroke="var(--color-ink)" stroke-width="4"/>'
  },
  "art-stool": {
    tone: "olive",
    label: "round stool",
    markup:
      '<ellipse cx="200" cy="356" rx="130" ry="10" fill="var(--color-ink)" opacity=".16"/><path d="M130 214l-38 136M270 214l38 136M200 226V352" stroke="var(--color-ink)" stroke-width="13" stroke-linecap="round"/><path d="M112 292h176" stroke="var(--color-ink)" stroke-width="7"/><path d="M96 168v26c0 18 46 28 104 28s104-10 104-28v-26" fill="var(--color-brand)" stroke="var(--color-ink)" stroke-width="5"/><ellipse cx="200" cy="168" rx="104" ry="28" fill="var(--color-surface)" stroke="var(--color-ink)" stroke-width="5"/><ellipse cx="200" cy="168" rx="56" ry="12" fill="none" stroke="var(--color-ink)" stroke-width="3" opacity=".4"/>'
  }
};

export function productArt(mediaKey: string | null): ProductArt | undefined {
  return mediaKey === null ? undefined : productArtByKey[mediaKey];
}
