import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Poll for prediction completion
async function waitForPrediction(
  id: string,
  token: string,
  maxWait = 180000
): Promise<{ output: string[] | string | null; error: string | null }> {
  const start = Date.now();
  while (Date.now() - start < maxWait) {
    const res = await fetch(`https://api.replicate.com/v1/predictions/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (data.status === "succeeded") {
      return { output: data.output, error: null };
    }
    if (data.status === "failed" || data.status === "canceled") {
      return { output: null, error: data.error || "Prediction failed" };
    }
    await new Promise((r) => setTimeout(r, 1500));
  }
  return { output: null, error: "Prediction timed out" };
}

export async function POST(request: Request) {
  const replicateToken = process.env.REPLICATE_API_TOKEN;
  const openaiKey = process.env.OPENAI_API_KEY;

  try {
    const { prompt } = await request.json();

    if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
      return NextResponse.json(
        { error: "Please provide a pattern prompt." },
        { status: 400 }
      );
    }

    // Use Replicate's seamless-texture model (Flux + seamless tiling LoRA)
    if (replicateToken) {
      const fullPrompt = `${prompt.trim()}, seamless tileable wallpaper pattern, repeating surface design, clean shapes, bold colors, flat graphic illustration, print quality`;

      const res = await fetch("https://api.replicate.com/v1/predictions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${replicateToken}`,
        },
        body: JSON.stringify({
          version: "9a59c0dce189bfe8a7fcb379c497713500ff959652c4e7874023f15983dec839",
          input: {
            prompt: fullPrompt,
            model: "schnell",
            width: 1024,
            height: 1024,
            num_outputs: 1,
            num_inference_steps: 4,
            guidance_scale: 3,
            output_format: "png",
            output_quality: 90,
            disable_safety_checker: true,
          },
        }),
      });

      if (res.ok) {
        const prediction = await res.json();
        const result = await waitForPrediction(prediction.id, replicateToken);

        if (result.output) {
          const imageUrl = Array.isArray(result.output) ? result.output[0] : result.output;
          if (imageUrl && typeof imageUrl === "string") {
            const imgRes = await fetch(imageUrl);
            const buffer = await imgRes.arrayBuffer();
            const b64 = Buffer.from(buffer).toString("base64");
            return NextResponse.json({ image: b64 });
          }
        }

        console.warn("Replicate preview failed:", result.error);
      }
    }

    // Fallback to DALL-E
    if (!openaiKey) {
      return NextResponse.json(
        { error: "No AI API keys configured. Add REPLICATE_API_TOKEN or OPENAI_API_KEY." },
        { status: 500 }
      );
    }

    const response = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: "dall-e-3",
        prompt: `Create a seamless, tileable wallpaper pattern: ${prompt.trim()}. The design MUST repeat perfectly with no visible seams, edges, or borders when tiled horizontally and vertically. Ensure the left edge matches the right edge and the top edge matches the bottom edge exactly. Use clean, well-defined shapes with solid colors and clear outlines. Flat graphic illustration style with bold color blocks — suitable for vector conversion. Continuous repeating surface pattern design, print quality.`,
        n: 1,
        size: "1024x1024",
        quality: "standard",
        response_format: "b64_json",
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
