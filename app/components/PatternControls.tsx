"use client";

import { useCallback, useMemo } from "react";
import { getEffectiveDpi, DPI } from "../types";

interface Props {
  scale: number;
  onScaleChange: (v: number) => void;
  rotation: number;
  onRotationChange: (v: number) => void;
  isSeamlessWrap: boolean;
}

export default function PatternControls({ scale, onScaleChange, rotation, onRotationChange, isSeamlessWrap }: Props) {
  const effectiveDpi = useMemo(() => getEffectiveDpi(DPI, scale), [scale]);
  const dpiWarning = effectiveDpi < 200;

  const snapToSeamless = useCallback((val: number) => {
    if (!isSeamlessWrap) return val;
    const divisors = [10, 12.5, 16.67, 20, 25, 33.33, 50, 100];
    let closest = divisors[0]; let minDist = Math.abs(val - divisors[0]);
    for (const d of divisors) { const dist = Math.abs(val - d); if (dist < minDist) { minDist = dist; closest = d; } }
    return Math.round(closest * 100) / 100;
  }, [isSeamlessWrap]);

  const numInputStyle: React.CSSProperties = {
    width: 52, padding: "6px 8px", border: "1px solid var(--border)",
    background: "var(--bg-primary)", color: "var(--text-primary)", fontSize: 14,
    textAlign: "center", outline: "none",
  };

  return (
    <div style={{ marginBottom: 36, padding: "24px 0", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}>
      {/* Scale */}
      <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 10 }}>
        <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)", minWidth: 100 }}>Pattern scale</span>
        <input type="range" min={10} max={200} value={scale}
          onChange={(e) => onScaleChange(snapToSeamless(parseFloat(e.target.value)))}
          style={{ flex: 1 }} />
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <input type="number" value={scale}
            onChange={(e) => { const v = parseFloat(e.target.value); if (!isNaN(v) && v > 0 && v <= 200) onScaleChange(v); }}
            min={10} max={200} style={numInputStyle} />
          <span style={{ fontSize: 12, color: "var(--text-muted)" }}>%</span>
        </div>
      </div>
      <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: dpiWarning ? 10 : 24, lineHeight: 1.5 }}>
        {isSeamlessWrap ? "For seamless wrap products, scale snaps to seamless increments automatically. " : ""}
        Scaling past 100% reduces print quality.
      </p>
      {dpiWarning && (
        <p style={{ fontSize: 12, color: "var(--warning)", marginBottom: 24, lineHeight: 1.5 }}>
          &#9888; Effective DPI below 200 ({effectiveDpi}) — this may print blurry at full size.
        </p>
      )}

      {/* Rotation */}
      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)", minWidth: 100 }}>Rotation</span>
        <input type="range" min={-180} max={180} value={rotation}
          onChange={(e) => onRotationChange(parseInt(e.target.value))} style={{ flex: 1 }} />
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <input type="number" value={rotation}
            onChange={(e) => { const v = parseInt(e.target.value); if (!isNaN(v) && v >= -180 && v <= 180) onRotationChange(v); }}
            min={-180} max={180} style={numInputStyle} />
          <span style={{ fontSize: 12, color: "var(--text-muted)" }}>&deg;</span>
        </div>
        {rotation !== 0 && (
          <button onClick={() => onRotationChange(0)}
            style={{
              background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer",
              fontSize: 11, letterSpacing: "0.08em", textDecoration: "underline", textUnderlineOffset: 3,
            }}>
            RESET
          </button>
        )}
      </div>
      {isSeamlessWrap && (
        <p style={{ fontSize: 12, color: "var(--warning)", marginTop: 10, lineHeight: 1.5 }}>
          &#9888; <strong>Rotation breaks seamless edges.</strong> Only use on flat products like bookmarks and inserts.
        </p>
      )}
    </div>
  );
}
