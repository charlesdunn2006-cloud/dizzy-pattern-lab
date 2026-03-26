"use client";

import { useState, useRef, useCallback } from "react";
import { ProductTemplate } from "../types";

interface Props {
  onAdd: (template: ProductTemplate) => void;
  customTemplates: ProductTemplate[];
  onDelete: (id: string) => void;
  onImport: (templates: ProductTemplate[]) => void;
}

export default function CustomTemplateBuilder({ onAdd, customTemplates, onDelete, onImport }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [width, setWidth] = useState("9.25");
  const [height, setHeight] = useState("8.20");
  const [isWrap, setIsWrap] = useState(false);
  const [showSaved, setShowSaved] = useState(true);
  const importRef = useRef<HTMLInputElement>(null);

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "10px 12px", border: "1px solid var(--border)",
    background: "var(--bg-primary)", color: "var(--text-primary)", fontSize: 14, outline: "none",
  };

  const handleSave = useCallback(() => {
    const w = parseFloat(width); const h = parseFloat(height);
    if (!name.trim() || isNaN(w) || isNaN(h) || w <= 0 || h <= 0) { alert("Please fill in all fields."); return; }
    onAdd({ id: `custom-${Date.now()}`, name: name.trim(), widthInches: w, heightInches: h, isSeamlessWrap: isWrap, isCustom: true });
    setName(""); setWidth("9.25"); setHeight("8.20"); setIsWrap(false);
  }, [name, width, height, isWrap, onAdd]);

  const linkStyle: React.CSSProperties = {
    background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer",
    fontSize: 12, letterSpacing: "0.08em", textDecoration: "underline", textUnderlineOffset: 3,
  };

  return (
    <div style={{ marginBottom: 36 }}>
      <button onClick={() => setIsOpen(!isOpen)}
        style={{
          background: "none", border: "none", cursor: "pointer", padding: 0,
          fontSize: 12, letterSpacing: "0.08em", color: "var(--text-secondary)",
          textDecoration: "underline", textUnderlineOffset: 3, marginBottom: 16,
        }}>
        {isOpen ? "HIDE CUSTOM TEMPLATE BUILDER" : "+ ADD CUSTOM TEMPLATE"}
      </button>

      {isOpen && (
        <div style={{ padding: "24px 0", borderTop: "1px solid var(--border)", marginTop: 8 }}>
          <p style={{ fontSize: 10, fontWeight: 500, letterSpacing: "0.18em", color: "var(--text-muted)", marginBottom: 4, textTransform: "uppercase" }}>
            Create a custom template
          </p>
          <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 20 }}>
            Enter dimensions in inches — automatically converted to pixels at 300 DPI.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={{ fontSize: 11, color: "var(--text-muted)", letterSpacing: "0.1em", marginBottom: 4, display: "block" }}>PRODUCT NAME</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. My Tumbler" style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize: 11, color: "var(--text-muted)", letterSpacing: "0.1em", marginBottom: 4, display: "block" }}>WIDTH (INCHES)</label>
              <input type="number" step="0.01" value={width} onChange={(e) => setWidth(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize: 11, color: "var(--text-muted)", letterSpacing: "0.1em", marginBottom: 4, display: "block" }}>HEIGHT (INCHES)</label>
              <input type="number" step="0.01" value={height} onChange={(e) => setHeight(e.target.value)} style={inputStyle} />
            </div>
          </div>
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--text-secondary)", marginBottom: 20, cursor: "pointer" }}>
            <input type="checkbox" checked={isWrap} onChange={(e) => setIsWrap(e.target.checked)} style={{ accentColor: "var(--accent)" }} />
            Seamless wrap product (tumbler, pen wrap, etc.)
          </label>
          <button onClick={handleSave}
            style={{
              padding: "11px 28px", border: "1px solid var(--accent)",
              background: "var(--accent)", color: "#fff", fontSize: 11,
              fontWeight: 500, letterSpacing: "0.12em", cursor: "pointer",
              textTransform: "uppercase",
            }}>
            Save Template
          </button>
        </div>
      )}

      {/* Saved templates */}
      <div style={{ paddingTop: 20, borderTop: "1px solid var(--border)", marginTop: isOpen ? 0 : 8 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <p style={{ fontSize: 10, fontWeight: 500, letterSpacing: "0.18em", color: "var(--text-muted)", textTransform: "uppercase" }}>
            Your saved templates
          </p>
          {customTemplates.length > 0 && (
            <button onClick={() => setShowSaved(!showSaved)} style={linkStyle}>
              {showSaved ? "HIDE" : "SHOW"}
            </button>
          )}
        </div>

        {showSaved && customTemplates.length > 0 && customTemplates.map((t) => (
          <div key={t.id} style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "10px 0", borderBottom: "1px solid var(--border-light)",
          }}>
            <span style={{ fontSize: 13, color: "var(--text-primary)" }}>
              {t.name} <span style={{ color: "var(--text-muted)" }}>({t.widthInches}&#8243; &times; {t.heightInches}&#8243;)</span>
            </span>
            <button onClick={() => onDelete(t.id)}
              style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: 14 }}>
              &times;
            </button>
          </div>
        ))}

        {customTemplates.length === 0 && (
          <p style={{ fontSize: 13, color: "var(--text-muted)", fontStyle: "italic" }}>No custom templates yet.</p>
        )}

        <div style={{ marginTop: 16, display: "flex", gap: 16 }}>
          {customTemplates.length > 0 && (
            <button onClick={() => {
              const blob = new Blob([JSON.stringify(customTemplates, null, 2)], { type: "application/json" });
              const url = URL.createObjectURL(blob); const a = document.createElement("a");
              a.href = url; a.download = "pattern-lab-templates.json"; a.click(); URL.revokeObjectURL(url);
            }} style={linkStyle}>EXPORT TEMPLATES</button>
          )}
          <label style={{ ...linkStyle, display: "inline-flex" }}>
            IMPORT TEMPLATES
            <input ref={importRef} type="file" accept=".json" style={{ display: "none" }}
              onChange={(e) => {
                const file = e.target.files?.[0]; if (!file) return;
                const reader = new FileReader();
                reader.onload = (ev) => {
                  try { const data = JSON.parse(ev.target?.result as string);
                    if (Array.isArray(data)) onImport(data.map((t: ProductTemplate) => ({ ...t, isCustom: true })));
                  } catch { alert("Invalid template file."); }
                };
                reader.readAsText(file); if (importRef.current) importRef.current.value = "";
              }} />
          </label>
        </div>
        <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 8, lineHeight: 1.6 }}>
          Export saves your templates to a file. Import on any device to restore them.
        </p>
      </div>
    </div>
  );
}
