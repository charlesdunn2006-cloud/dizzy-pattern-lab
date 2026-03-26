"use client";

import { useRef, useState, useCallback } from "react";

interface Props {
  onUpload: (img: HTMLImageElement, fileName: string) => void;
  onClear: () => void;
  hasFile: boolean;
  fileName: string;
}

export default function FileUpload({ onUpload, onClear, hasFile, fileName }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const processFile = useCallback((file: File) => {
    if (!file.type.match(/^image\/(png|jpeg|tiff)$/)) { alert("Please upload a PNG, JPG, or TIFF file."); return; }
    const reader = new FileReader();
    reader.onload = (e) => { const img = new Image(); img.onload = () => onUpload(img, file.name); img.src = e.target?.result as string; };
    reader.readAsDataURL(file);
  }, [onUpload]);

  if (hasFile) {
    return (
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "16px 20px", marginBottom: 36,
        borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ color: "var(--success)", fontSize: 14 }}>&#10003;</span>
          <span style={{ fontSize: 14, color: "var(--text-primary)" }}>{fileName}</span>
        </div>
        <button onClick={() => { onClear(); if (inputRef.current) inputRef.current.value = ""; }}
          style={{
            background: "none", border: "none", color: "var(--text-muted)",
            cursor: "pointer", fontSize: 12, letterSpacing: "0.08em",
            textDecoration: "underline", textUnderlineOffset: 3,
          }}>
          UPLOAD NEW FILE
        </button>
      </div>
    );
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e) => { e.preventDefault(); setIsDragging(false); const f = e.dataTransfer.files[0]; if (f) processFile(f); }}
      onClick={() => inputRef.current?.click()}
      style={{
        padding: "56px 20px", textAlign: "center", borderRadius: 0,
        border: `1px dashed ${isDragging ? "var(--text-primary)" : "var(--slider-track)"}`,
        background: isDragging ? "var(--bg-secondary)" : "transparent",
        cursor: "pointer", transition: "all 0.2s", marginBottom: 36,
      }}
    >
      <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/tiff"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) processFile(f); }}
        style={{ display: "none" }} />
      <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 500, color: "var(--text-primary)", marginBottom: 8 }}>
        Drop your seamless pattern here
      </p>
      <p style={{ color: "var(--text-muted)", fontSize: 13, letterSpacing: "0.02em" }}>
        or click to browse — PNG, JPG, TIFF accepted
      </p>
    </div>
  );
}
