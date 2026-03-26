export interface ProductTemplate {
  id: string;
  name: string;
  widthInches: number;
  heightInches: number;
  isSeamlessWrap: boolean;
  isCustom?: boolean;
}

export const DPI = 300;

export const PRESET_TEMPLATES: ProductTemplate[] = [
  { id: "20oz-tumbler", name: "20oz Skinny Tumbler", widthInches: 9.25, heightInches: 8.2, isSeamlessWrap: true },
  { id: "30oz-tumbler", name: "30oz Skinny Tumbler", widthInches: 9.55, heightInches: 10.25, isSeamlessWrap: true },
  { id: "inkjoy-pen", name: "Inkjoy Pen Wrap", widthInches: 1.5, heightInches: 4.75, isSeamlessWrap: true },
  { id: "bookmark", name: "Bookmark", widthInches: 2, heightInches: 6, isSeamlessWrap: false },
  { id: "kindle-insert", name: "Kindle Paperwhite Insert", widthInches: 5, heightInches: 7, isSeamlessWrap: false },
  { id: "15oz-mug", name: "15oz Mug Wrap", widthInches: 9.5, heightInches: 4.25, isSeamlessWrap: true },
  { id: "11oz-mug", name: "11oz Mug Wrap", widthInches: 8.5, heightInches: 3.5, isSeamlessWrap: true },
  { id: "comp-notebook", name: "Composition Notebook", widthInches: 6.9, heightInches: 10, isSeamlessWrap: false },
];

export interface TileSize {
  label: string;
  widthInches: number;
  heightInches: number;
}

export const TILE_SIZES: TileSize[] = [
  { label: '12" × 12"', widthInches: 12, heightInches: 12 },
  { label: '18" × 18"', widthInches: 18, heightInches: 18 },
  { label: '24" × 24"', widthInches: 24, heightInches: 24 },
  { label: '36" × 36"', widthInches: 36, heightInches: 36 },
];

export const QUICK_IDEAS = [
  "Tropical leaves with gold accents on a cream background",
  "Art Deco geometric pattern in burgundy and gold",
  "Delicate botanical vines with small flowers in soft pastels",
  "Modern marbled texture in earthy terracotta and ochre",
  "Mid-century modern abstract shapes in teal and mustard",
  "Japanese wave pattern with cherry blossoms",
  "Whimsical mushrooms and ferns in a cottagecore style",
  "Minimalist line art florals in black on white",
];

export function inchesToPixels(inches: number): number {
  return Math.round(inches * DPI);
}

export function getEffectiveDpi(originalDpi: number, scalePercent: number): number {
  return Math.round(originalDpi * (100 / scalePercent));
}

export function calculateTiles(
  wallWidthFeet: number, wallHeightFeet: number,
  tileWidthInches: number, tileHeightInches: number
): { tilesX: number; tilesY: number; total: number } {
  const wallWidthInches = wallWidthFeet * 12;
  const wallHeightInches = wallHeightFeet * 12;
  const tilesX = Math.ceil(wallWidthInches / tileWidthInches);
  const tilesY = Math.ceil(wallHeightInches / tileHeightInches);
  return { tilesX, tilesY, total: tilesX * tilesY };
}
