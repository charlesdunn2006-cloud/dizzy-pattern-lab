import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "OpenAI API key not configured on the server." },
      { status: 500 }
    );
  }

  try {
    const { description, style, colorMood, complexity } = await request.json();

    if (!description || typeof description !== "string" || !description.trim()) {
      return NextResponse.json(
        { error: "Please provide a pattern description." },
        { status: 400 }
      );
    }

    // Build style modifiers
    const styleParts: string[] = [];

    if (style && style !== "any") {
      const styleMap: Record<string, string> = {
        artistic: "artistic, painterly, expressive brushwork",
        minimal: "minimalist, clean lines, simple shapes, lots of negative space",
        vintage: "vintage, retro, aged texture, nostalgic color palette",
        botanical: "detailed botanical illustration, naturalistic, hand-drawn",
        geometric: "geometric, precise, mathematical, structured repetition",
        watercolor: "soft watercolor washes, organic bleeding edges, delicate",
        luxe: "luxury, metallic accents, rich textures, high-end wallpaper",
      };
      if (styleMap[style]) styleParts.push(styleMap[style]);
    }

    if (colorMood && colorMood !== "any") {
      const colorMap: Record<string, string> = {
        warm: "warm color palette with ambers, terracottas, and golds",
        cool: "cool color palette with blues, teals, and silvers",
        earth: "earthy natural tones, sage, clay, sand, olive",
        pastel: "soft pastel colors, muted and gentle",
        bold: "bold vivid saturated colors, high contrast",
        mono: "monochromatic, single color in varying shades and tints",
        neutral: "neutral palette, creams, grays, taupes, and whites",
      };
      if (colorMap[colorMood]) styleParts.push(colorMap[colorMood]);
    }

    if (complexity && complexity !== "any") {
      const complexMap: Record<string, string> = {
        simple: "simple, clean, uncluttered, minimal detail",
        moderate: "moderate detail level, balanced composition",
        intricate: "highly detailed, intricate, dense pattern work",
      };
      if (complexMap[complexity]) styleParts.push(complexMap[complexity]);
    }

    const styleStr = styleParts.length > 0 ? ` Style: ${styleParts.join(". ")}.` : "";

    const response = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-image-1",
        prompt: `Create a seamless, tileable wallpaper pattern: ${description.trim()}.${styleStr} The design MUST repeat perfectly with no visible seams, edges, or borders when tiled horizontally and vertically. Ensure the left edge matches the right edge and the top edge matches the bottom edge exactly. Modern, sophisticated aesthetic with rich textures and depth. Continuous repeating surface pattern design, high resolution, print quality.`,
        n: 1,
        size: "1024x1024",
        quality: "high",
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err?.error?.message || `OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const b64 = data.data[0].b64_json;

    return NextResponse.json({ image: b64 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to generate pattern.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
