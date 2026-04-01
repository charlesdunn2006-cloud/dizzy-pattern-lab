"use client";

import { usePathname } from "next/navigation";

function LogoMark() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" style={{ opacity: 0.85 }}>
      {/* Abstract tessellation mark */}
      <rect x="2" y="2" width="12" height="12" rx="2" fill="var(--accent)" opacity="0.9" />
      <rect x="18" y="2" width="12" height="12" rx="2" fill="var(--accent)" opacity="0.5" />
      <rect x="2" y="18" width="12" height="12" rx="2" fill="var(--accent)" opacity="0.5" />
      <rect x="18" y="18" width="12" height="12" rx="2" fill="var(--accent)" opacity="0.25" />
    </svg>
  );
}

const NAV_ITEMS = [
  { href: "/", label: "Generator" },
  { href: "/trending", label: `Trending` },
  { href: "/saved", label: "Saved" },
];

export default function Header() {
  const pathname = usePathname();

  return (
    <header
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 32px",
        height: 64,
        background: "var(--bg-card)",
        borderBottom: "1px solid var(--border)",
        position: "sticky",
        top: 0,
        zIndex: 100,
        backdropFilter: "blur(12px)",
      }}
    >
      {/* Logo */}
      <a
        href="/"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          textDecoration: "none",
        }}
      >
        <LogoMark />
        <span
          style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: 20,
            fontWeight: 600,
            color: "var(--text-primary)",
            letterSpacing: "-0.01em",
          }}
        >
          Dizzy
        </span>
      </a>

      {/* Nav */}
      <nav style={{ display: "flex", gap: 4 }}>
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <a
              key={item.href}
              href={item.href}
              style={{
                color: isActive ? "var(--text-primary)" : "var(--text-muted)",
                textDecoration: "none",
                fontSize: 13,
                fontWeight: 500,
                padding: "8px 16px",
                borderRadius: 6,
                background: isActive ? "var(--bg-warm)" : "transparent",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.color = "var(--text-primary)";
                  e.currentTarget.style.background = "var(--bg-secondary)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.color = "var(--text-muted)";
                  e.currentTarget.style.background = "transparent";
                }
              }}
            >
              {item.label}
            </a>
          );
        })}
      </nav>
    </header>
  );
}
