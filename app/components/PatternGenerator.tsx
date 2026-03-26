"use client";

import { useState, useCallback, useEffect } from "react";
import { QUICK_IDEAS } from "../types";

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

  // Check for trending prompt passed via sessionStorage
  useEffect(() => {
    const trendingPrompt = sessionStorage.getItem("trending_prompt");
    if (trendingPrompt) {
      updateDescription(trendingPrompt);
      sessionStorage.removeItem("trending_prompt");
    }
  }, []);
  const [apiKey, setApiKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");

  const handleGenerate = useCallback(async () => {
    if (!description.trim()) { setError("Please describe your pattern first."); return; }
    if (!apiKey.trim()) { setError("Please enter your OpenAI API key."); return; }
    setError("");
    setIsGenerating(true);

    try {
      const response = await fetch("https://api.openai.com/v1/images/generations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey.trim()}`,
        },
        body: JSON.stringify({
          model: "dall-e-3",
          prompt: `Create a seamless, tileable wallpaper pattern: ${description.trim()}. The pattern must tile perfectly with no visible seams when repeated. High resolution, print quality, 300 DPI aesthetic.`,
          n: 1,
          size: "1024x1024",
          quality: "hd",
          response_format: "b64_json",
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err?.error?.message || `API error: ${response.status}`);
      }

      const data = await response.json();
      const b64 = data.data[0].b64_json;
      const img = new Image();
      img.onload = () => {
        onPatternGenerated(img);
        setIsGenerating(false);
      };
      img.onerror = () => {
        setError("Failed to load generated image.");
        setIsGenerating(false);
      };
      img.src = `data:image/png;base64,${b64}`;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate pattern.");
      setIsGenerating(false);
    }
  }, [description, apiKey, onPatternGenerated]);

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

      {/* API Key */}
      <div style={{ marginBottom: 20 }}>
        <label style={{
          display: "block", fontSize: 10, fontWeight: 500, letterSpacing: "0.18em",
          textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 8,
        }}>
          OpenAI API Key
        </label>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            type={showApiKey ? "text" : "password"}
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="sk-..."
            style={{
              flex: 1, padding: "10px 14px", border: "1px solid var(--border)",
              background: "var(--bg-primary)", color: "var(--text-primary)", fontSize: 14,
              fontFamily: "monospace", outline: "none",
            }}
          />
          <button
            onClick={() => setShowApiKey(!showApiKey)}
            style={{
              padding: "10px 14px", border: "1px solid var(--border)",
              background: "var(--bg-primary)", color: "var(--text-muted)",
              fontSize: 11, cursor: "pointer", letterSpacing: "0.08em",
              whiteSpace: "nowrap",
            }}
          >
            {showApiKey ? "HIDE" : "SHOW"}
          </button>
        </div>
        <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 6, lineHeight: 1.5 }}>
          Your key stays in your browser and is never stored or sent anywhere except OpenAI.
          Get one at{" "}
          <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer"
            style={{ color: "var(--text-secondary)", textDecoration: "underline", textUnderlineOffset: 2 }}>
            platform.openai.com
          </a>
        </p>
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
