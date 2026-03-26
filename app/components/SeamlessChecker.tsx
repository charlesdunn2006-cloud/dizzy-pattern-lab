"use client";

import { useState, useRef, useCallback, useEffect } from "react";

interface Props {
  patternImage: HTMLImageElement | null;
  scale: number;
  rotation: number;
}

interface SeamlessResult {
  score: number; // 0-100, 100 = perfectly seamless
  horizontalScore: number;
  verticalScore: number;
  verdict: "seamless" | "good" | "fair" | "poor";
  message: string;
}

function analyzeSeamlessness(canvas: HTMLCanvasElement): SeamlessResult {
  const ctx = canvas.getContext("2d");
  if (!ctx) return { score: 0, horizontalScore: 0, verticalScore: 0, verdict: "poor", message: "Could not analyze." };

  const w = canvas.width;
  const h = canvas.height;
  const imageData = ctx.getImageData(0, 0, w, h);
  const data = imageData.data;

  // Compare left edge vs right edge
  let hDiffTotal = 0;
  let hPixels = 0;
  // Compare left column vs right column (pixel-by-pixel wrap test)
  for (let y = 0; y < h; y++) {
    const leftIdx = (y * w + 0) * 4;
    const rightIdx = (y * w + (w - 1)) * 4;

    const dr = Math.abs(data[leftIdx] - data[rightIdx]);
    const dg = Math.abs(data[leftIdx + 1] - data[rightIdx + 1]);
    const db = Math.abs(data[leftIdx + 2] - data[rightIdx + 2]);
    hDiffTotal += (dr + dg + db) / 3;
    hPixels++;
  }

  // Compare top row vs bottom row
  let vDiffTotal = 0;
  let vPixels = 0;

  for (let x = 0; x < w; x++) {
    const topIdx = (0 * w + x) * 4;
    const bottomIdx = ((h - 1) * w + x) * 4;

    const dr = Math.abs(data[topIdx] - data[bottomIdx]);
    const dg = Math.abs(data[topIdx + 1] - data[bottomIdx + 1]);
    const db = Math.abs(data[topIdx + 2] - data[bottomIdx + 2]);
    vDiffTotal += (dr + dg + db) / 3;
    vPixels++;
  }

  const hAvgDiff = hPixels > 0 ? hDiffTotal / hPixels : 255;
  const vAvgDiff = vPixels > 0 ? vDiffTotal / vPixels : 255;

  // Convert average pixel difference (0-255) to a score (0-100)
  // Typical seamless patterns have avg diff < 5, bad ones > 30
  // Use a curve: score = 100 * e^(-diff/20)
  const horizontalScore = Math.round(100 * Math.exp(-hAvgDiff / 20));
  const verticalScore = Math.round(100 * Math.exp(-vAvgDiff / 20));
  const score = Math.round((horizontalScore + verticalScore) / 2);

  let verdict: SeamlessResult["verdict"];
  let message: string;

  if (score >= 90) {
    verdict = "seamless";
    message = "This pattern tiles seamlessly. Edges match beautifully.";
  } else if (score >= 70) {
    verdict = "good";
    message = "Good tiling with minor edge differences. Should look great at normal viewing distances.";
  } else if (score >= 50) {
    verdict = "fair";
    message = "Some visible seams may appear when tiled. Consider regenerating or adjusting scale.";
  } else {
    verdict = "poor";
    message = "Noticeable seams will be visible when tiled. Try regenerating with a different description.";
  }

  return { score, horizontalScore, verticalScore, verdict, message };
}

