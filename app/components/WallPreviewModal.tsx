"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import { supabase } from "../lib/supabase";

interface Props {
  patternImage: HTMLImageElement;
  wallWidthFeet: number;
  wallHeightFeet: number;
  scale: number;
  rotation: number;
  onClose: () => void;
}

const FURNITURE_ITEMS = ["couch", "lamp", "plant"] as const;
type FurnitureKey = (typeof FURNITURE_ITEMS)[number];

// ── Supabase cache helpers ──────────────────────────────────────────
function cacheKey(item: FurnitureKey) {
  return `furniture_v1_${item}`;
}

async function loadFurnitureFromDB(item: FurnitureKey): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from("trending_previews")
      .select("thumbnail_data_url")
      .eq("id", cacheKey(item))
      .single();
    if (error || !data) return null;
    return data.thumbnail_data_url;
  } catch {
    return null;
  }
}

async function saveFurnitureToDB(item: FurnitureKey, dataUrl: string) {
  try {
    await supabase.from("trending_previews").upsert(
      {
        id: cacheKey(item),
        pattern_id: `furniture_${item}`,
        month: "permanent",
        thumbnail_data_url: dataUrl,
      },
      { onConflict: "id" }
    );
  } catch {
    // silent
  }
}

// ── Load an image from a data URL ───────────────────────────────────
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

