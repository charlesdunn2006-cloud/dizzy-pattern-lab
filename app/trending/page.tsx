"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { TRENDING_PATTERNS, getCurrentMonth, TrendingPattern } from "./data";
import PatternPreview from "./PatternPreview";
import { supabase } from "../lib/supabase";

interface ImageCache {
  [patternId: string]: string; // patternId -> thumbnail dataURL
}

// Load cached preview images from Supabase
async function loadImageCacheFromDB(month: string): Promise<ImageCache> {
  try {
    const { data, error } = await supabase
      .from("trending_previews")
      .select("pattern_id, thumbnail_data_url")
      .eq("month", month);
    if (error || !data) return {};
    const cache: ImageCache = {};
    data.forEach((row) => {
      cache[row.pattern_id] = row.thumbnail_data_url;
    });
    return cache;
  } catch {
    return {};
  }
}

// Save a single preview image to Supabase
async function savePreviewToDB(patternId: string, month: string, thumbnailDataUrl: string) {
  try {
    await supabase
      .from("trending_previews")
      .upsert({
        id: `${month}-${patternId}`,
        pattern_id: patternId,
        month,
        thumbnail_data_url: thumbnailDataUrl,
      }, { onConflict: "id" });
  } catch {
    // silently fail — localStorage fallback still works
  }
}

// Resize a base64 image to a small thumbnail using canvas
function createThumbnail(b64: string, width: number, height: number): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", 0.7));
    };
    img.onerror = () => resolve("");
    img.src = `data:image/png;base64,${b64}`;
  });
}

