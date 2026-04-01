"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { makeSeamless } from "../lib/makeSeamless";
import Tooltip from "./Tooltip";

interface Props {
  onPatternGenerated: (img: HTMLImageElement) => void;
  onDescriptionChange?: (desc: string) => void;
}

// ── Prompt suggestions organized by category ────────────────────────
const PROMPT_SUGGESTIONS: { category: string; prompts: string[] }[] = [
  {
    category: "Botanical",
    prompts: [
      "Lush tropical leaves with gold metallic accents on cream",
      "Delicate wildflower meadow in soft watercolor pastels",
      "Dense monstera and palm fronds, deep green jungle",
      "Lavender sprigs and eucalyptus in a loose botanical style",
    ],
  },
  {
    category: "Geometric",
    prompts: [
      "Art Deco fan pattern in burgundy and gold",
      "Moroccan zellige tile mosaic in ocean blues",
      "Mid-century modern atomic starburst in teal and mustard",
      "Hexagonal honeycomb with subtle gradient fills",
    ],
  },
  {
    category: "Texture",
    prompts: [
      "Marbled stone swirl in terracotta and ochre",
      "Linen fabric weave texture with subtle color variation",
      "Crackled ceramic glaze in celadon green",
      "Hammered copper surface with verdigris patina",
    ],
  },
  {
    category: "Whimsical",
    prompts: [
      "Cottagecore mushrooms, ferns, and woodland creatures",
      "Japanese wave pattern with scattered cherry blossoms",
      "Celestial moons, stars, and constellations on midnight blue",
      "Playful hand-drawn citrus fruit on a white background",
    ],
  },
];

// ── Style options ───────────────────────────────────────────────────
const STYLES = [
  { value: "any", label: "Any Style" },
  { value: "artistic", label: "Artistic" },
  { value: "minimal", label: "Minimal" },
  { value: "vintage", label: "Vintage" },
  { value: "botanical", label: "Botanical" },
  { value: "geometric", label: "Geometric" },
  { value: "watercolor", label: "Watercolor" },
  { value: "luxe", label: "Luxe" },
];

const COLOR_MOODS = [
  { value: "any", label: "Any Colors" },
  { value: "warm", label: "Warm" },
  { value: "cool", label: "Cool" },
  { value: "earth", label: "Earth Tones" },
  { value: "pastel", label: "Pastel" },
  { value: "bold", label: "Bold" },
  { value: "mono", label: "Monochrome" },
  { value: "neutral", label: "Neutral" },
];

const COMPLEXITY = [
  { value: "any", label: "Any" },
  { value: "simple", label: "Simple" },
  { value: "moderate", label: "Moderate" },
  { value: "intricate", label: "Intricate" },
];

// ── Loading messages ────────────────────────────────────────────────
const LOADING_MESSAGES = [
  "Designing your pattern...",
  "Mixing the perfect palette...",
  "Arranging the composition...",
  "Ensuring seamless tiling...",
  "Adding rich textures...",
  "Refining the details...",
  "Almost there...",
];

