"use client";

import { useState, useCallback } from "react";

interface Props {
  patternImage: HTMLImageElement | null;
  onImageProcessed: (img: HTMLImageElement) => void;
}

type SeamlessMethod = "blend" | "mirror";

// Edge blend: crossfade edges so left matches right, top matches bottom
function applyEdgeBlend(source: HTMLImageElement, blendWidth: number): HTMLCanvasElement {
  const w = source.width;
  const h = source.height;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;

  // Draw original
  ctx.drawImage(source, 0, 0);
  const imageData = ctx.getImageData(0, 0, w, h);
  const data = imageData.data;

  // Blend left-right edges
  for (let y = 0; y < h; y++) {
    for (let i = 0; i < blendWidth; i++) {
      const alpha = i / blendWidth; // 0 at left edge, 1 at blendWidth
      const leftIdx = (y * w + i) * 4;
      const rightIdx = (y * w + (w - blendWidth + i)) * 4;

      // Average the left and right edge pixels
      const blendedR = Math.round(data[rightIdx] * (1 - alpha) + data[leftIdx] * alpha);
      const blendedG = Math.round(data[rightIdx + 1] * (1 - alpha) + data[leftIdx + 1] * alpha);
      const blendedB = Math.round(data[rightIdx + 2] * (1 - alpha) + data[leftIdx + 2] * alpha);

      // Apply blended values to both edges
      data[leftIdx] = blendedR;
      data[leftIdx + 1] = blendedG;
      data[leftIdx + 2] = blendedB;

      data[rightIdx] = blendedR;
      data[rightIdx + 1] = blendedG;
      data[rightIdx + 2] = blendedB;
    }
  }

  // Blend top-bottom edges
  for (let x = 0; x < w; x++) {
    for (let i = 0; i < blendWidth; i++) {
      const alpha = i / blendWidth;
      const topIdx = (i * w + x) * 4;
      const bottomIdx = ((h - blendWidth + i) * w + x) * 4;

      const blendedR = Math.round(data[bottomIdx] * (1 - alpha) + data[topIdx] * alpha);
      const blendedG = Math.round(data[bottomIdx + 1] * (1 - alpha) + data[topIdx + 1] * alpha);
      const blendedB = Math.round(data[bottomIdx + 2] * (1 - alpha) + data[topIdx + 2] * alpha);

      data[topIdx] = blendedR;
      data[topIdx + 1] = blendedG;
      data[topIdx + 2] = blendedB;

      data[bottomIdx] = blendedR;
      data[bottomIdx + 1] = blendedG;
      data[bottomIdx + 2] = blendedB;
    }
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas;
}

// Mirror tile: create a 2x2 mirrored version that guarantees perfect seams
function applyMirrorTile(source: HTMLImageElement): HTMLCanvasElement {
  const w = source.width;
  const h = source.height;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;

  // Draw 4 quadrants — each a half-size copy, mirrored
  const halfW = w / 2;
  const halfH = h / 2;

  // Top-left: normal (scaled to half)
  ctx.drawImage(source, 0, 0, w, h, 0, 0, halfW, halfH);

  // Top-right: flipped horizontally
  ctx.save();
  ctx.translate(w, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(source, 0, 0, w, h, 0, 0, halfW, halfH);
  ctx.restore();

  // Bottom-left: flipped vertically
  ctx.save();
  ctx.translate(0, h);
  ctx.scale(1, -1);
  ctx.drawImage(source, 0, 0, w, h, 0, 0, halfW, halfH);
  ctx.restore();

  // Bottom-right: flipped both
  ctx.save();
  ctx.translate(w, h);
  ctx.scale(-1, -1);
  ctx.drawImage(source, 0, 0, w, h, 0, 0, halfW, halfH);
  ctx.restore();

  return canvas;
}

export default function SeamlessMaker({ patternImage, onImageProcessed }: Props) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeMethod, setActiveMethod] = useState<SeamlessMethod | null>(null);

  const handleProcess = useCallback((method: SeamlessMethod) => {
    if (!patternImage || isProcessing) return;
    setIsProcessing(true);
    setActiveMethod(method);

    requestAnimationFrame(() => {
      try {
        let resultCanvas: HTMLCanvasElement;

        if (method === "blend") {
          // Blend width = ~10% of the smaller dimension
          const blendWidth = Math.round(Math.min(patternImage.width, patternImage.height) * 0.1);
          resultCanvas = applyEdgeBlend(patternImage, blendWidth);
        } else {
          resultCanvas = applyMirrorTile(patternImage);
        }

        // Convert canvas to image
        const img = new Image();
        img.onload = () => {
          onImageProcessed(img);
          setIsProcessing(false);
          setActiveMethod(null);
        };
        img.onerror = () => {
          setIsProcessing(false);
          setActiveMethod(null);
          alert("Failed to process image.");
        };
        img.src = resultCanvas.toDataURL("image/png");
      } catch {
        setIsProcessing(false);
        setActiveMethod(null);
        alert("Error processing image.");
      }
    });
  }, [patternImage, isProcessing, onImageProcessed]);

  if (!patternImage) return null;

  return (
    <div style={{ marginBottom: 24 }}>
      <label style={{
        display: "block", fontSize: 10, fontWeight: 500, letterSpacing: "0.18em",
        textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 10,
      }}>
        Make Seamless
      </label>
      <p style={{
        fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.6,
        marginBottom: 12,
      }}>
        Apply post-processing to improve seamless tiling. Use &ldquo;Check Seamlessness&rdquo; below to verify the result.
      </p>
      <div style={{ display: "flex", gap: 10 }}>
        <button
          onClick={() => handleProcess("blend")}
          disabled={isProcessing}
          style={{
            flex: 1,
            padding: "14px 16px",
            border: "2px solid var(--accent)",
            background: isProcessing && activeMethod === "blend" ? "var(--bg-card)" : "transparent",
            color: isProcessing && activeMethod === "blend" ? "var(--text-muted)" : "var(--accent)",
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: "0.1em",
            cursor: isProcessing ? "not-allowed" : "pointer",
            textTransform: "uppercase",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 4,
            opacity: isProcessing && activeMethod !== "blend" ? 0.5 : 1,
          }}
        >
          <span>{isProcessing && activeMethod === "blend" ? "BLENDING..." : "EDGE BLEND"}</span>
          <span style={{
            fontSize: 10, fontWeight: 500, opacity: 0.7,
            letterSpacing: "0.06em", textTransform: "none",
          }}>
            Crossfades edges — preserves original look
          </span>
        </button>

        <button
          onClick={() => handleProcess("mirror")}
          disabled={isProcessing}
          style={{
            flex: 1,
            padding: "14px 16px",
            border: "2px solid var(--accent)",
            background: isProcessing && activeMethod === "mirror" ? "var(--bg-card)" : "transparent",
            color: isProcessing && activeMethod === "mirror" ? "var(--text-muted)" : "var(--accent)",
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: "0.1em",
            cursor: isProcessing ? "not-allowed" : "pointer",
            textTransform: "uppercase",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 4,
            opacity: isProcessing && activeMethod !== "mirror" ? 0.5 : 1,
          }}
        >
          <span>{isProcessing && activeMethod === "mirror" ? "MIRRORING..." : "MIRROR TILE"}</span>
          <span style={{
            fontSize: 10, fontWeight: 500, opacity: 0.7,
            letterSpacing: "0.06em", textTransform: "none",
          }}>
            Guarantees perfect seams — mirrored look
          </span>
        </button>
      </div>
    </div>
  );
}