// ── Component ───────────────────────────────────────────────────────
export default function WallPreviewModal({
  patternImage,
  wallWidthFeet,
  wallHeightFeet,
  scale,
  rotation,
  onClose,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [furniture, setFurniture] = useState<Record<FurnitureKey, HTMLImageElement | null>>({
    couch: null,
    lamp: null,
    plant: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [loadingStatus, setLoadingStatus] = useState("Loading room...");
  const [loadProgress, setLoadProgress] = useState(0);
  const furnitureRef = useRef(furniture);
  furnitureRef.current = furniture;

  // ── Load / generate all furniture pieces ──────────────────────────
  useEffect(() => {
    let cancelled = false;

    async function loadAll() {
      setIsLoading(true);
      let done = 0;

      // Load/generate all pieces in parallel for speed
      const promises = FURNITURE_ITEMS.map(async (item) => {
        if (cancelled) return;

        // Try cache first
        const cached = await loadFurnitureFromDB(item);
        if (cached) {
          try {
            const img = await loadImage(cached);
            done++;
            if (!cancelled) {
              setLoadProgress(done);
              setFurniture((prev) => ({ ...prev, [item]: img }));
            }
            return;
          } catch {
            // cache corrupt, regenerate
          }
        }

        // Generate fresh
        if (!cancelled) setLoadingStatus(`Generating furniture (one-time)...`);
        try {
          const res = await fetch("/api/room-scene", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ item }),
          });
          if (!res.ok) throw new Error(`Failed to generate ${item}`);
          const data = await res.json();
          if (!data.image) throw new Error("No image");

          const dataUrl = `data:image/png;base64,${data.image}`;
          saveFurnitureToDB(item, dataUrl);
          const img = await loadImage(dataUrl);
          done++;
          if (!cancelled) {
            setLoadProgress(done);
            setFurniture((prev) => ({ ...prev, [item]: img }));
          }
        } catch {
          done++;
          if (!cancelled) setLoadProgress(done);
        }
      });

      await Promise.all(promises);

      if (!cancelled) {
        setIsLoading(false);
      }
    }

    loadAll();
    return () => { cancelled = true; };
  }, []);

  // ── Draw the layered scene ────────────────────────────────────────
  const drawScene = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Scene dimensions
    const maxW = Math.min(window.innerWidth - 64, 920);
    const maxH = Math.min(window.innerHeight - 180, 650);

    // Room proportions: wall is top ~68%, floor is bottom ~32%
    const wallFraction = 0.68;
    const roomAspect = 1.4; // wider than tall

    let sceneW: number, sceneH: number;
    if (roomAspect > maxW / maxH) {
      sceneW = maxW;
      sceneH = Math.round(maxW / roomAspect);
    } else {
      sceneH = maxH;
      sceneW = Math.round(maxH * roomAspect);
    }

    canvas.width = sceneW;
    canvas.height = sceneH;

    const wallH = Math.round(sceneH * wallFraction);
    const floorH = sceneH - wallH;

    // ── Layer 1: Wallpaper tiled on the full wall area ──────────
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, sceneW, wallH);
    ctx.clip();

    // Background fill
    ctx.fillStyle = "#f5f4f2";
    ctx.fillRect(0, 0, sceneW, wallH);

    // Tile the pattern
    const tileSizeFeet = 2;
    const sf = scale / 100;
    const tilesAcross = wallWidthFeet / tileSizeFeet;
    const tilesDown = wallHeightFeet / tileSizeFeet;
    const tileW = (sceneW / tilesAcross) * sf;
    const tileH = (wallH / tilesDown) * sf;

    if (tileW >= 1 && tileH >= 1) {
      ctx.save();
      if (rotation !== 0) {
        ctx.translate(sceneW / 2, wallH / 2);
        ctx.rotate((rotation * Math.PI) / 180);
        ctx.translate(-sceneW / 2, -wallH / 2);
      }
      // Add 0.5px overlap to eliminate sub-pixel gap lines between tiles
      const overlap = 0.5;
      const extra = rotation !== 0 ? Math.ceil(Math.max(sceneW, wallH) * 0.5) : 0;
      for (let y = -tileH - extra; y < wallH + extra; y += tileH) {
        for (let x = -tileW - extra; x < sceneW + extra; x += tileW) {
          ctx.drawImage(patternImage, Math.round(x) - overlap, Math.round(y) - overlap, Math.ceil(tileW) + overlap * 2, Math.ceil(tileH) + overlap * 2);
        }
      }
      ctx.restore();
    }

    // Subtle wall depth vignette
    const vignette = ctx.createRadialGradient(
      sceneW / 2, wallH / 2, Math.min(sceneW, wallH) * 0.25,
      sceneW / 2, wallH / 2, Math.max(sceneW, wallH) * 0.75
    );
    vignette.addColorStop(0, "rgba(0,0,0,0)");
    vignette.addColorStop(1, "rgba(0,0,0,0.07)");
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, sceneW, wallH);

    ctx.restore();

    // ── Layer 2: Crown molding ──────────────────────────────────
    const moldingH = Math.max(6, sceneH * 0.012);
    // Crown shadow
    ctx.fillStyle = "rgba(0,0,0,0.06)";
    ctx.fillRect(0, 0, sceneW, moldingH + 2);
    // Crown body
    const crownGrad = ctx.createLinearGradient(0, 0, 0, moldingH);
    crownGrad.addColorStop(0, "#e8e4de");
    crownGrad.addColorStop(0.5, "#f5f2ec");
    crownGrad.addColorStop(1, "#ddd9d2");
    ctx.fillStyle = crownGrad;
    ctx.fillRect(0, 0, sceneW, moldingH);

    // ── Layer 3: Baseboard ──────────────────────────────────────
    const baseH = Math.max(8, sceneH * 0.018);
    const baseTop = wallH - baseH;
    // Baseboard shadow
    ctx.fillStyle = "rgba(0,0,0,0.05)";
    ctx.fillRect(0, baseTop - 1, sceneW, baseH + 2);
    // Baseboard body
    const baseGrad = ctx.createLinearGradient(0, baseTop, 0, wallH);
    baseGrad.addColorStop(0, "#f0ede6");
    baseGrad.addColorStop(0.3, "#e8e4dc");
    baseGrad.addColorStop(1, "#ddd8cf");
    ctx.fillStyle = baseGrad;
    ctx.fillRect(0, baseTop, sceneW, baseH);
    // Baseboard top edge highlight
    ctx.fillStyle = "rgba(255,255,255,0.4)";
    ctx.fillRect(0, baseTop, sceneW, 1);

    // ── Layer 4: Floor ──────────────────────────────────────────
    const floorTop = wallH;

    // Base floor color
    const floorGrad = ctx.createLinearGradient(0, floorTop, 0, sceneH);
    floorGrad.addColorStop(0, "#c4a882");
    floorGrad.addColorStop(0.3, "#b89b76");
    floorGrad.addColorStop(1, "#a88d68");
    ctx.fillStyle = floorGrad;
    ctx.fillRect(0, floorTop, sceneW, floorH);

    // Hardwood plank lines
    ctx.strokeStyle = "rgba(0,0,0,0.08)";
    ctx.lineWidth = 1;
    const plankW = sceneW * 0.12;
    const plankRowH = floorH * 0.25;
    for (let row = 0; row < 5; row++) {
      const rowY = floorTop + row * plankRowH;
      // Horizontal plank line
      if (row > 0) {
        ctx.beginPath();
        ctx.moveTo(0, rowY);
        ctx.lineTo(sceneW, rowY);
        ctx.stroke();
      }
      // Vertical joints (staggered)
      const offset = row % 2 === 0 ? 0 : plankW * 0.5;
      for (let x = offset; x < sceneW; x += plankW) {
        if (x > 0) {
          ctx.beginPath();
          ctx.moveTo(x, rowY);
          ctx.lineTo(x, rowY + plankRowH);
          ctx.stroke();
        }
      }
    }

    // Floor light reflection
    const floorShine = ctx.createLinearGradient(0, floorTop, 0, floorTop + floorH * 0.4);
    floorShine.addColorStop(0, "rgba(255,255,255,0.1)");
    floorShine.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = floorShine;
    ctx.fillRect(0, floorTop, sceneW, floorH * 0.4);

    // Shadow where wall meets floor
    const wallFloorShadow = ctx.createLinearGradient(0, floorTop, 0, floorTop + 15);
    wallFloorShadow.addColorStop(0, "rgba(0,0,0,0.12)");
    wallFloorShadow.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = wallFloorShadow;
    ctx.fillRect(0, floorTop, sceneW, 15);

    // ── Layer 5: Furniture (transparent PNGs on top) ────────────
    const f = furnitureRef.current;

    // Couch: centered, sitting on the floor
    if (f.couch) {
      const couchW = sceneW * 0.48;
      const couchH = couchW * (f.couch.height / f.couch.width);
      const couchX = (sceneW - couchW) / 2;
      const couchY = floorTop - couchH * 0.55; // overlap wall & floor

      // Couch shadow on floor
      ctx.save();
      ctx.fillStyle = "rgba(0,0,0,0.1)";
      ctx.beginPath();
      ctx.ellipse(
        couchX + couchW / 2, floorTop + floorH * 0.08,
        couchW * 0.46, floorH * 0.06,
        0, 0, Math.PI * 2
      );
      ctx.fill();
      ctx.restore();

      ctx.drawImage(f.couch, couchX, couchY, couchW, couchH);
    }

    // Lamp: left side
    if (f.lamp) {
      const lampH = sceneH * 0.52;
      const lampW = lampH * (f.lamp.width / f.lamp.height);
      const lampX = sceneW * 0.06;
      const lampY = floorTop - lampH * 0.65;

      // Lamp shadow
      ctx.save();
      ctx.fillStyle = "rgba(0,0,0,0.07)";
      ctx.beginPath();
      ctx.ellipse(
        lampX + lampW / 2, floorTop + floorH * 0.06,
        lampW * 0.4, floorH * 0.04,
        0, 0, Math.PI * 2
      );
      ctx.fill();
      ctx.restore();

      // Warm light glow on wall behind lamp
      ctx.save();
      const glowGrad = ctx.createRadialGradient(
        lampX + lampW / 2, wallH * 0.35,
        0,
        lampX + lampW / 2, wallH * 0.35,
        sceneW * 0.2
      );
      glowGrad.addColorStop(0, "rgba(255,235,200,0.12)");
      glowGrad.addColorStop(1, "rgba(255,235,200,0)");
      ctx.fillStyle = glowGrad;
      ctx.fillRect(0, 0, sceneW, wallH);
      ctx.restore();

      ctx.drawImage(f.lamp, lampX, lampY, lampW, lampH);
    }

    // Plant: right side
    if (f.plant) {
      const plantH = sceneH * 0.45;
      const plantW = plantH * (f.plant.width / f.plant.height);
      const plantX = sceneW - plantW - sceneW * 0.06;
      const plantY = floorTop - plantH * 0.55;

      // Plant shadow
      ctx.save();
      ctx.fillStyle = "rgba(0,0,0,0.08)";
      ctx.beginPath();
      ctx.ellipse(
        plantX + plantW / 2, floorTop + floorH * 0.06,
        plantW * 0.35, floorH * 0.04,
        0, 0, Math.PI * 2
      );
      ctx.fill();
      ctx.restore();

      ctx.drawImage(f.plant, plantX, plantY, plantW, plantH);
    }

    // ── Layer 6: Subtle ambient lighting from top-left ──────────
    ctx.save();
    const ambient = ctx.createLinearGradient(0, 0, sceneW, sceneH);
    ambient.addColorStop(0, "rgba(255,250,240,0.04)");
    ambient.addColorStop(1, "rgba(0,0,0,0.04)");
    ctx.fillStyle = ambient;
    ctx.fillRect(0, 0, sceneW, sceneH);
    ctx.restore();

  }, [patternImage, wallWidthFeet, wallHeightFeet, scale, rotation, furniture]);

  // Redraw when furniture loads or pattern changes
  useEffect(() => {
    drawScene();
  }, [drawScene]);

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
        background: "rgba(0,0,0,0.78)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#1c1c1e",
          maxWidth: 980,
          width: "100%",
          maxHeight: "94vh",
          overflow: "auto",
          position: "relative",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          borderRadius: 10,
        }}
      >
        {/* Close */}
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: 12,
            right: 16,
            background: "none",
            border: "none",
            fontSize: 24,
            color: "rgba(255,255,255,0.5)",
            cursor: "pointer",
            zIndex: 10,
            lineHeight: 1,
          }}
        >
          &times;
        </button>

        {/* Title */}
        <div style={{ padding: "20px 24px 14px", textAlign: "center", width: "100%" }}>
          <p
            style={{
              fontSize: 10,
              fontWeight: 500,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.45)",
              marginBottom: 6,
            }}
          >
            Room Preview
          </p>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.65)" }}>
            {wallWidthFeet}&prime; &times; {wallHeightFeet}&prime; wall
          </p>
        </div>

        {/* Scene */}
        <div
          style={{
            position: "relative",
            padding: "0 24px 24px",
            width: "100%",
            display: "flex",
            justifyContent: "center",
            minHeight: 300,
          }}
        >
          <div
            style={{
              position: "relative",
              borderRadius: 6,
              overflow: "hidden",
              boxShadow: "0 8px 40px rgba(0,0,0,0.5)",
            }}
          >
            <canvas ref={canvasRef} style={{ display: "block", maxWidth: "100%" }} />

            {/* Loading overlay */}
            {isLoading && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 14,
                  background: "rgba(28,28,30,0.85)",
                  backdropFilter: "blur(4px)",
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    border: "3px solid rgba(255,255,255,0.12)",
                    borderTopColor: "rgba(255,255,255,0.65)",
                    borderRadius: "50%",
                    animation: "spin 1s linear infinite",
                  }}
                />
                <p
                  style={{
                    fontSize: 12,
                    color: "rgba(255,255,255,0.5)",
                    letterSpacing: "0.05em",
                  }}
                >
                  {loadingStatus}
                </p>
                <p
                  style={{
                    fontSize: 11,
                    color: "rgba(255,255,255,0.3)",
                  }}
                >
                  {loadProgress} / {FURNITURE_ITEMS.length} pieces loaded
                </p>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
