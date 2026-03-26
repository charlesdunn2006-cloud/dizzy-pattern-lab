"use client";

import { useState, useCallback, useEffect } from "react";
import { ProductTemplate } from "../types";
import { saveProject, createThumbnail, SavedProject } from "../lib/storage";
import PatternGenerator from "./PatternGenerator";
import FileUpload from "./FileUpload";
import WallDimensions from "./WallDimensions";
import PatternControls from "./PatternControls";
import PreviewCanvas from "./PreviewCanvas";
import DownloadSection from "./DownloadSection";
import SeamlessChecker from "./SeamlessChecker";
import Header from "./Header";

type Tab = "generate" | "upload";

export default function PatternLab() {
  const [activeTab, setActiveTab] = useState<Tab>("generate");
  const [patternImage, setPatternImage] = useState<HTMLImageElement | null>(null);
  const [patternFileName, setPatternFileName] = useState("");
  const [patternDescription, setPatternDescription] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<ProductTemplate | null>(null);
  const [scale, setScale] = useState(50);
  const [rotation, setRotation] = useState(0);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [downloadFileName, setDownloadFileName] = useState("");
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [projectName, setProjectName] = useState("");
  const [showSaveForm, setShowSaveForm] = useState(false);

  // Load project from sessionStorage (coming from /saved page)
  useEffect(() => {
    const raw = sessionStorage.getItem("load_project");
    if (raw) {
      sessionStorage.removeItem("load_project");
      try {
        const project: SavedProject = JSON.parse(raw);
        const img = new Image();
        img.onload = () => {
          setPatternImage(img);
          setPatternFileName(project.name);
          setPatternDescription(project.description);
          setScale(project.scale);
          setRotation(project.rotation);
          setOffsetX(0);
          setOffsetY(0);
        };
        img.src = project.imageDataUrl;
      } catch { /* ignore parse errors */ }
    }
  }, []);

  const resetPattern = useCallback(() => {
    setPatternImage(null);
    setPatternFileName("");
    setPatternDescription("");
    setSelectedTemplate(null);
    setOffsetX(0); setOffsetY(0); setScale(50); setRotation(0);
    setSaveStatus("idle");
    setShowSaveForm(false);
  }, []);

  const handleFileUpload = useCallback((img: HTMLImageElement, fileName: string) => {
    setPatternImage(img);
    setPatternFileName(fileName);
    setOffsetX(0); setOffsetY(0); setScale(50); setRotation(0);
    setSaveStatus("idle");
  }, []);

  const handleAIGenerated = useCallback((img: HTMLImageElement) => {
    setPatternImage(img);
    setPatternFileName("ai-generated-pattern.png");
    setOffsetX(0); setOffsetY(0); setScale(50); setRotation(0);
    setSaveStatus("idle");
  }, []);

  const handleSaveProject = useCallback(() => {
    if (!patternImage) return;
    setSaveStatus("saving");

    // Get the full image as data URL
    const canvas = document.createElement("canvas");
    canvas.width = patternImage.width;
    canvas.height = patternImage.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) { setSaveStatus("idle"); return; }
    ctx.drawImage(patternImage, 0, 0);
    const imageDataUrl = canvas.toDataURL("image/png");
    const thumbnailDataUrl = createThumbnail(patternImage);

    saveProject({
      name: projectName.trim() || patternFileName || "Untitled Pattern",
      description: patternDescription,
      imageDataUrl,
      thumbnailDataUrl,
      scale,
      rotation,
      wallWidthFeet: 10,
      wallHeightFeet: 8,
      tileSize: '24" × 24"',
    });

    setSaveStatus("saved");
    setShowSaveForm(false);
    setTimeout(() => setSaveStatus("idle"), 3000);
  }, [patternImage, patternFileName, patternDescription, projectName, scale, rotation]);

  const tabStyle = (tab: Tab): React.CSSProperties => ({
    padding: "12px 24px",
    border: "none",
    borderBottom: activeTab === tab ? "2px solid var(--text-primary)" : "2px solid transparent",
    background: "transparent",
    color: activeTab === tab ? "var(--text-primary)" : "var(--text-muted)",
    fontSize: 12,
    fontWeight: 500,
    letterSpacing: "0.12em",
    cursor: "pointer",
    textTransform: "uppercase",
    transition: "all 0.2s",
  });

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)" }}>
      <Header />

      <main style={{ maxWidth: 820, margin: "0 auto", padding: "48px 24px 100px" }}>
        {/* Hero */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <p style={{
            fontSize: 11, fontWeight: 500, letterSpacing: "0.2em",
            color: "var(--text-muted)", marginBottom: 12, textTransform: "uppercase",
          }}>
            AI-Powered Design Tool
          </p>
          <h1 style={{
            fontSize: 36, fontWeight: 500, color: "var(--text-primary)",
            marginBottom: 14, lineHeight: 1.2,
            fontFamily: "'Cormorant Garamond', Georgia, serif",
          }}>
            AI Pattern Generator
          </h1>
          <p style={{
            color: "var(--text-secondary)", fontSize: 15, lineHeight: 1.7,
            maxWidth: 600, margin: "0 auto 20px",
          }}>
            Describe your wallpaper pattern idea, set your wall dimensions, and AI will generate a seamless, print-ready design
          </p>
        </div>

        {/* Tabs */}
        <div style={{
          display: "flex", gap: 0, marginBottom: 36,
          borderBottom: "1px solid var(--border)",
        }}>
          <button style={tabStyle("generate")} onClick={() => setActiveTab("generate")}>
            Text to Pattern
          </button>
          <button style={tabStyle("upload")} onClick={() => setActiveTab("upload")}>
            Image Upload
          </button>
        </div>

        {/* Tab content */}
        {activeTab === "generate" ? (
          <>
            <PatternGenerator
              onPatternGenerated={handleAIGenerated}
              onDescriptionChange={setPatternDescription}
            />
            <WallDimensions />
          </>
        ) : (
          <>
            <FileUpload
              onUpload={handleFileUpload}
              onClear={resetPattern}
              hasFile={!!patternImage}
              fileName={patternFileName}
            />
            <WallDimensions />
          </>
        )}

        {/* Shared controls — shown when pattern exists */}
        {patternImage && (
          <>
            {/* Pattern ready bar + save */}
            <div style={{
              padding: "16px 20px", marginBottom: 24,
              background: "var(--success-bg)", border: "1px solid var(--border)",
              display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap",
            }}>
              <span style={{ color: "var(--success)", fontSize: 16 }}>&#10003;</span>
              <span style={{ fontSize: 14, color: "var(--text-primary)" }}>
                Pattern ready — {patternImage.width} &times; {patternImage.height}px
              </span>
              <div style={{ marginLeft: "auto", display: "flex", gap: 10, alignItems: "center" }}>
                {saveStatus === "saved" ? (
                  <span style={{
                    fontSize: 12, color: "var(--success)", fontWeight: 500,
                    letterSpacing: "0.06em",
                  }}>
                    &#10003; SAVED
                  </span>
                ) : (
                  <button
                    onClick={() => setShowSaveForm(!showSaveForm)}
                    style={{
                      background: "var(--accent)", border: "none",
                      color: "#fff", cursor: "pointer", fontSize: 11,
                      fontWeight: 600, letterSpacing: "0.1em",
                      padding: "8px 16px", textTransform: "uppercase",
                    }}
                  >
                    SAVE PROJECT
                  </button>
                )}
                {activeTab === "generate" && (
                  <button
                    onClick={resetPattern}
                    style={{
                      background: "none", border: "none",
                      color: "var(--text-muted)", cursor: "pointer", fontSize: 11,
                      letterSpacing: "0.08em", textDecoration: "underline",
                      textUnderlineOffset: 3,
                    }}
                  >
                    CLEAR
                  </button>
                )}
              </div>
            </div>

            {/* Save form */}
            {showSaveForm && (
              <div style={{
                padding: "20px", marginBottom: 24, background: "#ffffff",
                border: "1px solid var(--border)",
              }}>
                <label style={{
                  display: "block", fontSize: 10, fontWeight: 500, letterSpacing: "0.18em",
                  textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 8,
                }}>
                  Project Name
                </label>
                <div style={{ display: "flex", gap: 10 }}>
                  <input
                    type="text"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    placeholder={patternFileName || "My Pattern"}
                    style={{
                      flex: 1, padding: "10px 14px", border: "1px solid var(--border)",
                      background: "#ffffff", color: "var(--text-primary)", fontSize: 14,
                      outline: "none",
                    }}
                  />
                  <button
                    onClick={handleSaveProject}
                    disabled={saveStatus === "saving"}
                    style={{
                      padding: "10px 24px", border: "none",
                      background: "var(--accent)", color: "#fff",
                      fontSize: 12, fontWeight: 600, letterSpacing: "0.1em",
                      cursor: saveStatus === "saving" ? "not-allowed" : "pointer",
                      textTransform: "uppercase",
                      opacity: saveStatus === "saving" ? 0.6 : 1,
                    }}
                  >
                    {saveStatus === "saving" ? "SAVING..." : "SAVE"}
                  </button>
                  <button
                    onClick={() => setShowSaveForm(false)}
                    style={{
                      padding: "10px 16px", border: "1px solid var(--border)",
                      background: "#ffffff", color: "var(--text-muted)",
                      fontSize: 12, cursor: "pointer", letterSpacing: "0.08em",
                    }}
                  >
                    CANCEL
                  </button>
                </div>
              </div>
            )}

            <PatternControls
              scale={scale} onScaleChange={setScale}
              rotation={rotation} onRotationChange={setRotation}
              isSeamlessWrap={selectedTemplate?.isSeamlessWrap ?? false}
            />
            <PreviewCanvas
              patternImage={patternImage} template={selectedTemplate}
              scale={scale} rotation={rotation}
              offsetX={offsetX} offsetY={offsetY}
              onOffsetChange={(x, y) => { setOffsetX(x); setOffsetY(y); }}
            />
            <SeamlessChecker
              patternImage={patternImage}
              scale={scale}
              rotation={rotation}
            />
            <DownloadSection
              patternImage={patternImage} template={selectedTemplate}
              scale={scale} rotation={rotation}
              offsetX={offsetX} offsetY={offsetY}
              fileName={downloadFileName} onFileNameChange={setDownloadFileName}
            />
          </>
        )}

        {/* Legal */}
        <div style={{ marginTop: 60, paddingTop: 24, borderTop: "1px solid var(--border)", textAlign: "center" }}>
          <p style={{ fontSize: 10, letterSpacing: "0.15em", fontWeight: 500, color: "var(--text-muted)", marginBottom: 10, textTransform: "uppercase" }}>
            Legal &amp; Intellectual Property
          </p>
          <p style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.8, maxWidth: 560, margin: "0 auto" }}>
            Pattern previews and downloads are processed locally in your browser.
            AI pattern generation is powered by DALL-E 3.
          </p>
        </div>
      </main>

    </div>
  );
}
