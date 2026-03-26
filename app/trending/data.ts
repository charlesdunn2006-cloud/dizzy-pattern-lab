export interface TrendingPattern {
  id: string;
  title: string;
  description: string;
  prompt: string;
  category: string;
  colors: string[];
  popularity: number; // 1-100
}

export function getCurrentMonth(): string {
  const now = new Date();
  return now.toLocaleString("en-US", { month: "long", year: "numeric" });
}

export const TRENDING_PATTERNS: TrendingPattern[] = [
  {
    id: "botanical-maximalism",
    title: "Botanical Maximalism",
    description: "Lush oversized tropical leaves layered with exotic flowers in rich jewel tones.",
    prompt: "Lush oversized tropical leaves layered with exotic flowers in rich jewel tones — emerald green, sapphire blue, and ruby red on a deep navy background. Maximalist botanical wallpaper, seamless tile.",
    category: "Botanical",
    colors: ["#0D1B2A", "#1B4332", "#4A1942", "#C62828"],
    popularity: 97,
  },
  {
    id: "art-deco-revival",
    title: "Art Deco Revival",
    description: "Geometric fan shapes and sunburst motifs in gold and black with a 1920s glamour feel.",
    prompt: "Art Deco geometric fan shapes and sunburst motifs in metallic gold on a rich black background. Elegant 1920s-inspired seamless wallpaper pattern with thin gold lines and symmetrical arches.",
    category: "Geometric",
    colors: ["#000000", "#FFD700", "#B8860B", "#1C1C1C"],
    popularity: 94,
  },
  {
    id: "soft-mushroom-cottagecore",
    title: "Mushroom Cottagecore",
    description: "Whimsical hand-drawn mushrooms, ferns, and woodland creatures in soft earthy pastels.",
    prompt: "Whimsical hand-drawn mushrooms, ferns, snails, and tiny woodland creatures in soft earthy pastels — warm beige, sage green, and dusty rose on a cream background. Cottagecore seamless wallpaper.",
    category: "Whimsical",
    colors: ["#FFF8E7", "#A8B5A2", "#C9A9A6", "#8B7355"],
    popularity: 92,
  },
  {
    id: "japanese-wave",
    title: "Japanese Wave & Cherry Blossom",
    description: "Traditional ukiyo-e inspired ocean waves with delicate cherry blossoms floating above.",
    prompt: "Traditional Japanese ukiyo-e inspired ocean waves in indigo and white with delicate pink cherry blossoms floating on the breeze. Seamless wallpaper tile with elegant Eastern aesthetic.",
    category: "Asian-Inspired",
    colors: ["#1A237E", "#FFFFFF", "#F8BBD0", "#3F51B5"],
    popularity: 91,
  },
  {
    id: "terracotta-marble",
    title: "Terracotta Marble Swirl",
    description: "Organic marbled texture in warm terracotta, ochre, and burnt sienna with gold veining.",
    prompt: "Luxurious marbled texture wallpaper in warm terracotta, ochre, and burnt sienna with delicate gold veining throughout. Organic flowing patterns, seamless tile, print-ready quality.",
    category: "Abstract",
    colors: ["#E07C51", "#D4A847", "#8B4513", "#F5DEB3"],
    popularity: 89,
  },
  {
    id: "moody-floral",
    title: "Moody Dark Florals",
    description: "Dutch master-inspired dark florals — roses, peonies, and dahlias on a near-black ground.",
    prompt: "Dutch Golden Age still-life inspired dark floral wallpaper with roses, peonies, dahlias, and trailing ivy on a near-black background. Moody, dramatic, richly colored seamless pattern.",
    category: "Botanical",
    colors: ["#1A1A2E", "#C62828", "#AD1457", "#2E7D32"],
    popularity: 88,
  },
  {
    id: "mid-century-atomic",
    title: "Mid-Century Atomic",
    description: "Retro atomic-era starbursts, boomerangs, and organic shapes in teal, mustard, and coral.",
    prompt: "Mid-century modern atomic-era pattern with starbursts, boomerangs, and abstract organic shapes in teal, mustard yellow, and coral on a warm cream background. Retro 1950s seamless wallpaper.",
    category: "Retro",
    colors: ["#008080", "#E8A317", "#FF6B6B", "#FFF8DC"],
    popularity: 86,
  },
  {
    id: "sage-eucalyptus",
    title: "Sage & Eucalyptus",
    description: "Minimalist watercolor eucalyptus branches in muted sage and silver green.",
    prompt: "Minimalist watercolor eucalyptus branches and leaves in muted sage green, silver green, and soft gray on a clean white background. Airy, light botanical seamless wallpaper pattern.",
    category: "Botanical",
    colors: ["#FFFFFF", "#9CAF88", "#B0BEC5", "#7B8B6F"],
    popularity: 85,
  },
  {
    id: "celestial-midnight",
    title: "Celestial Midnight",
    description: "Stars, moons, and constellations with gold foil detail on deep midnight blue.",
    prompt: "Celestial wallpaper with stars, crescent moons, constellations, and zodiac symbols in gold foil on a deep midnight blue background. Mystical, dreamy seamless pattern tile.",
    category: "Celestial",
    colors: ["#0D1137", "#FFD700", "#E8D5B7", "#192A56"],
    popularity: 84,
  },
  {
    id: "moroccan-tile",
    title: "Moroccan Zellige Tile",
    description: "Intricate Moroccan zellige-inspired geometric tilework in cobalt, white, and terra cotta.",
    prompt: "Intricate Moroccan zellige-inspired geometric tile pattern in cobalt blue, crisp white, and warm terra cotta. Hand-painted ceramic look, seamless wallpaper tile with Mediterranean charm.",
    category: "Geometric",
    colors: ["#0047AB", "#FFFFFF", "#CD5C5C", "#F4E4C8"],
    popularity: 82,
  },
  {
    id: "tropical-palm",
    title: "Tropical Palm Paradise",
    description: "Bold palm fronds and monstera leaves in vibrant greens against a blush pink sky.",
    prompt: "Bold tropical palm fronds and monstera leaves in vibrant emerald and lime green against a soft blush pink background. Lush paradise vacation-inspired seamless wallpaper tile.",
    category: "Tropical",
    colors: ["#FFB6C1", "#228B22", "#32CD32", "#006400"],
    popularity: 80,
  },
  {
    id: "block-print-indigo",
    title: "Block Print Indigo",
    description: "Hand-stamped Indian block print motifs in deep indigo on natural linen texture.",
    prompt: "Traditional Indian block print wallpaper with repeating hand-stamped floral and paisley motifs in deep indigo ink on a natural linen-textured cream background. Artisan seamless pattern.",
    category: "Ethnic",
    colors: ["#1A237E", "#F5F5DC", "#303F9F", "#E8E0D0"],
    popularity: 79,
  },
  {
    id: "watercolor-abstract",
    title: "Watercolor Abstract Flow",
    description: "Soft watercolor washes blending blush, lavender, and seafoam in dreamy abstract forms.",
    prompt: "Soft watercolor abstract wallpaper with flowing washes of blush pink, lavender, and seafoam green blending together in dreamy organic forms on white. Artistic seamless tile.",
    category: "Abstract",
    colors: ["#FFFFFF", "#F4C2C2", "#B39DDB", "#80CBC4"],
    popularity: 77,
  },
  {
    id: "gothic-damask",
    title: "Gothic Damask",
    description: "Ornate Victorian damask with elaborate scrollwork in charcoal and silver on matte black.",
    prompt: "Ornate Victorian Gothic damask wallpaper with elaborate scrollwork, fleur-de-lis, and acanthus leaves in charcoal gray and silver on a matte black background. Dark elegant seamless pattern.",
    category: "Classic",
    colors: ["#1A1A1A", "#696969", "#C0C0C0", "#2C2C2C"],
    popularity: 75,
  },
  {
    id: "scandinavian-folk",
    title: "Scandinavian Folk Art",
    description: "Simple folk art birds, flowers, and hearts in red, blue, and white Scandi style.",
    prompt: "Scandinavian folk art wallpaper with simple stylized birds, flowers, hearts, and symmetrical botanical motifs in traditional red, dusty blue, and white. Clean Nordic seamless pattern.",
    category: "Folk",
    colors: ["#FFFFFF", "#B22222", "#4682B4", "#2F4F4F"],
    popularity: 73,
  },
];
