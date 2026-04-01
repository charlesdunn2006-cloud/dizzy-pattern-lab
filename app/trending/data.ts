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
];
