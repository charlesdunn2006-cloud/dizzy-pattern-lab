"use client";

import { useState, useMemo } from "react";
import { TILE_SIZES, TileSize, calculateTiles } from "../types";

interface Props {
  wallWidth?: number;
  wallHeight?: number;
  onWallSizeChange?: (w: number, h: number) => void;
  onDimensionsChange?: (wallW: number, wallH: number, tile: TileSize) => void;
}

export default function WallDimensions({ wallWidth, wallHeight, onWallSizeChange, onDimensionsChange }: Props) {
  const [unit, setUnit] = useState<"feet" | "inches">("feet");
  const [width, setWidth] = useState(wallWidth ?? 10);
  const [height, setHeight] = useState(wallHeight ?? 8);
  const [selectedTile, setSelectedTile] = useState<TileSize>(TILE_SIZES[2]); // 24x24 default

  const wallWidthFeet = unit === "feet" ? width : width / 12;
  const wallHeightFeet = unit === "feet" ? height : height / 12;

  const tiles = useMemo(
    () => calculateTiles(wallWidthFeet, wallHeightFeet, selectedTile.widthInches, selectedTile.heightInches),
    [wallWidthFeet, wallHeightFeet, selectedTile]
  );

  const handleTileSelect = (tile: TileSize) => {
    setSelectedTile(tile);
    onDimensionsChange?.(wallWidthFeet, wallHeightFeet, tile);
  };

  const handleDimensionChange = (newWidth: number, newHeight: number) => {
    setWidth(newWidth);
    setHeight(newHeight);
    const wFeet = unit === "feet" ? newWidth : newWidth / 12;
    const hFeet = unit === "feet" ? newHeight : newHeight / 12;
    onWallSizeChange?.(wFeet, hFeet);
    onDimensionsChange?.(wFeet, hFeet, selectedTile);
  };

  return (
    <div style={{ marginBottom: 36 }}>
      <label style={{
        display: "block", fontSize: 10, fontWeight: 500, letterSpacing: "0.18em",
        textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 14,
      }}>
        Wall Dimensions
      </label>

      {/* Unit toggle */}
      <div style={{ display: "flex", gap: 0, marginBottom: 16 }}>
        {(["feet", "inches"] as const).map((u) => (
          <button
            key={u}
            onClick={() => {
              if (u !== unit) {
                const newWidth = u === "inches" ? Math.round(width * 12) : Math.round(width / 12 * 10) / 10;
                const newHeight = u === "inches" ? Math.round(height * 12) : Math.round(height / 12 * 10) / 10;
                setUnit(u);
                setWidth(newWidth);
                setHeight(newHeight);
              }
            }}
            style={{
              padding: "8px 20px", border: "1px solid var(--border)",
              background: unit === u ? "var(--accent)" : "#ffffff",
              color: unit === u ? "#fff" : "var(--text-secondary)",
              fontSize: 12, fontWeight: 500, letterSpacing: "0.08em",
              cursor: "pointer", textTransform: "capitalize",
              borderRight: u === "feet" ? "none" : undefined,
            }}
          >
            {u === "feet" ? "Feet" : "Inches"}
          </button>
        ))}
      </div>

      {/* Width / Height inputs */}
      <div style={{ display: "flex", gap: 16, marginBottom: 20 }}>
        <div style={{ flex: 1 }}>
          <label style={{
            display: "block", fontSize: 11, color: "var(--text-muted)", marginBottom: 6,
            fontWeight: 500,
          }}>
            Width ({unit})
          </label>
          <input
            type="number"
            value={width}
            onChange={(e) => {
              const v = parseFloat(e.target.value);
              if (!isNaN(v) && v > 0) handleDimensionChange(v, height);
            }}
            min={1}
            style={{
              width: "100%", padding: "10px 14px", border: "1px solid var(--border)",
              background: "#ffffff", color: "var(--text-primary)", fontSize: 16,
              fontWeight: 500, outline: "none", textAlign: "center",
            }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label style={{
            display: "block", fontSize: 11, color: "var(--text-muted)", marginBottom: 6,
            fontWeight: 500,
          }}>
            Height ({unit})
          </label>
          <input
            type="number"
            value={height}
            onChange={(e) => {
              const v = parseFloat(e.target.value);
              if (!isNaN(v) && v > 0) handleDimensionChange(width, v);
            }}
            min={1}
            style={{
              width: "100%", padding: "10px 14px", border: "1px solid var(--border)",
              background: "#ffffff", color: "var(--text-primary)", fontSize: 16,
              fontWeight: 500, outline: "none", textAlign: "center",
            }}
          />
        </div>
      </div>

      {/* Tile size selector */}
      <label style={{
        display: "block", fontSize: 10, fontWeight: 500, letterSpacing: "0.18em",
        textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 10,
      }}>
        Pattern Tile Size
      </label>
      <div style={{ display: "flex", gap: 0, marginBottom: 20 }}>
        {TILE_SIZES.map((tile) => (
          <button
            key={tile.label}
            onClick={() => handleTileSelect(tile)}
            style={{
              flex: 1, padding: "10px 8px",
              border: "1px solid var(--border)",
              borderRight: tile === TILE_SIZES[TILE_SIZES.length - 1] ? "1px solid var(--border)" : "none",
              background: selectedTile.label === tile.label ? "var(--accent)" : "#ffffff",
              color: selectedTile.label === tile.label ? "#fff" : "var(--text-secondary)",
              fontSize: 13, fontWeight: 500, cursor: "pointer",
              transition: "all 0.15s",
            }}
          >
            {tile.label}
          </button>
        ))}
      </div>

      {/* Tile calculation result */}
      <div style={{
        padding: "16px 20px", background: "#ffffff",
        border: "1px solid var(--border)",
      }}>
        <p style={{
          fontSize: 10, fontWeight: 500, letterSpacing: "0.15em",
          textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 8,
        }}>
          Tiles Needed
        </p>
        <p style={{ fontSize: 20, fontWeight: 500, color: "var(--text-primary)", marginBottom: 4,
          fontFamily: "'Cormorant Garamond', Georgia, serif",
        }}>
          {tiles.tilesX} &times; {tiles.tilesY} tiles ({tiles.total} total)
        </p>
        <p style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.6 }}>
          {unit === "feet" ? `${width}' × ${height}'` : `${width}" × ${height}"`} wall
          {" "}&rarr;{" "}
          Each tile: {selectedTile.label} at 300 DPI
        </p>
      </div>
    </div>
  );
}
