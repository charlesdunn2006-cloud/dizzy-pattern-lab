"use client";

import { ProductTemplate } from "../types";

interface Props {
  presets: ProductTemplate[];
  customTemplates: ProductTemplate[];
  selected: ProductTemplate | null;
  onSelect: (t: ProductTemplate) => void;
  hasPattern: boolean;
}

export default function TemplateSelector({ presets, customTemplates, selected, onSelect, hasPattern }: Props) {
  const allTemplates = [...presets, ...customTemplates];

  return (
    <div style={{ marginBottom: 36 }}>
      <p style={{
        fontSize: 10, fontWeight: 500, letterSpacing: "0.18em", textTransform: "uppercase",
        color: "var(--text-muted)", marginBottom: 14,
      }}>
        Choose a product template
      </p>
      {!hasPattern && (
        <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 12, fontStyle: "italic" }}>
          Upload a pattern first
        </p>
      )}
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 1,
        border: "1px solid var(--border)", marginBottom: 16,
      }}>
        {allTemplates.map((t) => (
          <button key={t.id} onClick={() => onSelect(t)} disabled={!hasPattern}
            style={{
              padding: "14px 16px", border: "none",
              borderRight: "1px solid var(--border)", borderBottom: "1px solid var(--border)",
              background: selected?.id === t.id ? "var(--bg-card)" : "var(--bg-primary)",
              cursor: hasPattern ? "pointer" : "not-allowed",
              opacity: hasPattern ? 1 : 0.4, textAlign: "left",
              transition: "background 0.15s",
            }}>
            <div style={{
              fontSize: 13, fontWeight: 500,
              color: selected?.id === t.id ? "var(--text-primary)" : "var(--text-secondary)",
            }}>
              {t.name}
              {t.isCustom && <span style={{ fontSize: 9, marginLeft: 6, color: "var(--text-muted)", letterSpacing: "0.1em" }}>CUSTOM</span>}
            </div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
              {t.widthInches}&#8243; &times; {t.heightInches}&#8243;
              {t.isSeamlessWrap && <span style={{ marginLeft: 4 }}>&bull; Wrap</span>}
            </div>
          </button>
        ))}
      </div>
      <p style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.6 }}>
        <strong>Sizing note:</strong> Default dimensions are general industry standards. POD template sizes may differ — always use your supplier&apos;s exact measurements.
      </p>
    </div>
  );
}
