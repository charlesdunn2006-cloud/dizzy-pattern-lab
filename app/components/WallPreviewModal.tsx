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

// Cache key for room scene in Supabase
const ROOM_SCENE_KEY = "room_scene_v1";

// Load cached room scene from Supabase
async function loadRoomScene(): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from("trending_previews")
      .select("thumbnail_data_url")
      .eq("id", ROOM_SCENE_KEY)
      .single();
    if (error || !data) return null;
    return data.thumbnail_data_url;
  } catch {
    return null;
  }
}

// Save room scene to Supabase
async function saveRoomScene(dataUrl: string) {
  try {
    await supabase.from("trending_previews").upsert(
      {
        id: ROOM_SCENE_KEY,
        pattern_id: "room_scene",
        month: "permanent",
        thumbnail_data_url: dataUrl,
      },
      { onConflict: "id" }
    );
  } catch {
    // silent fail
  }
}

// Detect the white wall region in the room photo and return a mask
function detectWallRegion(
  roomImg: HTMLImageElement,
  width: number,
  height: number
): { mask: ImageData; bounds: { top: number; bottom: number; left: number; right: number } } {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(roomImg, 0, 0, width, height);
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  // Create a mask: white/near-white pixels = wall
  const mask = ctx.createImageData(width, height);
  const threshold = 200; // pixels with R,G,B all above this are "wall"
  let top = height,
    bottom = 0,
    left = width,
    right = 0;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const r = data[i],
        g = data[i + 1],
        b = data[i + 2];
      // Check if pixel is white/near-white (the blank wall)
      const isWall = r > threshold && g > threshold && b > threshold && Math.abs(r - g) < 30 && Math.abs(r - b) < 30;
      if (isWall) {
        mask.data[i] = 255;
        mask.data[i + 1] = 255;
        mask.data[i + 2] = 255;
        mask.data[i + 3] = 255;
        if (y < top) top = y;
        if (y > bottom) bottom = y;
        if (x < left) left = x;
        if (x > right) right = x;
      } else {
        mask.data[i] = 0;
        mask.data[i + 1] = 0;
        mask.data[i + 2] = 0;
        mask.data[i + 3] = 0;
      }
    }
  }

  return { mask, bounds: { top, bottom, left, right } };
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
  const [roomImage, setRoomImage] = useState<HTMLImageElement | null>(null);
  const [isLoadingRoom, setIsLoadingRoom] = useState(true);
  const [loadingStatus, setLoadingStatus] = useState("Loading room scene...");
  const [error, setError] = useState<string | null>(null);

  // Load or generate the room scene
  useEffect(() => {
    let cancelled = false;

    async function loadOrGenerate() {
      setIsLoadingRoom(true);

      // Try loading from cache first
      setLoadingStatus("Checking cached room...");
      const cached = await loadRoomScene();
      if (cached && !cancelled) {
        const img = new Image();
        img.onload = () => {
          if (!cancelled) {
            setRoomImage(img);
            setIsLoadingRoom(false);
          }
        };
        img.onerror = () => {
          if (!cancelled) generateFresh();
        };
        img.src = cached;
        return;
      }

      if (!cancelled) await generateFresh();
    }

    async function generateFresh() {
      setLoadingStatus("Generating realistic room (one-time, ~15s)...");
      try {
        const res = await fetch("/api/room-scene", { method: "POST" });
        if (!res.ok) throw new Error("Failed to generate room");
        const data = await res.json();
        if (!data.image) throw new Error("No image returned");

        const dataUrl = `data:image/png;base64,${data.image}`;

        // Cache it
        saveRoomScene(dataUrl);

        if (!cancelled) {
          const img = new Image();
          img.onload = () => {
            if (!cancelled) {
              setRoomImage(img);
              setIsLoadingRoom(false);
            }
          };
          img.src = dataUrl;
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to generate room");
          setIsLoadingRoom(false);
        }
      }
    }

    loadOrGenerate();
    return () => {
      cancelled = true;
    };
  }, []);

  // Draw the composite: pattern on wall + room photo on top
  const drawComposite = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !roomImage) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const canvasW = Math.min(window.innerWidth - 80, 900);
    const canvasH = Math.min(window.innerHeight - 160, 700);

    // Keep room image aspect ratio (1:1 from API, but we'll letterbox)
    const imgAspect = roomImage.width / roomImage.height;
    let drawW: number, drawH: number;
    if (imgAspect > canvasW / canvasH) {
      drawW = canvasW;
      drawH = Math.round(canvasW / imgAspect);
    } else {
      drawH = canvasH;
      drawW = Math.round(canvasH * imgAspect);
    }

    canvas.width = drawW;
    canvas.height = drawH;

    // Step 1: Detect wall region in room image
    const { mask, bounds } = detectWallRegion(roomImage, drawW, drawH);

    // Step 2: Create a mask canvas for clipping
    const maskCanvas = document.createElement("canvas");
    maskCanvas.width = drawW;
    maskCanvas.height = drawH;
    const maskCtx = maskCanvas.getContext("2d")!;
    maskCtx.putImageData(mask, 0, 0);

    // Step 3: Draw the tiled pattern onto the wall region
    const wallW = bounds.right - bounds.left;
    const wallH = bounds.bottom - bounds.top;
    if (wallW > 0 && wallH > 0) {
      // Create a pattern canvas for the wall area
      const patternCanvas = document.createElement("canvas");
      patternCanvas.width = drawW;
      patternCanvas.height = drawH;
      const patCtx = patternCanvas.getContext("2d")!;

      // Tile the pattern across the detected wall area
      const tileSizeFeet = 2;
      const sf = scale / 100;
      const tilesAcross = wallWidthFeet / tileSizeFeet;
      const tilesDown = wallHeightFeet / tileSizeFeet;
      const tileW = (wallW / tilesAcross) * sf;
      const tileH = (wallH / tilesDown) * sf;

      if (tileW >= 1 && tileH >= 1) {
        patCtx.save();
        if (rotation !== 0) {
          const cx = bounds.left + wallW / 2;
          const cy = bounds.top + wallH / 2;
          patCtx.translate(cx, cy);
          patCtx.rotate((rotation * Math.PI) / 180);
          patCtx.translate(-cx, -cy);
        }

        const extra = rotation !== 0 ? Math.ceil(Math.max(wallW, wallH) * 0.5) : 0;
        for (let y = bounds.top - tileH - extra; y < bounds.bottom + extra; y += tileH) {
          for (let x = bounds.left - tileW - extra; x < bounds.right + extra; x += tileW) {
            patCtx.drawImage(patternImage, x, y, tileW, tileH);
          }
        }
        patCtx.restore();
      }

      // Step 4: Use the mask to clip the pattern to just the wall area
      // destination-in keeps pattern pixels only where mask is opaque
      patCtx.globalCompositeOperation = "destination-in";
      patCtx.drawImage(maskCanvas, 0, 0);
      patCtx.globalCompositeOperation = "source-over";

      // Step 5: Draw pattern layer onto main canvas
      ctx.drawImage(patternCanvas, 0, 0);

      // Step 6: Add subtle wall texture/depth to pattern area
      ctx.save();
      ctx.globalCompositeOperation = "multiply";
      ctx.globalAlpha = 0.08;
      // Slight vignette on pattern area
      const grad = ctx.createRadialGradient(
        bounds.left + wallW / 2,
        bounds.top + wallH / 2,
        Math.min(wallW, wallH) * 0.3,
        bounds.left + wallW / 2,
        bounds.top + wallH / 2,
        Math.max(wallW, wallH) * 0.7
      );
      grad.addColorStop(0, "transparent");
      grad.addColorStop(1, "rgba(0,0,0,0.3)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, drawW, drawH);
      ctx.restore();
    }

    // Step 7: Draw the room photo on top (furniture, floor, etc.)
    // Use destination-over to draw room BEHIND existing pattern, or
    // carefully composite to preserve furniture over pattern
    ctx.save();

    // Draw room image - but we want furniture ON TOP of pattern
    // Strategy: draw room, but make white areas transparent
    const roomOverlay = document.createElement("canvas");
    roomOverlay.width = drawW;
    roomOverlay.height = drawH;
    const roomCtx = roomOverlay.getContext("2d")!;
    roomCtx.drawImage(roomImage, 0, 0, drawW, drawH);

    // Make white wall pixels transparent so pattern shows through
    const roomData = roomCtx.getImageData(0, 0, drawW, drawH);
    const rd = roomData.data;
    const threshold = 200;
    for (let i = 0; i < rd.length; i += 4) {
      const r = rd[i], g = rd[i + 1], b = rd[i + 2];
      const isWall = r > threshold && g > threshold && b > threshold && Math.abs(r - g) < 30 && Math.abs(r - b) < 30;
      if (isWall) {
        // Make transparent
        rd[i + 3] = 0;
      } else {
        // Smooth edge transition - partially transparent for pixels near threshold
        const minC = Math.min(r, g, b);
        if (minC > threshold - 40) {
          const fade = (minC - (threshold - 40)) / 40;
          rd[i + 3] = Math.round(255 * (1 - fade * 0.8));
        }
      }
    }
    roomCtx.putImageData(roomData, 0, 0);

    // Draw room overlay (non-wall parts) on top
    ctx.drawImage(roomOverlay, 0, 0);
    ctx.restore();

    // Step 8: Subtle overall shadow/frame
    ctx.strokeStyle = "rgba(0,0,0,0.1)";
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, drawW, drawH);
  }, [roomImage, patternImage, wallWidthFeet, wallHeightFeet, scale, rotation]);

  useEffect(() => {
    drawComposite();
  }, [drawComposite]);

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
        background: "rgba(0,0,0,0.75)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#1a1a1a",
          maxWidth: 960,
          width: "100%",
          maxHeight: "92vh",
          overflow: "auto",
          position: "relative",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          borderRadius: 8,
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
            color: "rgba(255,255,255,0.6)",
            cursor: "pointer",
            zIndex: 10,
            lineHeight: 1,
          }}
        >
          &times;
        </button>

        {/* Title */}
        <div style={{ padding: "20px 24px 16px", textAlign: "center", width: "100%" }}>
          <p
            style={{
              fontSize: 10,
              fontWeight: 500,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.5)",
              marginBottom: 6,
            }}
          >
            Room Preview
          </p>
          <p
            style={{
              fontSize: 14,
              color: "rgba(255,255,255,0.7)",
            }}
          >
            {wallWidthFeet}&prime; &times; {wallHeightFeet}&prime; wall
          </p>
        </div>

        {/* Room scene */}
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
          {isLoadingRoom ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 16,
                padding: "80px 0",
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  border: "3px solid rgba(255,255,255,0.15)",
                  borderTopColor: "rgba(255,255,255,0.7)",
                  borderRadius: "50%",
                  animation: "spin 1s linear infinite",
                }}
              />
              <p
                style={{
                  fontSize: 13,
                  color: "rgba(255,255,255,0.5)",
                  letterSpacing: "0.05em",
                }}
              >
                {loadingStatus}
              </p>
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          ) : error ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 12,
                padding: "60px 0",
              }}
            >
              <p style={{ fontSize: 14, color: "rgba(255,200,200,0.8)" }}>{error}</p>
              <button
                onClick={() => {
                  setError(null);
                  setIsLoadingRoom(true);
                  setLoadingStatus("Generating realistic room...");
                  fetch("/api/room-scene", { method: "POST" })
                    .then((r) => r.json())
                    .then((data) => {
                      if (!data.image) throw new Error("No image");
                      const url = `data:image/png;base64,${data.image}`;
                      saveRoomScene(url);
                      const img = new Image();
                      img.onload = () => {
                        setRoomImage(img);
                        setIsLoadingRoom(false);
                      };
                      img.src = url;
                    })
                    .catch((e) => {
                      setError(e.message);
                      setIsLoadingRoom(false);
                    });
                }}
                style={{
                  padding: "8px 20px",
                  border: "1px solid rgba(255,255,255,0.3)",
                  background: "transparent",
                  color: "rgba(255,255,255,0.7)",
                  fontSize: 12,
                  cursor: "pointer",
                  borderRadius: 4,
                }}
              >
                Retry
              </button>
            </div>
          ) : (
            <div
              style={{
                position: "relative",
                borderRadius: 4,
                overflow: "hidden",
                boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
              }}
            >
              <canvas ref={canvasRef} style={{ display: "block", maxWidth: "100%" }} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
