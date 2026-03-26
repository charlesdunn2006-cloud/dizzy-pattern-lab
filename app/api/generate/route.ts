import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Poll for prediction completion
async function waitForPrediction(
  id: string,
  token: string,
  maxWait = 120000
): Promise<{ output: string[] | null; error: string | null }> {
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
    // Wait 1 second before polling again
    await new Promise((r) => setTimeout(r, 1000));
  }
  return { output: null, error: "Prediction timed out" };
}

export async function POST(request: Request) {
  const replicateToken = process.env.REPLICATE_API_TOKEN;
  const openaiKey = process.env.OPENAI_API_KEY;

  try {
    const { description } = await request.json();

    if (!description || typeof description !== "string" || !description.trim()) {
      return NextResponse.json(
        { error: "Please provide a pattern description." },
        { status: 400 }
      );
    }

    // Try Replicate first (native seamless tiling), fall back to DALL-E
    if (replicateToken) {
      const prompt = `Seamless tileable wallpaper pattern: ${description.trim()}. Perfectly repeating surface pattern, no visible seams or borders when tiled. Clean shapes, bold colors, flat graphic illustration style, print quality, high resolution.`;

      // Use SDXL with tiling-friendly settings
      const res = await fetch("https://api.replicate.com/v1/predictions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${replicateToken}`,
        },
        body: JSON.stringify({
          // SDXL model with seamless tiling support
          version: "7762fd07cf82c948538e41f63f77d685e02b063e37e496e96eefd46c929f9bdc",
          input: {
            prompt,
            negative_prompt: "seams, borders, edges, frames, watermark, text, signature, blurry, low quality, asymmetric edges, non-repeating",
            width: 1024,
            height: 1024,
            num_inference_steps: 30,
            guidance_scale: 7.5,
            scheduler: "K_EULER",
            num_outputs: 1,
            disable_safety_checker: true,
          },
        }),
      });

      if (res.ok) {
        const prediction = await res.json();
        const result = await waitForPrediction(prediction.id, replicateToken);

        if (result.output && result.output.length > 0) {
          // Replicate returns URLs — fetch the image and convert to base64
          const imageUrl = result.output[0];
          const imgRes = await fetch(imageUrl);
          const buffer = await imgRes.arrayBuffer();
          const b64 = Buffer.from(buffer).toString("base64");
          return NextResponse.json({ image: b64 });
        }

        // If Replicate failed, fall through to DALL-E
        console.warn("Replicate failed:", result.error);
      }
    }

    // Fallback to DALL-E
    if (!openaiKey) {
      return NextResponse.json(
        { error: "No AI API keys configured on the server. Add REPLICATE_API_TOKEN or OPENAI_API_KEY." },
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
        prompt: `Create a seamless, tileable wallpaper pattern: ${description.trim()}. The design MUST repeat perfectly with no visible seams, edges, or borders when tiled horizontally and vertically. Ensure the left edge matches the right edge and the top edge matches the bottom edge exactly. Use clean, well-defined shapes with solid colors and clear outlines. Flat graphic illustration style with bold color blocks — suitable for vector conversion. Continuous repeating surface pattern design, high resolution, print quality.`,
        n: 1,
        size: "1024x1024",
        quality: "hd",
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
    const message = error instanceof Error ? error.message : "Failed to generate pattern.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
