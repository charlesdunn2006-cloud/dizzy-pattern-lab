"use client";

import { useRef, useEffect } from "react";
import { TrendingPattern } from "./data";

interface Props {
  pattern: TrendingPattern;
  width?: number;
  height?: number;
}

export default function PatternPreview({ pattern, width = 280, height = 200 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width = width * 2; // retina
    canvas.height = height * 2;
    ctx.scale(2, 2);

    const c = pattern.colors;
    const id = pattern.id;

    // Fill background
    ctx.fillStyle = c[c.length - 1] || c[0];
    ctx.fillRect(0, 0, width, height);

    // Draw pattern based on style
    if (id === "art-deco-revival") {
      drawArtDeco(ctx, width, height, c);
    } else if (id === "japanese-wave") {
      drawWaves(ctx, width, height, c);
    } else if (id === "moroccan-tile") {
      drawMoroccan(ctx, width, height, c);
    } else if (id === "mid-century-atomic") {
      drawAtomic(ctx, width, height, c);
    } else if (id === "celestial-midnight") {
      drawCelestial(ctx, width, height, c);
    } else if (id === "gothic-damask") {
      drawDamask(ctx, width, height, c);
    } else if (id === "scandinavian-folk") {
      drawFolk(ctx, width, height, c);
    } else if (id === "block-print-indigo") {
      drawBlockPrint(ctx, width, height, c);
    } else if (id === "terracotta-marble") {
      drawMarble(ctx, width, height, c);
    } else if (id === "watercolor-abstract") {
      drawWatercolor(ctx, width, height, c);
    } else {
      // Botanical / floral / generic organic pattern
      drawBotanical(ctx, width, height, c);
    }
  }, [pattern, width, height]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width, height, display: "block" }}
    />
  );
}

// --- Pattern drawing functions ---

function drawArtDeco(ctx: CanvasRenderingContext2D, w: number, h: number, c: string[]) {
  ctx.fillStyle = c[0];
  ctx.fillRect(0, 0, w, h);
  const cols = 5;
  const size = w / cols;
  for (let row = 0; row < Math.ceil(h / size) + 1; row++) {
    for (let col = 0; col < cols + 1; col++) {
      const cx = col * size;
      const cy = row * size;
      ctx.strokeStyle = c[1];
      ctx.lineWidth = 1.5;
      // Fan arcs
      for (let i = 1; i <= 4; i++) {
        ctx.beginPath();
        ctx.arc(cx, cy + size, (size / 5) * i, Math.PI * 1.25, Math.PI * 1.75);
        ctx.stroke();
      }
      // Vertical line
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx, cy + size);
      ctx.strokeStyle = c[2] || c[1];
      ctx.lineWidth = 0.5;
      ctx.stroke();
    }
  }
}

function drawWaves(ctx: CanvasRenderingContext2D, w: number, h: number, c: string[]) {
  ctx.fillStyle = c[0];
  ctx.fillRect(0, 0, w, h);
  const rows = 8;
  const waveH = h / rows;
  for (let i = 0; i < rows + 2; i++) {
    const y = i * waveH - waveH / 2;
    ctx.beginPath();
    ctx.moveTo(0, y);
    for (let x = 0; x <= w; x += 2) {
      const wave = Math.sin((x / w) * Math.PI * 4 + i * 0.5) * (waveH * 0.35);
      ctx.lineTo(x, y + wave);
    }
    ctx.strokeStyle = c[1];
    ctx.lineWidth = 2;
    ctx.stroke();
    // Inner wave
    ctx.beginPath();
    ctx.moveTo(0, y + 4);
    for (let x = 0; x <= w; x += 2) {
      const wave = Math.sin((x / w) * Math.PI * 4 + i * 0.5) * (waveH * 0.25);
      ctx.lineTo(x, y + 4 + wave);
    }
    ctx.strokeStyle = c[2] || c[1];
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  // Cherry blossoms
  for (let i = 0; i < 12; i++) {
    const bx = (i * 67 + 23) % w;
    const by = (i * 43 + 17) % h;
    drawFlower(ctx, bx, by, 4, c[2] || "#F8BBD0", 5);
  }
}

function drawMoroccan(ctx: CanvasRenderingContext2D, w: number, h: number, c: string[]) {
  ctx.fillStyle = c[1];
  ctx.fillRect(0, 0, w, h);
  const size = 40;
  const cols = Math.ceil(w / size) + 1;
  const rows = Math.ceil(h / size) + 1;
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const cx = col * size + (row % 2 ? size / 2 : 0);
      const cy = row * size;
      // Star shape
      ctx.fillStyle = (row + col) % 3 === 0 ? c[0] : (row + col) % 3 === 1 ? c[2] : c[3];
      ctx.beginPath();
      for (let p = 0; p < 8; p++) {
        const angle = (p * Math.PI * 2) / 8 - Math.PI / 2;
        const r = p % 2 === 0 ? size * 0.35 : size * 0.18;
        const px = cx + Math.cos(angle) * r;
        const py = cy + Math.sin(angle) * r;
        p === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = c[0];
      ctx.lineWidth = 0.5;
      ctx.stroke();
    }
  }
}