// ── Pill select ─────────────────────────────────────────────────────
function PillSelect({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div
        style={{
          fontSize: 10,
          fontWeight: 500,
          letterSpacing: "0.14em",
          textTransform: "uppercase" as const,
          color: "var(--text-muted)",
          marginBottom: 8,
        }}
      >
        {label}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            style={{
              padding: "6px 14px",
              fontSize: 12,
              fontWeight: 500,
              borderRadius: 20,
              border: `1.5px solid ${value === opt.value ? "var(--accent)" : "var(--border)"}`,
              background: value === opt.value ? "var(--accent)" : "transparent",
              color: value === opt.value ? "#fff" : "var(--text-secondary)",
              cursor: "pointer",
              transition: "all 0.15s",
              lineHeight: 1.3,
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function PatternGenerator({ onPatternGenerated, onDescriptionChange }: Props) {
  const [description, setDescription] = useState("");
  const [style, setStyle] = useState("any");
  const [colorMood, setColorMood] = useState("any");
  const [complexity, setComplexity] = useState("any");
  const [numVariations, setNumVariations] = useState(1);
  const [variants, setVariants] = useState<HTMLImageElement[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const updateDescription = useCallback(
    (val: string) => {
      setDescription(val);
      onDescriptionChange?.(val);
    },
    [onDescriptionChange]
  );

  // Check for trending prompt + optional pre-generated image
  useEffect(() => {
    const trendingPrompt = sessionStorage.getItem("trending_prompt");
    const trendingImage = sessionStorage.getItem("trending_image");
    if (trendingPrompt) {
      updateDescription(trendingPrompt);
      sessionStorage.removeItem("trending_prompt");
    }
    if (trendingImage) {
      sessionStorage.removeItem("trending_image");
      const img = new Image();
      img.onload = async () => {
        const seamlessImg = await makeSeamless(img);
        onPatternGenerated(seamlessImg);
      };
      img.src = trendingImage;
    }
  }, []);

  // Close suggestions on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState(0);
  const [loadingMsgIndex, setLoadingMsgIndex] = useState(0);

  // Progress bar animation
  useEffect(() => {
    if (!isGenerating) {
      setProgress(0);
      setLoadingMsgIndex(0);
      return;
    }
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 92) return 92; // hold at 92 until done
        return prev + 0.6;
      });
    }, 100);
    return () => clearInterval(interval);
  }, [isGenerating]);

  // Rotate loading messages
  useEffect(() => {
    if (!isGenerating) return;
    const interval = setInterval(() => {
      setLoadingMsgIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [isGenerating]);

  const handleSelectVariant = useCallback(async (img: HTMLImageElement) => {
    const seamlessImg = await makeSeamless(img);
    onPatternGenerated(seamlessImg);
    setVariants([]);
  }, [onPatternGenerated]);

  const handleGenerate = useCallback(async () => {
    if (!description.trim()) {
      setError("Please describe your pattern first.");
      return;
    }
    setError("");
    setIsGenerating(true);
    setProgress(0);
    setVariants([]);

    const body = {
      description: description.trim(),
      style: style !== "any" ? style : undefined,
      colorMood: colorMood !== "any" ? colorMood : undefined,
      complexity: complexity !== "any" ? complexity : undefined,
    };

    try {
      // Fire N parallel requests
      const fetches = Array.from({ length: numVariations }, () =>
        fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        })
      );

      const responses = await Promise.all(fetches);

      // Parse all responses
      const results: string[] = [];
      for (const resp of responses) {
        if (!resp.ok) {
          const err = await resp.json().catch(() => ({}));
          throw new Error(err?.error || `Server error: ${resp.status}`);
        }
        const data = await resp.json();
        results.push(data.image);
      }

      setProgress(95);

      // Load all images
      const loadImage = (b64: string): Promise<HTMLImageElement> =>
        new Promise((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve(img);
          img.onerror = () => reject(new Error("Failed to load image"));
          img.src = `data:image/png;base64,${b64}`;
        });

      const images = await Promise.all(results.map(loadImage));
      setProgress(100);

      if (images.length === 1) {
        // Single variation — apply directly
        const seamlessImg = await makeSeamless(images[0]);
        onPatternGenerated(seamlessImg);
        setIsGenerating(false);
      } else {
        // Multiple variations — show picker
        setVariants(images);
        setIsGenerating(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate pattern.");
      setIsGenerating(false);
    }
  }, [description, style, colorMood, complexity, numVariations, onPatternGenerated]);

  return (
    <div style={{ marginBottom: 36 }}>
      {/* ── Prompt input ────────────────────────────────────────── */}
      <div style={{ position: "relative", marginBottom: 12 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 10,
          }}
        >
          <Tooltip text="Describe the colors, style, and motifs you want" position="bottom">
            <label
              style={{
                fontSize: 10,
                fontWeight: 500,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "var(--text-muted)",
                cursor: "default",
              }}
            >
              Describe your pattern
            </label>
          </Tooltip>
          <div style={{ display: "flex", gap: 6 }}>
            {/* Suggestions toggle */}
            <Tooltip text="Browse curated prompt ideas by category">
              <button
                type="button"
                onClick={() => {
                  setShowSuggestions(!showSuggestions);
                  setShowSettings(false);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  padding: "4px 10px",
                  fontSize: 11,
                  fontWeight: 500,
                  borderRadius: 6,
                  border: "1px solid var(--border)",
                  background: showSuggestions ? "var(--accent)" : "transparent",
                  color: showSuggestions ? "#fff" : "var(--text-muted)",
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />
                  <path d="M9 18h6" />
                  <path d="M10 22h4" />
                </svg>
                Ideas
              </button>
            </Tooltip>
            {/* Settings toggle */}
            <Tooltip text="Adjust style, color mood, and complexity">
              <button
                type="button"
                onClick={() => {
                  setShowSettings(!showSettings);
                  setShowSuggestions(false);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  padding: "4px 10px",
                  fontSize: 11,
                  fontWeight: 500,
                  borderRadius: 6,
                  border: "1px solid var(--border)",
                  background: showSettings ? "var(--accent)" : "transparent",
                  color: showSettings ? "#fff" : "var(--text-muted)",
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
                Style
              </button>
            </Tooltip>
          </div>
        </div>

        <textarea
          value={description}
          onChange={(e) => updateDescription(e.target.value)}
          placeholder="A tropical monstera leaf pattern with gold metallic accents on cream linen..."
          rows={3}
          style={{
            width: "100%",
            padding: "14px 16px",
            border: "1px solid var(--border)",
            borderRadius: 10,
            background: "#ffffff",
            color: "var(--text-primary)",
            fontSize: 14,
            fontFamily: "inherit",
            outline: "none",
            resize: "vertical",
            lineHeight: 1.6,
            transition: "border-color 0.2s",
          }}
          onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
          onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
        />

        {/* ── Suggestions dropdown ──────────────────────────────── */}
        {showSuggestions && (
          <div
            ref={suggestionsRef}
            style={{
              marginTop: 8,
              border: "1px solid var(--border)",
              borderRadius: 10,
              background: "#fff",
              boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
              overflow: "hidden",
            }}
          >
            {PROMPT_SUGGESTIONS.map((cat) => (
              <div key={cat.category}>
                <div
                  style={{
                    padding: "10px 16px 6px",
                    fontSize: 10,
                    fontWeight: 600,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    color: "var(--text-muted)",
                    background: "var(--bg-secondary)",
                  }}
                >
                  {cat.category}
                </div>
                {cat.prompts.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => {
                      updateDescription(prompt);
                      setShowSuggestions(false);
                    }}
                    style={{
                      display: "block",
                      width: "100%",
                      textAlign: "left",
                      padding: "10px 16px",
                      border: "none",
                      background: "transparent",
                      fontSize: 13,
                      color: "var(--text-primary)",
                      cursor: "pointer",
                      transition: "background 0.1s",
                      lineHeight: 1.4,
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = "var(--bg-warm)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "transparent")
                    }
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            ))}
          </div>
        )}

        {/* ── Style settings panel ──────────────────────────────── */}
        {showSettings && (
          <div
            style={{
              marginTop: 8,
              padding: "20px",
              border: "1px solid var(--border)",
              borderRadius: 10,
              background: "#fff",
              boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
            }}
          >
            <PillSelect label="Style" options={STYLES} value={style} onChange={setStyle} />
            <PillSelect label="Color Mood" options={COLOR_MOODS} value={colorMood} onChange={setColorMood} />
            <PillSelect label="Complexity" options={COMPLEXITY} value={complexity} onChange={setComplexity} />
            {(style !== "any" || colorMood !== "any" || complexity !== "any") && (
              <button
                type="button"
                onClick={() => {
                  setStyle("any");
                  setColorMood("any");
                  setComplexity("any");
                }}
                style={{
                  fontSize: 11,
                  color: "var(--text-muted)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  textDecoration: "underline",
                  textUnderlineOffset: 3,
                  marginTop: 4,
                }}
              >
                Reset all to defaults
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Active style tags ───────────────────────────────────── */}
      {(style !== "any" || colorMood !== "any" || complexity !== "any") && !showSettings && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
          {style !== "any" && (
            <span
              style={{
                padding: "4px 10px",
                fontSize: 11,
                fontWeight: 500,
                borderRadius: 20,
                background: "var(--bg-warm)",
                color: "var(--accent)",
                border: "1px solid var(--accent)",
              }}
            >
              {STYLES.find((s) => s.value === style)?.label}
            </span>
          )}
          {colorMood !== "any" && (
            <span
              style={{
                padding: "4px 10px",
                fontSize: 11,
                fontWeight: 500,
                borderRadius: 20,
                background: "var(--bg-warm)",
                color: "var(--accent)",
                border: "1px solid var(--accent)",
              }}
            >
              {COLOR_MOODS.find((c) => c.value === colorMood)?.label}
            </span>
          )}
          {complexity !== "any" && (
            <span
              style={{
                padding: "4px 10px",
                fontSize: 11,
                fontWeight: 500,
                borderRadius: 20,
                background: "var(--bg-warm)",
                color: "var(--accent)",
                border: "1px solid var(--accent)",
              }}
            >
              {COMPLEXITY.find((c) => c.value === complexity)?.label}
            </span>
          )}
        </div>
      )}

      {/* ── Error ───────────────────────────────────────────────── */}
      {error && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 14px",
            marginBottom: 16,
            borderRadius: 8,
            background: "rgba(194,74,74,0.06)",
            border: "1px solid rgba(194,74,74,0.15)",
          }}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--danger)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span style={{ fontSize: 13, color: "var(--danger)", lineHeight: 1.4 }}>{error}</span>
        </div>
      )}

      {/* ── Variations picker ──────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 16,
        }}
      >
        <span
          style={{
            fontSize: 10,
            fontWeight: 500,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "var(--text-muted)",
          }}
        >
          Variations
        </span>
        <div style={{ display: "flex", gap: 4 }}>
          {([1, 2, 3] as const).map((n) => (
            <Tooltip
              key={n}
              text={
                n === 1
                  ? "Generate a single pattern"
                  : `Generate ${n} options to choose from`
              }
              position="bottom"
            >
              <button
                type="button"
                onClick={() => setNumVariations(n)}
                style={{
                  width: 36,
                  height: 32,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 13,
                  fontWeight: 600,
                  borderRadius: 8,
                  border: `1.5px solid ${numVariations === n ? "var(--accent)" : "var(--border)"}`,
                  background: numVariations === n ? "var(--accent)" : "transparent",
                  color: numVariations === n ? "#fff" : "var(--text-secondary)",
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
              >
                {n}
              </button>
            </Tooltip>
          ))}
        </div>
        <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
          {numVariations === 1
            ? "pattern"
            : `patterns — pick your favorite`}
        </span>
      </div>

      {/* ── Generate button + progress ──────────────────────────── */}
      {isGenerating ? (
        <div
          style={{
            padding: "24px 20px",
            borderRadius: 10,
            background: "var(--bg-warm)",
            border: "1px solid var(--border)",
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: 14,
              fontWeight: 500,
              color: "var(--text-primary)",
              marginBottom: 6,
              transition: "opacity 0.3s",
            }}
          >
            {LOADING_MESSAGES[loadingMsgIndex]}
          </div>
          <div
            style={{
              fontSize: 12,
              color: "var(--text-muted)",
              marginBottom: 16,
            }}
          >
            {numVariations === 1
              ? "This usually takes 10–20 seconds"
              : `Generating ${numVariations} variations — this may take a bit longer`}
          </div>
          {/* Progress bar */}
          <div
            style={{
              width: "100%",
              height: 4,
              background: "var(--border)",
              borderRadius: 2,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${progress}%`,
                background: "var(--accent)",
                borderRadius: 2,
                transition: "width 0.3s ease",
              }}
            />
          </div>
        </div>
      ) : (
        <Tooltip
          text={
            numVariations === 1
              ? "Create an AI-generated seamless wallpaper pattern"
              : `Create ${numVariations} pattern options and pick your favorite`
          }
          position="bottom"
        >
          <button
            onClick={handleGenerate}
            style={{
              width: "100%",
              padding: "16px 20px",
              border: "none",
              borderRadius: 10,
              background: "var(--accent)",
              color: "#fff",
              fontSize: 13,
              fontWeight: 600,
              letterSpacing: "0.08em",
              cursor: "pointer",
              textTransform: "uppercase",
              transition: "opacity 0.15s, transform 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = "0.9";
              e.currentTarget.style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = "1";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            {numVariations === 1
              ? "Generate Pattern"
              : `Generate ${numVariations} Variations`}
          </button>
        </Tooltip>
      )}

      {/* ── Variant selection grid ─────────────────────────────── */}
      {variants.length > 1 && (
        <div style={{ marginTop: 24 }}>
          <div
            style={{
              fontSize: 10,
              fontWeight: 500,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "var(--text-muted)",
              marginBottom: 12,
              textAlign: "center",
            }}
          >
            Pick your favorite variation
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${variants.length}, 1fr)`,
              gap: 12,
            }}
          >
            {variants.map((img, i) => (
              <Tooltip key={i} text={`Select variation ${i + 1} as your pattern`} position="bottom">
              <button
                type="button"
                onClick={() => handleSelectVariant(img)}
                style={{
                  position: "relative",
                  border: "2px solid var(--border)",
                  borderRadius: 10,
                  overflow: "hidden",
                  cursor: "pointer",
                  padding: 0,
                  background: "var(--bg-card)",
                  transition: "all 0.2s",
                  aspectRatio: "1",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "var(--accent)";
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "0 6px 20px rgba(0,0,0,0.1)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "var(--border)";
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <img
                  src={img.src}
                  alt={`Variation ${i + 1}`}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    display: "block",
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    padding: "8px",
                    background: "linear-gradient(transparent, rgba(0,0,0,0.5))",
                    color: "#fff",
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    textAlign: "center",
                  }}
                >
                  Option {i + 1}
                </div>
              </button>
              </Tooltip>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
