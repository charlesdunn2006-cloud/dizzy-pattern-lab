"use client";

import { useRef, useEffect, useCallback, useState } from "react";

interface Props {
  patternImage: HTMLImageElement;
  wallWidthFeet: number;
  wallHeightFeet: number;
  scale: number;
  rotation: number;
  onClose: () => void;
}

export default function WallPreviewModal({
  patternImage,
  wallWidthFeet,
  wallHeightFeet,
  scale,
  rotation,
  onClose,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [canvasSize, setCanvasSize] = useState({ w: 0, h: 0 });

  // Calculate canvas dimensions to fit the modal while keeping wall aspect ratio
  const drawWall = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Modal max area (leave room for furniture at bottom)
    const maxW = Math.min(window.innerWidth - 80, 900);
    const maxH = Math.min(window.innerHeight - 220, 600);

    // Wall aspect ratio
    const wallAspect = wallWidthFeet / wallHeightFeet;
    let canvasW: number, canvasH: number;
    if (wallAspect > maxW / maxH) {
      canvasW = maxW;
      canvasH = Math.round(maxW / wallAspect);
    } else {
      canvasH = maxH;
      canvasW = Math.round(maxH * wallAspect);
    }

    canvas.width = canvasW;
    canvas.height = canvasH;
    setCanvasSize({ w: canvasW, h: canvasH });

    // Fill background
    ctx.fillStyle = "#f5f4f2";
    ctx.fillRect(0, 0, canvasW, canvasH);

    // Tile the pattern across the wall
    // Each tile represents ~2ft of wall (24" standard tile)
    const tileSizeFeet = 2; // 24" tiles
    const sf = scale / 100;
    const tilesAcross = wallWidthFeet / tileSizeFeet;
    const tilesDown = wallHeightFeet / tileSizeFeet;
    const tileW = (canvasW / tilesAcross) * sf;
    const tileH = (canvasH / tilesDown) * sf;

    if (tileW < 1 || tileH < 1) return;

    ctx.save();
    if (rotation !== 0) {
      ctx.translate(canvasW / 2, canvasH / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.translate(-canvasW / 2, -canvasH / 2);
    }

    const extra = rotation !== 0 ? Math.ceil(Math.max(canvasW, canvasH) * 0.5) : 0;
    for (let y = -tileH - extra; y < canvasH + extra; y += tileH) {
      for (let x = -tileW - extra; x < canvasW + extra; x += tileW) {
        ctx.drawImage(patternImage, x, y, tileW, tileH);
      }
    }
    ctx.restore();

    // Subtle wall border/shadow
    ctx.strokeStyle = "rgba(0,0,0,0.15)";
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, canvasW, canvasH);
  }, [patternImage, wallWidthFeet, wallHeightFeet, scale, rotation]);

  useEffect(() => {
    drawWall();
  }, [drawWall]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(0,0,0,0.7)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#f0ede6",
          maxWidth: 960,
          width: "100%",
          maxHeight: "90vh",
          overflow: "auto",
          position: "relative",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: 12,
            right: 16,
            background: "none",
            border: "none",
            fontSize: 24,
            color: "var(--text-muted)",
            cursor: "pointer",
            zIndex: 10,
            lineHeight: 1,
          }}
        >
          &times;
        </button>

        {/* Title */}
        <div style={{ padding: "20px 24px 12px", textAlign: "center", width: "100%" }}>
          <p
            style={{
              fontSize: 10,
              fontWeight: 500,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "var(--text-muted)",
              marginBottom: 6,
            }}
          >
            Wall Preview
          </p>
          <p
            style={{
              fontSize: 14,
              color: "var(--text-secondary)",
            }}
          >
            {wallWidthFeet}&prime; &times; {wallHeightFeet}&prime; wall
          </p>
        </div>

        {/* Wall + room scene */}
        <div
          style={{
            position: "relative",
            padding: "0 32px 0",
            width: "100%",
            display: "flex",
            justifyContent: "center",
          }}
        >
          {/* Shadow behind wall */}
          <div
            style={{
              position: "relative",
              boxShadow: "0 4px 24px rgba(0,0,0,0.15)",
            }}
          >
            <canvas ref={canvasRef} style={{ display: "block" }} />
          </div>
        </div>

        {/* Furniture silhouettes */}
        <div
          style={{
            width: canvasSize.w || "100%",
            maxWidth: canvasSize.w || 900,
            margin: "0 auto",
            position: "relative",
            height: 90,
          }}
        >
          {/* Floor line */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: 2,
              background: "rgba(0,0,0,0.08)",
            }}
          />

          {/* Couch - centered */}
          <svg
            viewBox="0 0 300 70"
            style={{
              position: "absolute",
              bottom: 4,
              left: "50%",
              transform: "translateX(-50%)",
              width: Math.min(canvasSize.w * 0.55, 340),
              opacity: 0.12,
            }}
          >
            {/* Couch body */}
            <rect x="20" y="15" width="260" height="35" rx="4" fill="#1a1a1a" />
            {/* Couch back */}
            <rect x="25" y="0" width="250" height="20" rx="6" fill="#1a1a1a" />
            {/* Left arm */}
            <rect x="0" y="5" width="28" height="45" rx="6" fill="#1a1a1a" />
            {/* Right arm */}
            <rect x="272" y="5" width="28" height="45" rx="6" fill="#1a1a1a" />
            {/* Legs */}
            <rect x="30" y="50" width="6" height="14" rx="2" fill="#1a1a1a" />
            <rect x="264" y="50" width="6" height="14" rx="2" fill="#1a1a1a" />
            {/* Cushion lines */}
            <line x1="120" y1="18" x2="120" y2="46" stroke="#f0ede6" strokeWidth="1.5" />
            <line x1="180" y1="18" x2="180" y2="46" stroke="#f0ede6" strokeWidth="1.5" />
          </svg>

          {/* Side table - left */}
          <svg
            viewBox="0 0 40 55"
            style={{
              position: "absolute",
              bottom: 4,
              left: Math.max(16, (canvasSize.w * 0.5 - Math.min(canvasSize.w * 0.55, 340) * 0.5) - 56),
              width: 36,
              opacity: 0.1,
            }}
          >
            <rect x="2" y="0" width="36" height="4" rx="2" fill="#1a1a1a" />
            <rect x="8" y="4" width="4" height="42" fill="#1a1a1a" />
            <rect x="28" y="4" width="4" height="42" fill="#1a1a1a" />
            {/* Lamp on table */}
            <ellipse cx="20" cy="0" rx="8" ry="3" fill="#1a1a1a" />
            <rect x="18" y="-20" width="4" height="20" fill="#1a1a1a" />
            <polygon points="8,-36 32,-36 26,-20 14,-20" fill="#1a1a1a" />
          </svg>

          {/* Plant - right */}
          <svg
            viewBox="0 0 40 60"
            style={{
              position: "absolute",
              bottom: 4,
              right: Math.max(16, (canvasSize.w * 0.5 - Math.min(canvasSize.w * 0.55, 340) * 0.5) - 56),
              width: 34,
              opacity: 0.1,
            }}
          >
            {/* Pot */}
            <polygon points="8,35 32,35 28,55 12,55" fill="#1a1a1a" />
            <rect x="6" y="32" width="28" height="5" rx="2" fill="#1a1a1a" />
            {/* Leaves */}
            <ellipse cx="20" cy="18" rx="14" ry="16" fill="#1a1a1a" />
            <ellipse cx="12" cy="10" rx="8" ry="12" fill="#1a1a1a" />
            <ellipse cx="28" cy="12" rx="8" ry="11" fill="#1a1a1a" />
          </svg>
        </div>

        {/* Floor area */}
        <div
          style={{
            width: "100%",
            height: 20,
            background: "linear-gradient(to bottom, #e8e4dc, #f0ede6)",
          }}
        />
      </div>
    </div>
  );
}
