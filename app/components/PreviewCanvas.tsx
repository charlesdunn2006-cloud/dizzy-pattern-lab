"use client";

import { useRef, useEffect, useCallback } from "react";
import { ProductTemplate, inchesToPixels } from "../types";

interface Props {
  patternImage: HTMLImageElement | null;
  template: ProductTemplate | null;
  scale: number; rotation: number;
  offsetX: number; offsetY: number;
  onOffsetChange: (x: number, y: number) => void;
}

const PREVIEW_MAX_WIDTH = 580;

export default function PreviewCanvas({ patternImage, template, scale, rotation, offsetX, offsetY, onOffsetChange }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const offsetStart = useRef({ x: 0, y: 0 });

  const drawPreview = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !patternImage || !template) return;
    const ctx = canvas.getContext("2d"); if (!ctx) return;

    const targetW = inchesToPixels(template.widthInches);
    const targetH = inchesToPixels(template.heightInches);
    const previewScale = Math.min(PREVIEW_MAX_WIDTH / targetW, 380 / targetH, 1);
    const canvasW = Math.round(targetW * previewScale);
    const canvasH = Math.round(targetH * previewScale);
    canvas.width = canvasW; canvas.height = canvasH;
    canvas.style.width = `${canvasW}px`; canvas.style.height = `${canvasH}px`;

    // Light checkerboard
    ctx.fillStyle = "#f5f4f2";
    ctx.fillRect(0, 0, canvasW, canvasH);
    const cs = 8;
    for (let y = 0; y < canvasH; y += cs) {
      for (let x = 0; x < canvasW; x += cs) {
        ctx.fillStyle = ((x / cs + y / cs) % 2) === 0 ? "#f0efed" : "#e8e7e4";
        ctx.fillRect(x, y, cs, cs);
      }
    }

    const sf = scale / 100;
    const tileW = patternImage.width * sf * previewScale;
    const tileH = patternImage.height * sf * previewScale;
    if (tileW < 1 || tileH < 1) return;

    ctx.save();
    if (rotation !== 0) { ctx.translate(canvasW/2, canvasH/2); ctx.rotate((rotation*Math.PI)/180); ctx.translate(-canvasW/2, -canvasH/2); }
    const ox = (offsetX * previewScale) % tileW;
    const oy = (offsetY * previewScale) % tileH;
    const extra = rotation !== 0 ? Math.ceil(Math.max(canvasW, canvasH) * 0.5) : 0;
    for (let y = -tileH - extra + oy; y < canvasH + extra; y += tileH)
      for (let x = -tileW - extra + ox; x < canvasW + extra; x += tileW)
        ctx.drawImage(patternImage, x, y, tileW, tileH);
    ctx.restore();
  }, [patternImage, template, scale, rotation, offsetX, offsetY]);

  useEffect(() => { drawPreview(); }, [drawPreview]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    isDragging.current = true; dragStart.current = { x: e.clientX, y: e.clientY };
    offsetStart.current = { x: offsetX, y: offsetY }; e.preventDefault();
  }, [offsetX, offsetY]);
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging.current) return;
    onOffsetChange(offsetStart.current.x + e.clientX - dragStart.current.x, offsetStart.current.y + e.clientY - dragStart.current.y);
  }, [onOffsetChange]);
  const handleMouseUp = useCallback(() => { isDragging.current = false; }, []);
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const t = e.touches[0]; isDragging.current = true;
    dragStart.current = { x: t.clientX, y: t.clientY }; offsetStart.current = { x: offsetX, y: offsetY };
  }, [offsetX, offsetY]);
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging.current) return; const t = e.touches[0];
    onOffsetChange(offsetStart.current.x + t.clientX - dragStart.current.x, offsetStart.current.y + t.clientY - dragStart.current.y);
  }, [onOffsetChange]);

  if (!patternImage || !template) {
    return (
      <div style={{
        padding: "64px 20px", textAlign: "center", marginBottom: 36,
        background: "var(--bg-secondary)", color: "var(--text-muted)", fontSize: 14,
        fontStyle: "italic",
      }}>
        Upload a pattern and select a product to see your preview here
      </div>
    );
  }

  return (
    <div style={{ marginBottom: 36 }}>
      <div
        onMouseDown={handleMouseDown} onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleMouseUp}
        style={{
          background: "var(--bg-secondary)", padding: 24,
          display: "flex", flexDirection: "column", alignItems: "center",
          cursor: "grab", userSelect: "none",
        }}>
        <canvas ref={canvasRef} />
      </div>
      <div style={{ textAlign: "center", marginTop: 12 }}>
        <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 2 }}>
          Preview is low resolution for speed — your downloaded file will be full quality.
        </p>
        <p style={{ fontSize: 12, color: "var(--text-muted)" }}>
          Drag to pan &bull; {inchesToPixels(template.widthInches)} &times; {inchesToPixels(template.heightInches)} px @ 300dpi
        </p>
      </div>
    </div>
  );
}
