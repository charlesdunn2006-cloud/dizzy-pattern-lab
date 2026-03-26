"use client";

import { useCallback, useState } from "react";
import { ProductTemplate, inchesToPixels } from "../types";

interface Props {
  patternImage: HTMLImageElement | null;
  template: ProductTemplate | null;
  scale: number; rotation: number;
  offsetX: number; offsetY: number;
  fileName: string; onFileNameChange: (name: string) => void;
}

type DownloadFormat = "png" | "svg-vector" | "svg-embedded";

// Trace a raster image to SVG vector paths using color quantization + path generation
function traceImageToSVG(
  canvas: HTMLCanvasElement,
  numColors: number = 32
): string {
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";
  const w = canvas.width;
  const h = canvas.height;
  const imageData = ctx.getImageData(0, 0, w, h);
  const data = imageData.data;

  // Step 1: Color quantization using median cut approximation
  const colorMap = new Map<string, number[][]>();

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 4;
      const r = Math.round(data[idx] / (256 / Math.ceil(Math.sqrt(numColors)))) * Math.floor(256 / Math.ceil(Math.sqrt(numColors)));
      const g = Math.round(data[idx + 1] / (256 / Math.ceil(Math.sqrt(numColors)))) * Math.floor(256 / Math.ceil(Math.sqrt(numColors)));
      const b = Math.round(data[idx + 2] / (256 / Math.ceil(Math.sqrt(numColors)))) * Math.floor(256 / Math.ceil(Math.sqrt(numColors)));
      const key = `${r},${g},${b}`;
      if (!colorMap.has(key)) colorMap.set(key, []);
      colorMap.get(key)!.push([x, y]);
    }
  }

  // Step 2: Generate SVG with rect elements for each color region
  // Using small rectangles for each pixel group (scanline approach)
  let svgPaths = "";

  colorMap.forEach((pixels, colorKey) => {
    const [r, g, b] = colorKey.split(",").map(Number);
    const color = `rgb(${r},${g},${b})`;

    // Group consecutive horizontal pixels into rectangles for efficiency
    // Sort by y then x
    pixels.sort((a, c) => a[1] - c[1] || a[0] - c[0]);

    let i = 0;
    while (i < pixels.length) {
      const startX = pixels[i][0];
      const y = pixels[i][1];
      let endX = startX;

      // Extend rectangle horizontally
      while (
        i + 1 < pixels.length &&
        pixels[i + 1][1] === y &&
        pixels[i + 1][0] === endX + 1
      ) {
        endX = pixels[i + 1][0];
        i++;
      }

      const rectW = endX - startX + 1;
      svgPaths += `<rect x="${startX}" y="${y}" width="${rectW}" height="1" fill="${color}"/>`;
      i++;
    }
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">
<title>Dizzy with Excitement - AI Generated Pattern</title>
${svgPaths}
</svg>`;
}

// Create SVG with embedded raster image (higher quality, still scalable container)
function createEmbeddedSVG(canvas: HTMLCanvasElement): string {
  const w = canvas.width;
  const h = canvas.height;
  const dataUrl = canvas.toDataURL("image/png");

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
  viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">
<title>Dizzy with Excitement - AI Generated Pattern</title>
<defs>
  <pattern id="tile" x="0" y="0" width="${w}" height="${h}" patternUnits="userSpaceOnUse">
    <image href="${dataUrl}" x="0" y="0" width="${w}" height="${h}"/>
  </pattern>
</defs>
<rect width="100%" height="100%" fill="url(#tile)"/>
</svg>`;
}

export default function DownloadSection({ patternImage, template, scale, rotation, offsetX, offsetY, fileName, onFileNameChange }: Props) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeFormat, setActiveFormat] = useState<DownloadFormat | null>(null);

  const buildCanvas = useCallback((): HTMLCanvasElement | null => {
    if (!patternImage) return null;
    let targetW: number, targetH: number;
    if (template) {
      targetW = inchesToPixels(template.widthInches);
      targetH = inchesToPixels(template.heightInches);
    } else {
      targetW = patternImage.width;
      targetH = patternImage.height;
    }
    const canvas = document.createElement("canvas");
    canvas.width = targetW; canvas.height = targetH;
    const ctx = canvas.getContext("2d"); if (!ctx) return null;
    ctx.clearRect(0, 0, targetW, targetH);
    const sf = scale / 100;
    const tileW = patternImage.width * sf; const tileH = patternImage.height * sf;
    if (tileW < 1 || tileH < 1) return null;
    ctx.save();
    if (rotation !== 0) { ctx.translate(targetW/2,targetH/2); ctx.rotate((rotation*Math.PI)/180); ctx.translate(-targetW/2,-targetH/2); }
    const previewScale = template
      ? Math.min(580 / inchesToPixels(template.widthInches), 380 / inchesToPixels(template.heightInches), 1)
      : Math.min(580 / patternImage.width, 580 / patternImage.height, 1);
    const frs = targetW / (targetW * previewScale);
    const ox = (offsetX*frs)%tileW; const oy = (offsetY*frs)%tileH;
    const extra = rotation !== 0 ? Math.ceil(Math.max(targetW,targetH)*0.5) : 0;
    for (let y = -tileH-extra+oy; y < targetH+extra; y += tileH)
      for (let x = -tileW-extra+ox; x < targetW+extra; x += tileW)
        ctx.drawImage(patternImage, x, y, tileW, tileH);
    ctx.restore();
    return canvas;
  }, [patternImage, template, scale, rotation, offsetX, offsetY]);

  const triggerDownload = useCallback((blob: Blob, name: string) => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    if (isIOS) {
      window.open(URL.createObjectURL(blob), "_blank");
    } else {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = name; a.click();
      URL.revokeObjectURL(url);
    }
  }, []);

  const handleDownloadPNG = useCallback(() => {
    if (!patternImage) return;
    setIsGenerating(true);
    setActiveFormat("png");
    requestAnimationFrame(() => {
      try {
        const canvas = buildCanvas();
        if (!canvas) { setIsGenerating(false); return; }
        const finalName = (fileName.trim() || "pattern") + ".png";
        canvas.toBlob((blob) => {
          if (blob) triggerDownload(blob, finalName);
          setIsGenerating(false);
          setActiveFormat(null);
        }, "image/png");
      } catch { setIsGenerating(false); setActiveFormat(null); alert("Error generating PNG."); }
    });
  }, [patternImage, buildCanvas, fileName, triggerDownload]);

  const handleDownloadSVGVector = useCallback(() => {
    if (!patternImage) return;
    setIsGenerating(true);
    setActiveFormat("svg-vector");
    // Use setTimeout to let UI update before heavy processing
    setTimeout(() => {
      try {
        const canvas = buildCanvas();
        if (!canvas) { setIsGenerating(false); return; }
        const svgString = traceImageToSVG(canvas, 24);
        const blob = new Blob([svgString], { type: "image/svg+xml" });
        const finalName = (fileName.trim() || "pattern") + "_vector.svg";
        triggerDownload(blob, finalName);
        setIsGenerating(false);
        setActiveFormat(null);
      } catch { setIsGenerating(false); setActiveFormat(null); alert("Error generating vector SVG."); }
    }, 100);
  }, [patternImage, buildCanvas, fileName, triggerDownload]);

  const handleDownloadSVGEmbedded = useCallback(() => {
    if (!patternImage) return;
    setIsGenerating(true);
    setActiveFormat("svg-embedded");
    requestAnimationFrame(() => {
      try {
        const canvas = buildCanvas();
        if (!canvas) { setIsGenerating(false); return; }
        const svgString = createEmbeddedSVG(canvas);
        const blob = new Blob([svgString], { type: "image/svg+xml" });
        const finalName = (fileName.trim() || "pattern") + ".svg";
        triggerDownload(blob, finalName);
        setIsGenerating(false);
        setActiveFormat(null);
      } catch { setIsGenerating(false); setActiveFormat(null); alert("Error generating SVG."); }
    });
  }, [patternImage, buildCanvas, fileName, triggerDownload]);

  const disabled = !patternImage;

  const buttonStyle = (fmt: DownloadFormat, primary: boolean): React.CSSProperties => ({
    flex: 1,
    padding: "16px 12px",
    border: primary ? "none" : "2px solid var(--accent)",
    background: disabled || (isGenerating && activeFormat === fmt)
      ? "var(--bg-card)"
      : primary ? "var(--accent)" : "transparent",
    color: disabled || (isGenerating && activeFormat === fmt)
      ? "var(--text-muted)"
      : primary ? "#fff" : "var(--accent)",
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: "0.1em",
    cursor: disabled || isGenerating ? "not-allowed" : "pointer",
    textTransform: "uppercase" as const,
    transition: "all 0.15s",
    opacity: isGenerating && activeFormat !== fmt ? 0.5 : 1,
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    gap: 4,
  });

  return (
    <div style={{ marginBottom: 36 }}>
      {/* File name */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
        <label style={{ fontSize: 13, color: "var(--text-secondary)", fontWeight: 500, whiteSpace: "nowrap" }}>File name</label>
        <input type="text" value={fileName} onChange={(e) => onFileNameChange(e.target.value)}
          placeholder="e.g. tropical_leaves_24x24"
          style={{
            flex: 1, padding: "10px 14px", border: "1px solid var(--border)",
            background: "var(--bg-primary)", color: "var(--text-primary)", fontSize: 14, outline: "none",
          }} />
      </div>

      {/* Download buttons */}
      <div style={{ display: "flex", gap: 10, marginBottom: 8 }}>
        <button onClick={handleDownloadSVGVector} disabled={disabled || isGenerating}
          style={buttonStyle("svg-vector", true)}>
          <span style={{ fontSize: 13 }}>
            {isGenerating && activeFormat === "svg-vector" ? "TRACING..." : "DOWNLOAD SVG"}
          </span>
          <span style={{ fontSize: 10, fontWeight: 500, opacity: 0.8, letterSpacing: "0.06em" }}>
            Vector Paths — Infinitely Scalable
          </span>
        </button>

        <button onClick={handleDownloadPNG} disabled={disabled || isGenerating}
          style={buttonStyle("png", false)}>
          <span style={{ fontSize: 13 }}>
            {isGenerating && activeFormat === "png" ? "GENERATING..." : "DOWNLOAD PNG"}
          </span>
          <span style={{ fontSize: 10, fontWeight: 500, opacity: 0.7, letterSpacing: "0.06em" }}>
            Full Resolution Raster
          </span>
        </button>

        <button onClick={handleDownloadSVGEmbedded} disabled={disabled || isGenerating}
          style={buttonStyle("svg-embedded", false)}>
          <span style={{ fontSize: 13 }}>
            {isGenerating && activeFormat === "svg-embedded" ? "GENERATING..." : "DOWNLOAD SVG"}
          </span>
          <span style={{ fontSize: 10, fontWeight: 500, opacity: 0.7, letterSpacing: "0.06em" }}>
            Embedded Raster + Tile Pattern
          </span>
        </button>
      </div>

      <div style={{ textAlign: "center", marginTop: 12 }}>
        <p style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.6 }}>
          <strong>SVG Vector</strong> traces the image to scalable vector paths — best for graphic patterns.
          <strong> PNG</strong> keeps full raster detail.
          <strong> SVG Embedded</strong> wraps the raster in an SVG with tiling pattern defined.
        </p>
        <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
          iPad or iPhone? Your file will open in a new tab — tap and hold, then &quot;Save to Photos.&quot;
        </p>
      </div>
    </div>
  );
}
