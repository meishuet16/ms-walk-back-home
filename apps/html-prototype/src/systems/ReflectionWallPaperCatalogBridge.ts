import { reflectionPaperStyles } from "./ReflectionWall.js";

type MutablePaperStyle = { id: string; label: string };

const extraPaperStyles: MutablePaperStyle[] = [
  { id: "pink-round", label: "Pink Round" },
  { id: "cat-pocket", label: "Cat Pocket" },
  { id: "meadow-note", label: "Meadow Note" },
  { id: "cloud-note", label: "Cloud Note" },
  { id: "yellow-check", label: "Yellow Check" },
  { id: "botanical-tape", label: "Botanical Tape" },
  { id: "sky-postcard", label: "Sky Postcard" },
  { id: "mint-list", label: "Mint List" }
];

export function installReflectionWallPaperCatalog(): void {
  const catalog = reflectionPaperStyles as unknown as MutablePaperStyle[];
  const known = new Set(catalog.map((style) => style.id));
  for (const style of extraPaperStyles) {
    if (!known.has(style.id)) catalog.push(style);
  }
}

export function reflectionWallExtraPaperStyles(): readonly MutablePaperStyle[] {
  return extraPaperStyles;
}