function drawAtomic(ctx: CanvasRenderingContext2D, w: number, h: number, c: string[]) {
  ctx.fillStyle = c[3];
  ctx.fillRect(0, 0, w, h);
  // Starbursts
  for (let i = 0; i < 8; i++) {
    const cx = (i * 97 + 30) % w;
    const cy = (i * 71 + 25) % h;
    const color = c[i % 3];
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    const rays = 8;
    const r = 18 + (i % 3) * 6;
    for (let j = 0; j < rays; j++) {
      const angle = (j * Math.PI * 2) / rays;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(angle) * r, cy + Math.sin(angle) * r);
      ctx.stroke();
    }
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(cx, cy, 3, 0, Math.PI * 2);
    ctx.fill();
  }
  // Boomerangs
  for (let i = 0; i < 6; i++) {
    const bx = (i * 83 + 60) % w;
    const by = (i * 57 + 50) % h;
    ctx.strokeStyle = c[(i + 1) % 3];
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(bx, by, 15, 0, Math.PI * 0.8);
    ctx.stroke();
  }
  // Diamonds
  for (let i = 0; i < 5; i++) {
    const dx = (i * 73 + 45) % w;
    const dy = (i * 89 + 35) % h;
    ctx.fillStyle = c[i % 3];
    ctx.save();
    ctx.translate(dx, dy);
    ctx.rotate(Math.PI / 4);
    ctx.fillRect(-5, -5, 10, 10);
    ctx.restore();
  }
}

