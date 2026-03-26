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

export default function DownloadSection({ patternImage, template, scale, rotation, offsetX, offsetY, fileName, onFileNameChange }: Props) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDownload = useCallback(() => {
    if (!patternImage) return;
    setIsGenerating(true);
    requestAnimationFrame(() => {
      try {
        let targetW: number, targetH: number;
        if (template) {
          targetW = inchesToPixels(template.widthInches);
          targetH = inchesToPixels(template.heightInches);
        } else {
          // Download at original resolution (the AI-generated image as-is)
          targetW = patternImage.width;
          targetH = patternImage.height;
        }
        const canvas = document.createElement("canvas");
        canvas.width = targetW; canvas.height = targetH;
        const ctx = canvas.getContext("2d"); if (!ctx) { setIsGenerating(false); return; }
        ctx.clearRect(0, 0, targetW, targetH);
        const sf = scale / 100;
        const tileW = patternImage.width * sf; const tileH = patternImage.height * sf;
        if (tileW < 1 || tileH < 1) { setIsGenerating(false); return; }
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
        const finalName = (fileName.trim() || "pattern") + ".png";
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
        canvas.toBlob((blob) => {
          if (blob) {
            if (isIOS) { window.open(URL.createObjectURL(blob), "_blank"); }
            else { const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = finalName; a.click(); URL.revokeObjectURL(url); }
          }
          setIsGenerating(false);
        }, "image/png");
      } catch { setIsGenerating(false); alert("Error generating file."); }
    });
  }, [patternImage, template, scale, rotation, offsetX, offsetY, fileName]);

  const disabled = !patternImage;

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
        <span style={{ fontSize: 13, color: "var(--text-muted)", padding: "10px 14px", background: "var(--bg-secondary)", border: "1px solid var(--border)" }}>.png</span>
      </div>

      {/* Download button */}
      <button onClick={handleDownload} disabled={disabled || isGenerating}
        style={{
          width: "100%", padding: "16px 20px", border: "none",
          background: disabled || isGenerating ? "var(--bg-card)" : "var(--accent)",
          color: disabled || isGenerating ? "var(--text-muted)" : "#fff",
          fontSize: 13, fontWeight: 500, letterSpacing: "0.12em",
          cursor: disabled || isGenerating ? "not-allowed" : "pointer",
          textTransform: "uppercase", transition: "opacity 0.15s",
          opacity: isGenerating ? 0.6 : 1,
        }}>
        {isGenerating ? "GENERATING..." : "DOWNLOAD FULL-SIZE FILE"}
      </button>

      <div style={{ textAlign: "center", marginTop: 12 }}>
        <p style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.6 }}>
          Downloads instantly as PNG at full resolution.
        </p>
        <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
          iPad or iPhone? Your file will open in a new tab — tap and hold, then &quot;Save to Photos.&quot;
        </p>
      </div>
    </div>
  );
}
