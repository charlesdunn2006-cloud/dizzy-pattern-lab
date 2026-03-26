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
    const { prompt } = await request.json();

    if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
      return NextResponse.json(
        { error: "Please provide a pattern prompt." },
        { status: 400 }
      );
    }

    const response = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-image-1",
        prompt: `Create a seamless, tileable wallpaper pattern: ${prompt.trim()}. The design MUST repeat perfectly with no visible seams, edges, or borders when tiled horizontally and vertically. Ensure the left edge matches the right edge and the top edge matches the bottom edge exactly. Modern, sophisticated aesthetic with rich textures and depth. Continuous repeating surface pattern design, print quality.`,
        n: 1,
        size: "1024x1024",
        quality: "medium",
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
    const message = error instanceof Error ? error.message : "Failed to generate preview.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
