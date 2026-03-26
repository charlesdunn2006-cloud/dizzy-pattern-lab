"use client";

import { useState, useCallback, useEffect } from "react";
import { QUICK_IDEAS } from "../types";
import { makeSeamless } from "../lib/makeSeamless";

interface Props {
  onPatternGenerated: (img: HTMLImageElement) => void;
  onDescriptionChange?: (desc: string) => void;
}

export default function PatternGenerator({ onPatternGenerated, onDescriptionChange }: Props) {
  const [description, setDescription] = useState("");

  const updateDescription = useCallback((val: string) => {
    setDescription(val);
    onDescriptionChange?.(val);
  }, [onDescriptionChange]);

  // Check for trending prompt + optional pre-generated image via sessionStorage
  useEffect(() => {
    const trendingPrompt = sessionStorage.getItem("trending_prompt");
    const trendingImage = sessionStorage.getItem("trending_image");
    if (trendingPrompt) {
      updateDescription(trendingPrompt);
      sessionStorage.removeItem("trending_prompt");
    }
    if (trendingImage) {
      sessionStorage.removeItem("trending_image");
      // Load the cached image and make it seamless
      const img = new Image();
      img.onload = async () => {
        const seamlessImg = await makeSeamless(img);
        onPatternGenerated(seamlessImg);
      };
      img.src = trendingImage;
    }
  }, []);

  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");

  const handleGenerate = useCallback(async () => {
    if (!description.trim()) { setError("Please describe your pattern first."); return; }
    setError("");
    setIsGenerating(true);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: description.trim() }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err?.error || `Server error: ${response.status}`);
      }

      const data = await response.json();
      const img = new Image();
      img.onload = async () => {
        // Auto-apply seamless processing
        const seamlessImg = await makeSeamless(img);
        onPatternGenerated(seamlessImg);
        setIsGenerating(false);
      };
      img.onerror = () => {
        setError("Failed to load generated image.");
        setIsGenerating(false);
      };
      img.src = `data:image/png;base64,${data.image}`;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate pattern.");
      setIsGenerating(false);
    }
  }, [description, onPatternGenerated]);

  return (
    <div style={{ marginBottom: 36 }}>
      {/* Description */}
      <label style={{
        display: "block", fontSize: 10, fontWeight: 500, letterSpacing: "0.18em",
        textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 10,
      }}>
        Pattern Description
      </label>
      <textarea
        value={description}
        onChange={(e) => updateDescription(e.target.value)}
        placeholder="Describe your wallpaper pattern idea..."
        rows={3}
        style={{
          width: "100%", padding: "14px 16px", border: "1px solid var(--border)",
          background: "#ffffff", color: "var(--text-primary)", fontSize: 14,
          fontFamily: "inherit", outline: "none", resize: "vertical", lineHeight: 1.6,
        }}
      />

      {/* Quick ideas */}
      <div style={{ marginTop: 12, marginBottom: 20 }}>
        <span style={{
          fontSize: 11, color: "var(--text-muted)", fontWeight: 500, marginRight: 8,
        }}>
          Quick ideas:
        </span>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
          {QUICK_IDEAS.map((idea) => (
            <button
              key={idea}
              onClick={() => updateDescription(idea)}
              style={{
                padding: "8px 14px", border: "none",
                background: "var(--accent)",
                color: "#fff",
                fontSize: 12, fontWeight: 700, cursor: "pointer", transition: "all 0.15s",
                lineHeight: 1.4,
                opacity: description === idea ? 0.75 : 1,
              }}
            >
              {idea}
            </button>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <p style={{ fontSize: 13, color: "var(--danger)", marginBottom: 16, lineHeight: 1.5 }}>
          {error}
        </p>
      )}

      {/* Generate button */}
      <button
        onClick={handleGenerate}
        disabled={isGenerating}
        style={{
          width: "100%", padding: "16px 20px", border: "none",
          background: isGenerating ? "var(--bg-card)" : "var(--accent)",
          color: isGenerating ? "var(--text-muted)" : "#fff",
          fontSize: 13, fontWeight: 700, letterSpacing: "0.12em",
          cursor: isGenerating ? "not-allowed" : "pointer",
          textTransform: "uppercase", transition: "opacity 0.15s",
          opacity: isGenerating ? 0.6 : 1,
        }}
      >
        {isGenerating ? "GENERATING PATTERN..." : "GENERATE PATTERN"}
      </button>
    </div>
  );
}