function drawCelestial(ctx: CanvasRenderingContext2D, w: number, h: number, c: string[]) {
  ctx.fillStyle = c[0];
  ctx.fillRect(0, 0, w, h);
  // Stars
  for (let i = 0; i < 40; i++) {
    const sx = (i * 73 + 11) % w;
    const sy = (i * 47 + 19) % h;
    const size = 1 + (i % 3);
    ctx.fillStyle = c[1];
    ctx.globalAlpha = 0.4 + (i % 5) * 0.12;
    ctx.beginPath();
    ctx.arc(sx, sy, size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  // Big stars
  for (let i = 0; i < 8; i++) {
    const sx = (i * 89 + 30) % w;
    const sy = (i * 61 + 20) % h;
    drawStar(ctx, sx, sy, 5, 6, 3, c[1]);
  }
  // Crescent moon
  ctx.fillStyle = c[1];
  ctx.beginPath();
  ctx.arc(w * 0.7, h * 0.3, 20, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = c[0];
  ctx.beginPath();
  ctx.arc(w * 0.7 + 8, h * 0.3 - 3, 18, 0, Math.PI * 2);
  ctx.fill();
  // Constellations
  ctx.strokeStyle = c[2] || c[1];
  ctx.lineWidth = 0.5;
  ctx.globalAlpha = 0.5;
  const pts = [[40,60],[70,45],[90,70],[110,50],[130,65]];
  for (let i = 0; i < pts.length - 1; i++) {
    ctx.beginPath();
    ctx.moveTo(pts[i][0], pts[i][1]);
    ctx.lineTo(pts[i+1][0], pts[i+1][1]);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

function drawDamask(ctx: CanvasRenderingContext2D, w: number, h: number, c: string[]) {
  ctx.fillStyle = c[0];
  ctx.fillRect(0, 0, w, h);
  const tileW = 70;
  const tileH = 90;
  for (let row = 0; row < Math.ceil(h / tileH) + 1; row++) {
    for (let col = 0; col < Math.ceil(w / tileW) + 1; col++) {
      const cx = col * tileW + (row % 2 ? tileW / 2 : 0);
      const cy = row * tileH;
      ctx.strokeStyle = c[1];
      ctx.lineWidth = 1;
      // Ornate diamond shape
      ctx.beginPath();
      ctx.moveTo(cx, cy - 30);
      ctx.quadraticCurveTo(cx + 20, cy - 15, cx + 25, cy);
      ctx.quadraticCurveTo(cx + 20, cy + 15, cx, cy + 30);
      ctx.quadraticCurveTo(cx - 20, cy + 15, cx - 25, cy);
      ctx.quadraticCurveTo(cx - 20, cy - 15, cx, cy - 30);
      ctx.stroke();
      // Inner detail
      ctx.strokeStyle = c[2];
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(cx, cy - 18);
      ctx.quadraticCurveTo(cx + 12, cy - 8, cx + 15, cy);
      ctx.quadraticCurveTo(cx + 12, cy + 8, cx, cy + 18);
      ctx.quadraticCurveTo(cx - 12, cy + 8, cx - 15, cy);
      ctx.quadraticCurveTo(cx - 12, cy - 8, cx, cy - 18);
      ctx.stroke();
      // Center dot
      ctx.fillStyle = c[2];
      ctx.beginPath();
      ctx.arc(cx, cy, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawFolk(ctx: CanvasRenderingContext2D, w: number, h: number, c: string[]) {
  ctx.fillStyle = c[0];
  ctx.fillRect(0, 0, w, h);
  const size = 60;
  for (let row = 0; row < Math.ceil(h / size) + 1; row++) {
    for (let col = 0; col < Math.ceil(w / size) + 1; col++) {
      const cx = col * size + size / 2;
      const cy = row * size + size / 2;
      if ((row + col) % 2 === 0) {
        // Heart
        drawHeart(ctx, cx, cy, 12, c[1]);
      } else {
        // Simple flower
        drawFlower(ctx, cx, cy, 8, c[2], 6);
        ctx.fillStyle = c[1];
        ctx.beginPath();
        ctx.arc(cx, cy, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
  // Decorative borders
  for (let y = size; y < h; y += size) {
    ctx.strokeStyle = c[3];
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
    ctx.setLineDash([]);
  }
}

function drawBlockPrint(ctx: CanvasRenderingContext2D, w: number, h: number, c: string[]) {
  ctx.fillStyle = c[1];
  ctx.fillRect(0, 0, w, h);
  const size = 50;
  for (let row = 0; row < Math.ceil(h / size) + 1; row++) {
    for (let col = 0; col < Math.ceil(w / size) + 1; col++) {
      const cx = col * size + (row % 2 ? size / 2 : 0) + size / 2;
      const cy = row * size + size / 2;
      ctx.fillStyle = c[0];
      // Paisley-ish teardrop
      ctx.beginPath();
      ctx.moveTo(cx, cy - 14);
      ctx.quadraticCurveTo(cx + 12, cy - 4, cx + 8, cy + 8);
      ctx.quadraticCurveTo(cx, cy + 14, cx - 8, cy + 8);
      ctx.quadraticCurveTo(cx - 12, cy - 4, cx, cy - 14);
      ctx.fill();
      // Dot
      ctx.fillStyle = c[3] || c[1];
      ctx.beginPath();
      ctx.arc(cx, cy, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawMarble(ctx: CanvasRenderingContext2D, w: number, h: number, c: string[]) {
  ctx.fillStyle = c[3];
  ctx.fillRect(0, 0, w, h);
  // Organic swirl veins
  for (let i = 0; i < 15; i++) {
    ctx.strokeStyle = c[i % 3];
    ctx.globalAlpha = 0.3 + (i % 4) * 0.1;
    ctx.lineWidth = 1 + (i % 3);
    ctx.beginPath();
    let x = (i * 47) % w;
    let y = (i * 31) % h;
    ctx.moveTo(x, y);
    for (let j = 0; j < 8; j++) {
      const cp1x = x + (Math.sin(i + j) * 40);
      const cp1y = y + 15 + (Math.cos(i + j) * 10);
      x = (x + 30 + Math.sin(j) * 20) % (w + 40);
      y = y + 12 + Math.cos(j + i) * 8;
      ctx.quadraticCurveTo(cp1x, cp1y, x, y);
    }
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  // Gold veins
  ctx.strokeStyle = c[1];
  ctx.globalAlpha = 0.4;
  ctx.lineWidth = 0.5;
  for (let i = 0; i < 8; i++) {
    ctx.beginPath();
    let x = (i * 67) % w;
    let y = (i * 41 + 10) % h;
    ctx.moveTo(x, y);
    for (let j = 0; j < 6; j++) {
      x += 20 + Math.sin(j * i) * 15;
      y += 10 + Math.cos(j) * 12;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

function drawWatercolor(ctx: CanvasRenderingContext2D, w: number, h: number, c: string[]) {
  ctx.fillStyle = c[0];
  ctx.fillRect(0, 0, w, h);
  // Soft blobs
  for (let i = 0; i < 20; i++) {
    const cx = (i * 61 + 20) % w;
    const cy = (i * 43 + 15) % h;
    const r = 25 + (i % 4) * 15;
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    const color = c[1 + (i % 3)];
    grad.addColorStop(0, color + "60");
    grad.addColorStop(0.5, color + "30");
    grad.addColorStop(1, color + "00");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawBotanical(ctx: CanvasRenderingContext2D, w: number, h: number, c: string[]) {
  ctx.fillStyle = c[c.length - 1] || c[0];
  ctx.fillRect(0, 0, w, h);
  // Leaves
  for (let i = 0; i < 12; i++) {
    const lx = (i * 67 + 20) % w;
    const ly = (i * 53 + 15) % h;
    const angle = (i * 0.8) - 1;
    const leafColor = c[i % 2 === 0 ? 0 : 1] || c[0];
    drawLeaf(ctx, lx, ly, 20 + (i % 3) * 8, angle, leafColor);
  }
  // Small flowers
  for (let i = 0; i < 8; i++) {
    const fx = (i * 83 + 40) % w;
    const fy = (i * 47 + 30) % h;
    drawFlower(ctx, fx, fy, 6, c[2] || c[1], 5);
  }
  // Stems
  ctx.strokeStyle = c[1] || c[0];
  ctx.lineWidth = 1.5;
  ctx.globalAlpha = 0.6;
  for (let i = 0; i < 6; i++) {
    ctx.beginPath();
    let sx = (i * 71 + 10) % w;
    let sy = h;
    ctx.moveTo(sx, sy);
    for (let j = 0; j < 5; j++) {
      sx += Math.sin(j + i) * 15;
      sy -= 25;
      ctx.lineTo(sx, sy);
    }
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

// --- Helper shapes ---

function drawFlower(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string, petals: number) {
  ctx.fillStyle = color;
  for (let i = 0; i < petals; i++) {
    const angle = (i * Math.PI * 2) / petals;
    const px = x + Math.cos(angle) * r * 0.6;
    const py = y + Math.sin(angle) * r * 0.6;
    ctx.beginPath();
    ctx.arc(px, py, r * 0.45, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawStar(ctx: CanvasRenderingContext2D, cx: number, cy: number, points: number, outer: number, inner: number, color: string) {
  ctx.fillStyle = color;
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const angle = (i * Math.PI) / points - Math.PI / 2;
    const r = i % 2 === 0 ? outer : inner;
    const x = cx + Math.cos(angle) * r;
    const y = cy + Math.sin(angle) * r;
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
}

function drawHeart(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y + size * 0.3);
  ctx.bezierCurveTo(x - size, y - size * 0.5, x - size * 0.5, y - size, x, y - size * 0.4);
  ctx.bezierCurveTo(x + size * 0.5, y - size, x + size, y - size * 0.5, x, y + size * 0.3);
  ctx.fill();
}

function drawLeaf(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, angle: number, color: string) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.fillStyle = color;
  ctx.globalAlpha = 0.7;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(size * 0.4, -size * 0.3, size, 0);
  ctx.quadraticCurveTo(size * 0.4, size * 0.3, 0, 0);
  ctx.fill();
  // Vein
  ctx.strokeStyle = color;
  ctx.globalAlpha = 0.4;
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(size * 0.85, 0);
  ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.restore();
}
