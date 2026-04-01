import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST() {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "OpenAI API key not configured on the server." },
      { status: 500 }
    );
  }

  try {
    const response = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-image-1",
        prompt: `A front-facing photograph of a cozy living room interior. The back wall is a single flat SOLID PURE WHITE color (#FFFFFF), completely blank, no texture, no decoration, no shadows on the wall — just a perfectly uniform white rectangle. In front of the wall: a modern mid-century sofa with throw pillows, a round wooden coffee table with a small plant and books, a floor lamp to one side, and a potted fiddle leaf fig plant on the other side. Beautiful warm hardwood floor. Soft natural lighting from the left. The room feels warm and inviting. Photorealistic interior design photograph, editorial style. Camera angle: straight on, eye level, centered on the wall. The white wall must occupy the upper 65-70% of the image.`,
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
    const message = error instanceof Error ? error.message : "Failed to generate room scene.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