// Individual pattern card with lazy image loading
function TrendingCard({
  pattern,
  index,
  onSelect,
  cachedImage,
  cacheLoaded,
  onImageLoaded,
  autoLoad,
}: {
  pattern: TrendingPattern;
  index: number;
  onSelect: (pattern: TrendingPattern) => void;
  cachedImage: string | null;
  cacheLoaded: boolean;
  onImageLoaded: (id: string, thumbnail: string) => void;
  autoLoad: boolean;
}) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(false);
  const hasStarted = useRef(false);

  // Sync with parent cache when Supabase data loads
  useEffect(() => {
    if (cachedImage) {
      setImageUrl(cachedImage);
    }
  }, [cachedImage]);

  const generatePreview = useCallback(async () => {
    if (isGenerating || imageUrl || hasStarted.current) return;
    hasStarted.current = true;
    setIsGenerating(true);
    setError(false);
    try {
      const res = await fetch("/api/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: pattern.prompt }),
      });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      if (data.image) {
        const fullUrl = `data:image/png;base64,${data.image}`;
        setImageUrl(fullUrl);
        // Create a small thumbnail for caching
        const thumb = await createThumbnail(data.image, 320, 200);
        if (thumb) {
          onImageLoaded(pattern.id, thumb);
        }
      }
    } catch {
      setError(true);
      hasStarted.current = false;
    } finally {
      setIsGenerating(false);
    }
  }, [pattern.prompt, pattern.id, isGenerating, imageUrl, onImageLoaded]);

  // Auto-load if enabled (progressive loading)
  useEffect(() => {
    if (autoLoad && !imageUrl && !isGenerating && !error) {
      generatePreview();
    }
  }, [autoLoad, imageUrl, isGenerating, error, generatePreview]);

  return (
    <button
      onClick={() => onSelect(pattern)}
      style={{
        textAlign: "left",
        border: "1px solid var(--border)",
        background: "#ffffff",
        cursor: "pointer",
        padding: 0,
        transition: "all 0.2s",
        display: "flex",
        flexDirection: "column",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "var(--accent)";
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.08)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "var(--border)";
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      {/* Image area */}
      <div
        style={{
          width: "100%",
          height: 200,
          overflow: "hidden",
          position: "relative",
          background: "#f5f5f0",
        }}
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={pattern.title}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
            }}
          />
        ) : isGenerating ? (
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 12,
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                border: "3px solid var(--border)",
                borderTopColor: "var(--accent)",
                borderRadius: "50%",
                animation: "spin 1s linear infinite",
              }}
            />
            <span
              style={{
                fontSize: 11,
                color: "var(--text-muted)",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
              }}
            >
              Generating...
            </span>
          </div>
        ) : error ? (
          <div
            style={{
              width: "100%",
              height: "100%",
              position: "relative",
            }}
          >
            <PatternPreview pattern={pattern} width={280} height={200} />
            <div
              style={{
                position: "absolute",
                bottom: 8,
                right: 8,
                background: "rgba(0,0,0,0.6)",
                color: "#fff",
                fontSize: 10,
                padding: "3px 8px",
                borderRadius: 3,
                cursor: "pointer",
              }}
              onClick={(e) => {
                e.stopPropagation();
                setError(false);
                hasStarted.current = false;
              }}
            >
              Retry
            </div>
          </div>
        ) : !cacheLoaded ? (
          <div
            style={{
              width: "100%",
              height: "100%",
              background: "#f5f5f0",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                width: 24,
                height: 24,
                border: "2px solid var(--border)",
                borderTopColor: "var(--accent)",
                borderRadius: "50%",
                animation: "spin 1s linear infinite",
                opacity: 0.5,
              }}
            />
          </div>
        ) : (
          <PatternPreview pattern={pattern} width={280} height={200} />
        )}
      </div>

      {/* Content */}
      <div style={{ padding: "16px 20px", flex: 1 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 8,
          }}
        >
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.1em",
              color: "var(--accent)",
            }}
          >
            #{index + 1}
          </span>
          <span
            style={{
              fontSize: 10,
              fontWeight: 500,
              letterSpacing: "0.12em",
              color: "var(--text-muted)",
              textTransform: "uppercase",
            }}
          >
            {pattern.category}
          </span>
        </div>

        <h3
          style={{
            fontSize: 18,
            fontWeight: 500,
            color: "var(--text-primary)",
            marginBottom: 6,
            lineHeight: 1.3,
            fontFamily: "'Cormorant Garamond', Georgia, serif",
          }}
        >
          {pattern.title}
        </h3>

        <p
          style={{
            fontSize: 13,
            color: "var(--text-secondary)",
            lineHeight: 1.5,
            marginBottom: 12,
          }}
        >
          {pattern.description}
        </p>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              flex: 1,
              height: 4,
              background: "var(--border)",
              borderRadius: 2,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${pattern.popularity}%`,
                height: "100%",
                background: "var(--accent)",
                borderRadius: 2,
              }}
            />
          </div>
          <span
            style={{
              fontSize: 11,
              color: "var(--text-muted)",
              fontWeight: 500,
              minWidth: 28,
            }}
          >
            {pattern.popularity}%
          </span>
        </div>
      </div>

      <div
        style={{
          padding: "12px 20px",
          borderTop: "1px solid var(--border)",
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: "0.1em",
          color: "var(--accent)",
          textTransform: "uppercase",
        }}
      >
        Generate This Pattern &rarr;
      </div>
    </button>
  );
}

export default function TrendingPage() {
  const router = useRouter();
  const currentMonth = getCurrentMonth();
  const [patterns, setPatterns] = useState<TrendingPattern[]>(TRENDING_PATTERNS);
  const [isLive, setIsLive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [imageCache, setImageCache] = useState<ImageCache>({});
  const [cacheLoaded, setCacheLoaded] = useState(false);
  const [loadingIndex, setLoadingIndex] = useState(-1);
  const [isGeneratingAll, setIsGeneratingAll] = useState(false);
  const loadingRef = useRef(false);

  // Load cached data on mount
  useEffect(() => {
    // Load trending text data
    const cached = localStorage.getItem("trending_cache");
    if (cached) {
      try {
        const data = JSON.parse(cached);
        if (data.month === currentMonth && data.patterns?.length > 0) {
          setPatterns(data.patterns);
          setIsLive(true);
        }
      } catch {
        /* use static fallback */
      }
    }
    // Load cached images from Supabase
    loadImageCacheFromDB(currentMonth).then((dbCache) => {
      if (Object.keys(dbCache).length > 0) {
        setImageCache(dbCache);
      }
      setCacheLoaded(true);
    });
  }, [currentMonth]);

  const handleRefresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/trending");
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to fetch");
      }
      const data = await res.json();
      if (data.patterns?.length > 0) {
        setPatterns(data.patterns);
        setIsLive(true);
        localStorage.setItem("trending_cache", JSON.stringify(data));
        // Clear image cache for new patterns and auto-generate previews after render
        setImageCache({});
        setTimeout(() => {
          loadingRef.current = true;
          setIsGeneratingAll(true);
          setLoadingIndex(0);
        }, 500);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to refresh trends");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleImageLoaded = useCallback((id: string, thumbnail: string) => {
    setImageCache((prev) => {
      const updated = { ...prev, [id]: thumbnail };
      return updated;
    });
    // Persist to Supabase
    savePreviewToDB(id, currentMonth, thumbnail);
  }, [currentMonth]);

  // Progressive loading: just advance to next index
  const advanceLoading = useCallback(() => {
    setLoadingIndex((prev) => {
      const next = prev + 1;
      if (next >= patterns.length) {
        setIsGeneratingAll(false);
        loadingRef.current = false;
        return -1;
      }
      return next;
    });
  }, [patterns.length]);

  // When an image finishes loading, advance to next
  const handleImageLoadedAndAdvance = useCallback(
    (id: string, thumbnail: string) => {
      handleImageLoaded(id, thumbnail);
      if (loadingRef.current) {
        setTimeout(() => advanceLoading(), 500);
      }
    },
    [handleImageLoaded, advanceLoading]
  );

  const handleSelect = (pattern: TrendingPattern) => {
    sessionStorage.setItem("trending_prompt", pattern.prompt);
    // If we have a cached image, pass it so the generator skips regeneration
    const cachedImg = imageCache[pattern.id];
    if (cachedImg) {
      sessionStorage.setItem("trending_image", cachedImg);
    }
    router.push("/");
  };

  // Count how many images are loaded
  const loadedCount = patterns.filter((p) => imageCache[p.id]).length;
  const allLoaded = loadedCount === patterns.length;

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)" }}>
      {/* Spinner animation */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>

      {/* Header */}
      <header
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "24px 24px 0",
          background: "#FFF8F0",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <a
          href="/"
          style={{
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontSize: 28,
            fontWeight: 600,
            color: "var(--text-primary)",
            letterSpacing: "0.04em",
            textDecoration: "none",
            marginBottom: 6,
          }}
        >
          Dizzy with Excitement
        </a>
        <p
          style={{
            fontSize: 11,
            fontWeight: 500,
            letterSpacing: "0.15em",
            color: "var(--text-muted)",
            marginBottom: 16,
            textTransform: "uppercase",
          }}
        >
          AI Pattern Generator
        </p>
        <nav style={{ display: "flex", gap: 32, paddingBottom: 16 }}>
          <a
            href="/"
            style={{
              color: "var(--text-secondary)",
              textDecoration: "none",
              fontSize: 12,
              fontWeight: 500,
              letterSpacing: "0.12em",
            }}
          >
            GENERATOR
          </a>
          <span
            style={{
              color: "var(--text-primary)",
              fontSize: 12,
              fontWeight: 500,
              letterSpacing: "0.12em",
              borderBottom: "2px solid var(--text-primary)",
              paddingBottom: 2,
            }}
          >
            TRENDING {new Date().getFullYear()}
          </span>
          <a
            href="/saved"
            style={{
              color: "var(--text-secondary)",
              textDecoration: "none",
              fontSize: 12,
              fontWeight: 500,
              letterSpacing: "0.12em",
            }}
          >
            SAVED
          </a>
        </nav>
      </header>

      <main style={{ maxWidth: 960, margin: "0 auto", padding: "48px 24px 100px" }}>
        {/* Title */}
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <p
            style={{
              fontSize: 11,
              fontWeight: 500,
              letterSpacing: "0.2em",
              color: "var(--text-muted)",
              marginBottom: 12,
              textTransform: "uppercase",
            }}
          >
            {currentMonth}
          </p>
          <h1
            style={{
              fontSize: 36,
              fontWeight: 500,
              color: "var(--text-primary)",
              marginBottom: 14,
              lineHeight: 1.2,
              fontFamily: "'Cormorant Garamond', Georgia, serif",
            }}
          >
            Trending Wallpapers
          </h1>
          <p
            style={{
              color: "var(--text-secondary)",
              fontSize: 15,
              lineHeight: 1.7,
              maxWidth: 560,
              margin: "0 auto",
            }}
          >
            {isLive
              ? "Fresh trends generated by AI based on current search data. Click any design to generate it."
              : "The most popular wallpaper patterns this month. Click any design to generate it instantly with AI."}
          </p>
          {isLive && (
            <span
              style={{
                display: "inline-block",
                marginTop: 10,
                padding: "4px 12px",
                background: "var(--accent)",
                color: "#fff",
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
              }}
            >
              LIVE TRENDS
            </span>
          )}
        </div>

        {/* Action button */}
        <div style={{ textAlign: "center", marginBottom: 24, display: "flex", justifyContent: "center", gap: 12, flexWrap: "wrap" }}>
          <button
            onClick={handleRefresh}
            disabled={isLoading || isGeneratingAll}
            style={{
              padding: "10px 24px",
              border: "none",
              background: (isLoading || isGeneratingAll) ? "var(--bg-card)" : "var(--accent)",
              color: (isLoading || isGeneratingAll) ? "var(--text-muted)" : "#fff",
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: "0.1em",
              cursor: (isLoading || isGeneratingAll) ? "not-allowed" : "pointer",
              textTransform: "uppercase",
            }}
          >
            {isLoading
              ? "REFRESHING..."
              : isGeneratingAll
                ? `GENERATING PREVIEWS (${loadedCount}/${patterns.length})...`
                : "REFRESH TRENDS"}
          </button>
          {allLoaded && (
            <span style={{
              padding: "10px 24px",
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: "0.1em",
              color: "var(--accent)",
              textTransform: "uppercase",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}>
              ✓ ALL PREVIEWS LOADED
            </span>
          )}
        </div>

        {/* Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: 20,
          }}
        >
          {patterns.map((pattern, index) => (
            <TrendingCard
              key={pattern.id}
              pattern={pattern}
              index={index}
              onSelect={(pattern) => handleSelect(pattern)}
              cachedImage={imageCache[pattern.id] || null}
              cacheLoaded={cacheLoaded}
              onImageLoaded={handleImageLoadedAndAdvance}
              autoLoad={isGeneratingAll && loadingIndex === index}
            />
          ))}
        </div>
      </main>
    </div>
  );
}
