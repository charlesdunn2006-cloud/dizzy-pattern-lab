import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const FURNITURE_PROMPTS: Record<string, string> = {
  couch:
    "A modern mid-century 3-seat sofa, olive green fabric with warm wood legs, two small throw pillows (cream and mustard), viewed straight-on from the front. Photorealistic, studio lighting, isolated object on transparent background. No shadows on the ground.",
  lamp:
    "A tall modern brass floor lamp with a large cream linen drum shade, thin elegant stand, viewed straight-on. Photorealistic, studio lighting, isolated object on transparent background. The lamp is turned on with warm soft glow. No shadows on the ground.",
  plant:
    "A large fiddle leaf fig plant in a woven rattan basket planter, lush green leaves, about 4 feet tall, viewed straight-on. Photorealistic, studio lighting, isolated object on transparent background. No shadows on the ground.",
};

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "OpenAI API key not configured on the server." },
      { status: 500 }
    );
  }

  try {
    const { item } = await request.json();

    if (!item || !FURNITURE_PROMPTS[item]) {
      return NextResponse.json(
        { error: `Invalid item. Choose from: ${Object.keys(FURNITURE_PROMPTS).join(", ")}` },
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
        prompt: FURNITURE_PROMPTS[item],
        n: 1,
        size: "1024x1024",
        quality: "medium",
        background: "transparent",
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
    const message = error instanceof Error ? error.message : "Failed to generate furniture.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
