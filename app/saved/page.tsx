"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { SavedProject, getSavedProjects, deleteProject } from "../lib/storage";

export default function SavedPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<SavedProject[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  useEffect(() => {
    getSavedProjects().then((data) => {
      setProjects(data);
      setLoaded(true);
    });
  }, []);

  const handleDelete = useCallback(async (id: string) => {
    await deleteProject(id);
    const updated = await getSavedProjects();
    setProjects(updated);
    setConfirmDelete(null);
  }, []);

  const handleOpen = useCallback((project: SavedProject) => {
    sessionStorage.setItem("load_project", JSON.stringify(project));
    router.push("/");
  }, [router]);

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)" }}>
      {/* Header */}
      <header style={{
        display: "flex", flexDirection: "column", alignItems: "center",
        padding: "24px 24px 0", background: "#FFF8F0",
        borderBottom: "1px solid var(--border)",
      }}>
        <a href="/" style={{
          fontFamily: "'Cormorant Garamond', Georgia, serif",
          fontSize: 28, fontWeight: 600, color: "var(--text-primary)",
          letterSpacing: "0.04em", textDecoration: "none", marginBottom: 6,
        }}>
          Dizzy with Excitement
        </a>
        <p style={{
          fontSize: 11, fontWeight: 500, letterSpacing: "0.15em",
          color: "var(--text-muted)", marginBottom: 16, textTransform: "uppercase",
        }}>
          AI Pattern Generator
        </p>
        <nav style={{ display: "flex", gap: 32, paddingBottom: 16 }}>
          <a href="/" style={{
            color: "var(--text-secondary)", textDecoration: "none",
            fontSize: 12, fontWeight: 500, letterSpacing: "0.12em",
          }}>
            GENERATOR
          </a>
          <a href="/trending" style={{
            color: "var(--text-secondary)", textDecoration: "none",
            fontSize: 12, fontWeight: 500, letterSpacing: "0.12em",
          }}>
            TRENDING {new Date().getFullYear()}
          </a>
          <span style={{
            color: "var(--text-primary)", fontSize: 12, fontWeight: 500,
            letterSpacing: "0.12em", borderBottom: "2px solid var(--text-primary)",
            paddingBottom: 2,
          }}>
            SAVED
          </span>
        </nav>
      </header>

      <main style={{ maxWidth: 960, margin: "0 auto", padding: "48px 24px 100px" }}>
        {/* Title */}
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <h1 style={{
            fontSize: 36, fontWeight: 500, color: "var(--text-primary)",
            marginBottom: 14, lineHeight: 1.2,
            fontFamily: "'Cormorant Garamond', Georgia, serif",
          }}>
            Saved Projects
          </h1>
          <p style={{
            color: "var(--text-secondary)", fontSize: 15, lineHeight: 1.7,
            maxWidth: 560, margin: "0 auto",
          }}>
            Your saved patterns and project settings. Click any project to load it back into the generator.
          </p>
        </div>

        {/* Content */}
        {!loaded ? (
          <p style={{ textAlign: "center", color: "var(--text-muted)", fontStyle: "italic" }}>
            Loading...
          </p>
        ) : projects.length === 0 ? (
          <div style={{
            textAlign: "center", padding: "80px 20px",
            border: "1px dashed var(--border)",
          }}>
            <p style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontSize: 22, fontWeight: 500, color: "var(--text-secondary)",
              marginBottom: 12,
            }}>
              No saved projects yet
            </p>
            <p style={{ color: "var(--text-muted)", fontSize: 14, marginBottom: 24 }}>
              Generate or upload a pattern, then click &ldquo;Save Project&rdquo; to keep it here.
            </p>
            <a href="/" style={{
              display: "inline-block", padding: "12px 28px",
              background: "var(--accent)", color: "#fff",
              textDecoration: "none", fontSize: 12, fontWeight: 600,
              letterSpacing: "0.1em", textTransform: "uppercase",
            }}>
              Start Creating
            </a>
          </div>
        ) : (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: 20,
          }}>
            {projects.map((project) => (
              <div
                key={project.id}
                style={{
                  border: "1px solid var(--border)",
                  background: "#ffffff",
                  display: "flex", flexDirection: "column",
                  transition: "all 0.2s",
                }}
              >
                {/* Thumbnail */}
                <div
                  onClick={() => handleOpen(project)}
                  style={{
                    cursor: "pointer",
                    height: 200,
                    background: "var(--bg-secondary)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    overflow: "hidden",
                  }}
                >
                  {project.thumbnailDataUrl ? (
                    <img
                      src={project.thumbnailDataUrl}
                      alt={project.name}
                      style={{
                        width: "100%", height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  ) : (
                    <span style={{ color: "var(--text-muted)", fontSize: 13, fontStyle: "italic" }}>
                      No preview
                    </span>
                  )}
                </div>

                {/* Info */}
                <div style={{ padding: "16px 20px", flex: 1 }}>
                  <div style={{
                    display: "flex", justifyContent: "space-between",
                    alignItems: "flex-start", marginBottom: 6,
                  }}>
                    <h3 style={{
                      fontSize: 18, fontWeight: 500, color: "var(--text-primary)",
                      lineHeight: 1.3,
                      fontFamily: "'Cormorant Garamond', Georgia, serif",
                    }}>
                      {project.name}
                    </h3>
                    <span style={{
                      fontSize: 10, color: "var(--text-muted)",
                      letterSpacing: "0.08em", whiteSpace: "nowrap",
                      marginLeft: 8, marginTop: 4,
                    }}>
                      {formatDate(project.createdAt)}
                    </span>
                  </div>

                  {project.description && (
                    <p style={{
                      fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.5,
                      marginBottom: 10,
                      overflow: "hidden", textOverflow: "ellipsis",
                      display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
                    }}>
                      {project.description}
                    </p>
                  )}

                  {/* Settings summary */}
                  <div style={{
                    display: "flex", gap: 12, flexWrap: "wrap",
                    fontSize: 11, color: "var(--text-muted)",
                  }}>
                    <span>Scale: {project.scale}%</span>
                    {project.rotation !== 0 && <span>Rot: {project.rotation}&deg;</span>}
                    {project.tileSize && <span>Tile: {project.tileSize}</span>}
                    {project.wallWidthFeet > 0 && (
                      <span>Wall: {project.wallWidthFeet}&apos; &times; {project.wallHeightFeet}&apos;</span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div style={{
                  display: "flex", borderTop: "1px solid var(--border)",
                }}>
                  <button
                    onClick={() => handleOpen(project)}
                    style={{
                      flex: 1, padding: "12px 16px", border: "none",
                      background: "transparent", cursor: "pointer",
                      fontSize: 11, fontWeight: 600, letterSpacing: "0.1em",
                      color: "var(--accent)", textTransform: "uppercase",
                    }}
                  >
                    Open Project
                  </button>
                  <div style={{ width: 1, background: "var(--border)" }} />
                  {confirmDelete === project.id ? (
                    <div style={{ display: "flex" }}>
                      <button
                        onClick={() => handleDelete(project.id)}
                        style={{
                          padding: "12px 16px", border: "none",
                          background: "transparent", cursor: "pointer",
                          fontSize: 11, fontWeight: 600, letterSpacing: "0.1em",
                          color: "var(--danger)", textTransform: "uppercase",
                        }}
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => setConfirmDelete(null)}
                        style={{
                          padding: "12px 16px", border: "none",
                          background: "transparent", cursor: "pointer",
                          fontSize: 11, fontWeight: 600, letterSpacing: "0.1em",
                          color: "var(--text-muted)", textTransform: "uppercase",
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDelete(project.id)}
                      style={{
                        padding: "12px 16px", border: "none",
                        background: "transparent", cursor: "pointer",
                        fontSize: 11, fontWeight: 600, letterSpacing: "0.1em",
                        color: "var(--text-muted)", textTransform: "uppercase",
                      }}
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
