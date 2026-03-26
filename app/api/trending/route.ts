import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// Categories to search for trending wallpaper patterns
const SEARCH_CATEGORIES = [
  "trending wallpaper patterns",
  "popular interior design wallpaper",
  "wallpaper design trends",
  "modern wallpaper styles",
  "home decor wallpaper popular",
];

interface TrendingItem {
  id: string;
  title: string;
  description: string;
  prompt: string;
  category: string;
  colors: string[];
  popularity: number;
}

// Color palettes mapped to common style keywords
const COLOR_PALETTES: Record<string, string[]> = {
  botanical: ["#0D1B2A", "#1B4332", "#4A7A52", "#8FBC8F"],
  geometric: ["#1A1A2E", "#FFD700", "#B8860B", "#2C2C2C"],
  floral: ["#1A1A2E", "#C62828", "#AD1457", "#2E7D32"],
  tropical: ["#FFB6C1", "#228B22", "#32CD32", "#006400"],
  abstract: ["#E07C51", "#D4A847", "#8B4513", "#F5DEB3"],
  minimalist: ["#FFFFFF", "#9CAF88", "#B0BEC5", "#7B8B6F"],
  retro: ["#008080", "#E8A317", "#FF6B6B", "#FFF8DC"],
  dark: ["#0D1137", "#FFD700", "#E8D5B7", "#192A56"],
  classic: ["#1A1A1A", "#696969", "#C0C0C0", "#2C2C2C"],
  folk: ["#FFFFFF", "#B22222", "#4682B4", "#2F4F4F"],
  watercolor: ["#FFFFFF", "#F4C2C2", "#B39DDB", "#80CBC4"],
  asian: ["#1A237E", "#FFFFFF", "#F8BBD0", "#3F51B5"],
  moroccan: ["#0047AB", "#FFFFFF", "#CD5C5C", "#F4E4C8"],
  art_deco: ["#000000", "#FFD700", "#B8860B", "#1C1C1C"],
  cottagecore: ["#FFF8E7", "#A8B5A2", "#C9A9A6", "#8B7355"],
};

function getCategoryColors(title: string, description: string): { category: string; colors: string[] } {
  const text = `${title} ${description}`.toLowerCase();
  if (text.includes("botan") || text.includes("leaf") || text.includes("plant")) return { category: "Botanical", colors: COLOR_PALETTES.botanical };
  if (text.includes("geometric") || text.includes("geo")) return { category: "Geometric", colors: COLOR_PALETTES.geometric };
  if (text.includes("floral") || text.includes("flower") || text.includes("rose") || text.includes("peony")) return { category: "Floral", colors: COLOR_PALETTES.floral };
  if (text.includes("tropical") || text.includes("palm") || text.includes("jungle")) return { category: "Tropical", colors: COLOR_PALETTES.tropical };
  if (text.includes("abstract") || text.includes("marble")) return { category: "Abstract", colors: COLOR_PALETTES.abstract };
  if (text.includes("minimal") || text.includes("simple") || text.includes("clean")) return { category: "Minimalist", colors: COLOR_PALETTES.minimalist };
  if (text.includes("retro") || text.includes("vintage") || text.includes("mid-century")) return { category: "Retro", colors: COLOR_PALETTES.retro };
  if (text.includes("dark") || text.includes("moody") || text.includes("celestial")) return { category: "Dark", colors: COLOR_PALETTES.dark };
  if (text.includes("damask") || text.includes("classic") || text.includes("traditional")) return { category: "Classic", colors: COLOR_PALETTES.classic };
  if (text.includes("folk") || text.includes("scandi")) return { category: "Folk", colors: COLOR_PALETTES.folk };
  if (text.includes("watercolor") || text.includes("pastel") || text.includes("soft")) return { category: "Watercolor", colors: COLOR_PALETTES.watercolor };
  if (text.includes("japanese") || text.includes("asian") || text.includes("chinois")) return { category: "Asian-Inspired", colors: COLOR_PALETTES.asian };
  if (text.includes("moroccan") || text.includes("tile") || text.includes("mediterranean")) return { category: "Mediterranean", colors: COLOR_PALETTES.moroccan };
  if (text.includes("deco") || text.includes("gatsby")) return { category: "Art Deco", colors: COLOR_PALETTES.art_deco };
  if (text.includes("cottage") || text.includes("mushroom") || text.includes("whimsical")) return { category: "Cottagecore", colors: COLOR_PALETTES.cottagecore };
  return { category: "Design", colors: COLOR_PALETTES.abstract };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const apiKey = searchParams.get("key");

  if (!apiKey) {
    return NextResponse.json({ error: "OpenAI API key required. Pass ?key=sk-..." }, { status: 400 });
  }

  try {
    const currentMonth = new Date().toLocaleString("en-US", { month: "long", year: "numeric" });

    // Use OpenAI to generate trending patterns based on current design trends
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are an interior design and wallpaper trend expert. Generate trending wallpaper pattern ideas based on current design trends, popular search terms, and seasonal relevance."
          },
          {
            role: "user",
            content: `It is ${currentMonth}. Generate exactly 15 trending wallpaper pattern ideas that would be popular right now. Consider seasonal trends, current interior design movements, social media trends (Pinterest, Instagram), and popular color palettes.

For each pattern, provide:
1. title: A catchy name (2-4 words)
2. description: One sentence describing the pattern
3. prompt: A detailed DALL-E prompt to generate this as a seamless, tileable wallpaper pattern at print quality

Return ONLY a JSON array with objects like:
[{"title": "...", "description": "...", "prompt": "..."}]

No markdown, no explanation, just the JSON array.`
          }
        ],
        temperature: 0.9,
        max_tokens: 3000,
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err?.error?.message || `OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content?.trim() || "[]";

    // Parse the response — handle potential markdown wrapping
    let parsed: Array<{ title: string; description: string; prompt: string }>;
    try {
      const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      parsed = JSON.parse(cleaned);
    } catch {
      return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 });
    }

    // Build trending items with categories and colors
    const trending: TrendingItem[] = parsed.slice(0, 15).map((item, index) => {
      const { category, colors } = getCategoryColors(item.title, item.description);
      return {
        id: `trend-${Date.now()}-${index}`,
        title: item.title,
        description: item.description,
        prompt: item.prompt,
        category,
        colors,
        popularity: Math.max(70, 98 - index * 2),
      };
    });

    return NextResponse.json({
      month: currentMonth,
      patterns: trending,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