export default function SeamlessChecker({ patternImage, scale, rotation }: Props) {
  const [isChecking, setIsChecking] = useState(false);
  const [result, setResult] = useState<SeamlessResult | null>(null);
  const [showTilePreview, setShowTilePreview] = useState(false);
  const tileCanvasRef = useRef<HTMLCanvasElement>(null);

  const runCheck = useCallback(() => {
    if (!patternImage) return;
    setIsChecking(true);
    setResult(null);
    setShowTilePreview(false);

    // Use requestAnimationFrame to avoid blocking UI
    requestAnimationFrame(() => {
      const sf = scale / 100;
      const tileW = Math.round(patternImage.width * sf);
      const tileH = Math.round(patternImage.height * sf);
      if (tileW < 1 || tileH < 1) { setIsChecking(false); return; }

      // Build the actual tile as it would appear when downloaded
      const singleTile = document.createElement("canvas");
      singleTile.width = tileW;
      singleTile.height = tileH;
      const stCtx = singleTile.getContext("2d");
      if (!stCtx) { setIsChecking(false); return; }

      if (rotation !== 0) {
        stCtx.translate(tileW / 2, tileH / 2);
        stCtx.rotate((rotation * Math.PI) / 180);
        stCtx.translate(-tileW / 2, -tileH / 2);
        // Draw larger to cover rotated area, then the canvas clips
        const extra = Math.ceil(Math.max(tileW, tileH) * 0.5);
        for (let y = -tileH - extra; y < tileH + extra; y += tileH) {
          for (let x = -tileW - extra; x < tileW + extra; x += tileW) {
            stCtx.drawImage(patternImage, x, y, tileW, tileH);
          }
        }
      } else {
        stCtx.drawImage(patternImage, 0, 0, tileW, tileH);
      }

      // Analyze the tile exactly as it will be tiled
      const analysisResult = analyzeSeamlessness(singleTile);
      setResult(analysisResult);

      setIsChecking(false);
      setShowTilePreview(true);
    });
  }, [patternImage, scale, rotation]);

  // Draw 3x3 tiled preview
  useEffect(() => {
    if (!showTilePreview || !patternImage || !tileCanvasRef.current) return;
    const canvas = tileCanvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const previewSize = 420;
    const sf = scale / 100;
    const tileW = Math.round(patternImage.width * sf);
    const tileH = Math.round(patternImage.height * sf);
    if (tileW < 1 || tileH < 1) return;

    // First, build one tile with rotation baked in
    const tileCanvas = document.createElement("canvas");
    tileCanvas.width = tileW;
    tileCanvas.height = tileH;
    const tileCtx = tileCanvas.getContext("2d");
    if (!tileCtx) return;

    if (rotation !== 0) {
      tileCtx.translate(tileW / 2, tileH / 2);
      tileCtx.rotate((rotation * Math.PI) / 180);
      tileCtx.translate(-tileW / 2, -tileH / 2);
      const extra = Math.ceil(Math.max(tileW, tileH) * 0.5);
      for (let y = -tileH - extra; y < tileH + extra; y += tileH) {
        for (let x = -tileW - extra; x < tileW + extra; x += tileW) {
          tileCtx.drawImage(patternImage, x, y, tileW, tileH);
        }
      }
    } else {
      tileCtx.drawImage(patternImage, 0, 0, tileW, tileH);
    }

    // Scale tiles to fit 3x3 in the preview
    const gridScale = Math.min(previewSize / (tileW * 3), previewSize / (tileH * 3));
    const drawW = tileW * gridScale;
    const drawH = tileH * gridScale;
    const totalW = Math.round(drawW * 3);
    const totalH = Math.round(drawH * 3);

    canvas.width = totalW;
    canvas.height = totalH;
    canvas.style.width = `${totalW}px`;
    canvas.style.height = `${totalH}px`;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, totalW, totalH);

    // Draw 3x3 grid using the pre-rendered tile
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        ctx.drawImage(tileCanvas, col * drawW, row * drawH, drawW, drawH);
      }
    }

    // Draw subtle grid lines to highlight seams
    ctx.strokeStyle = "rgba(255, 0, 0, 0.25)";
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    for (let i = 1; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(Math.round(drawW * i), 0);
      ctx.lineTo(Math.round(drawW * i), totalH);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, Math.round(drawH * i));
      ctx.lineTo(totalW, Math.round(drawH * i));
      ctx.stroke();
    }
  }, [showTilePreview, patternImage, scale, rotation]);

  if (!patternImage) return null;

  const getScoreColor = (score: number) => {
    if (score >= 90) return "#16a34a";
    if (score >= 70) return "#ca8a04";
    if (score >= 50) return "#ea580c";
    return "#dc2626";
  };

  const getVerdictLabel = (verdict: string) => {
    switch (verdict) {
      case "seamless": return "SEAMLESS";
      case "good": return "GOOD";
      case "fair": return "FAIR";
      case "poor": return "POOR";
      default: return "UNKNOWN";
    }
  };

  return (
    <div style={{ marginBottom: 36 }}>
      <button
        onClick={runCheck}
        disabled={isChecking}
        style={{
          width: "100%",
          padding: "14px 20px",
          border: "2px solid var(--accent)",
          background: isChecking ? "var(--bg-card)" : "transparent",
          color: isChecking ? "var(--text-muted)" : "var(--accent)",
          fontSize: 13,
          fontWeight: 700,
          letterSpacing: "0.12em",
          cursor: isChecking ? "not-allowed" : "pointer",
          textTransform: "uppercase",
          transition: "all 0.15s",
          opacity: isChecking ? 0.6 : 1,
        }}
      >
        {isChecking ? "CHECKING SEAMLESSNESS..." : "CHECK SEAMLESSNESS"}
      </button>

      {result && (
        <div style={{
          marginTop: 16,
          border: "1px solid var(--border)",
          background: "#ffffff",
          overflow: "hidden",
        }}>
          {/* Score header */}
          <div style={{
            padding: "20px 24px",
            display: "flex",
            alignItems: "center",
            gap: 20,
            borderBottom: showTilePreview ? "1px solid var(--border)" : "none",
          }}>
            {/* Score circle */}
            <div style={{
              width: 72,
              height: 72,
              borderRadius: "50%",
              border: `4px solid ${getScoreColor(result.score)}`,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}>
              <span style={{
                fontSize: 24,
                fontWeight: 700,
                color: getScoreColor(result.score),
                lineHeight: 1,
                fontFamily: "'Cormorant Garamond', Georgia, serif",
              }}>
                {result.score}
              </span>
              <span style={{
                fontSize: 9,
                color: "var(--text-muted)",
                letterSpacing: "0.05em",
              }}>
                /100
              </span>
            </div>

            {/* Details */}
            <div style={{ flex: 1 }}>
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 6,
              }}>
                <span style={{
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  color: getScoreColor(result.score),
                  textTransform: "uppercase",
                  padding: "3px 10px",
                  background: `${getScoreColor(result.score)}15`,
                  borderRadius: 3,
                }}>
                  {getVerdictLabel(result.verdict)}
                </span>
              </div>
              <p style={{
                fontSize: 13,
                color: "var(--text-secondary)",
                lineHeight: 1.5,
                marginBottom: 8,
              }}>
                {result.message}
              </p>
              <div style={{
                display: "flex",
                gap: 20,
                fontSize: 11,
                color: "var(--text-muted)",
              }}>
                <span>
                  Horizontal: <strong style={{ color: getScoreColor(result.horizontalScore) }}>
                    {result.horizontalScore}%
                  </strong>
                </span>
                <span>
                  Vertical: <strong style={{ color: getScoreColor(result.verticalScore) }}>
                    {result.verticalScore}%
                  </strong>
                </span>
              </div>
            </div>
          </div>

          {/* 3x3 tile preview */}
          {showTilePreview && (
            <div style={{
              padding: 24,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}>
              <p style={{
                fontSize: 10,
                fontWeight: 500,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "var(--text-muted)",
                marginBottom: 14,
              }}>
                3 &times; 3 Tile Preview — Red lines show seam locations
              </p>
              <div style={{
                background: "var(--bg-secondary)",
                padding: 12,
                display: "inline-block",
              }}>
                <canvas ref={tileCanvasRef} />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
