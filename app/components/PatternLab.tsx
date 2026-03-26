"use client";

import { useState, useCallback } from "react";
import { ProductTemplate, PRESET_TEMPLATES } from "../types";
import FileUpload from "./FileUpload";
import TemplateSelector from "./TemplateSelector";
import CustomTemplateBuilder from "./CustomTemplateBuilder";
import PatternControls from "./PatternControls";
import PreviewCanvas from "./PreviewCanvas";
import DownloadSection from "./DownloadSection";
import Header from "./Header";

export default function PatternLab() {
  const [patternImage, setPatternImage] = useState<HTMLImageElement | null>(null);
  const [patternFileName, setPatternFileName] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<ProductTemplate | null>(null);
  const [customTemplates, setCustomTemplates] = useState<ProductTemplate[]>([]);
  const [scale, setScale] = useState(50);
  const [rotation, setRotation] = useState(0);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [downloadFileName, setDownloadFileName] = useState("");

  const handleFileUpload = useCallback((img: HTMLImageElement, fileName: string) => {
    setPatternImage(img); setPatternFileName(fileName);
    setOffsetX(0); setOffsetY(0); setScale(50); setRotation(0);
  }, []);

  const handleClearFile = useCallback(() => {
    setPatternImage(null); setPatternFileName(""); setSelectedTemplate(null);
    setOffsetX(0); setOffsetY(0); setScale(50); setRotation(0);
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)" }}>
      <Header />

      <main style={{ maxWidth: 820, margin: "0 auto", padding: "48px 24px 100px" }}>
        {/* Hero */}
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <p style={{
            fontSize: 11, fontWeight: 500, letterSpacing: "0.2em",
            color: "var(--text-muted)", marginBottom: 12, textTransform: "uppercase",
          }}>
            Member Tool
          </p>
          <h1 style={{
            fontSize: 36, fontWeight: 500, color: "var(--text-primary)",
            marginBottom: 14, lineHeight: 1.2,
            fontFamily: "'Cormorant Garamond', Georgia, serif",
          }}>
            Instant Print-Ready Downloads
          </h1>
          <p style={{
            color: "var(--text-secondary)", fontSize: 15, lineHeight: 1.7,
            maxWidth: 560, margin: "0 auto 20px",
          }}>
            Upload your seamless pattern and export it print-ready for any product — correctly sized at 300 DPI.
          </p>
          <div style={{
            display: "flex", justifyContent: "center", gap: 24,
            fontSize: 12, color: "var(--text-muted)", letterSpacing: "0.04em",
          }}>
            <span>&#10003; Your artwork stays private</span>
            <span>&#10003; Processed in your browser</span>
            <span>&#10003; Nothing uploaded</span>
          </div>
        </div>

        {/* File quality */}
        <div style={{
          textAlign: "center", padding: "12px 20px", marginBottom: 36,
          fontSize: 13, color: "var(--text-muted)", lineHeight: 1.5,
          borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)",
        }}>
          <strong style={{ color: "var(--text-secondary)" }}>File quality:</strong>{" "}
          This tool assumes your uploaded file is 300 DPI. Print quality depends on your original file.
        </div>

        <FileUpload onUpload={handleFileUpload} onClear={handleClearFile} hasFile={!!patternImage} fileName={patternFileName} />
        <TemplateSelector presets={PRESET_TEMPLATES} customTemplates={customTemplates} selected={selectedTemplate} onSelect={setSelectedTemplate} hasPattern={!!patternImage} />
        <CustomTemplateBuilder
          onAdd={(t) => setCustomTemplates((prev) => [...prev, t])}
          customTemplates={customTemplates}
          onDelete={(id) => { setCustomTemplates((prev) => prev.filter((t) => t.id !== id)); if (selectedTemplate?.id === id) setSelectedTemplate(null); }}
          onImport={setCustomTemplates}
        />
        <PatternControls scale={scale} onScaleChange={setScale} rotation={rotation} onRotationChange={setRotation} isSeamlessWrap={selectedTemplate?.isSeamlessWrap ?? false} />
        <PreviewCanvas patternImage={patternImage} template={selectedTemplate} scale={scale} rotation={rotation} offsetX={offsetX} offsetY={offsetY} onOffsetChange={(x, y) => { setOffsetX(x); setOffsetY(y); }} />
        <DownloadSection patternImage={patternImage} template={selectedTemplate} scale={scale} rotation={rotation} offsetX={offsetX} offsetY={offsetY} fileName={downloadFileName} onFileNameChange={setDownloadFileName} />

        {/* Legal */}
        <div style={{ marginTop: 60, paddingTop: 24, borderTop: "1px solid var(--border)", textAlign: "center" }}>
          <p style={{ fontSize: 10, letterSpacing: "0.15em", fontWeight: 500, color: "var(--text-muted)", marginBottom: 10, textTransform: "uppercase" }}>
            Legal &amp; Intellectual Property
          </p>
          <p style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.8, maxWidth: 560, margin: "0 auto" }}>
            All processing happens locally in your browser. Your patterns are never uploaded or stored.
            Default template dimensions are general industry standards — always verify with your supplier&apos;s exact measurements.
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer style={{
        borderTop: "1px solid var(--border)", padding: "20px 24px",
        textAlign: "center", fontSize: 11, color: "var(--text-muted)",
        letterSpacing: "0.05em",
      }}>
        &copy; 2026 Pattern Lab. All rights reserved.
      </footer>
    </div>
  );
}
