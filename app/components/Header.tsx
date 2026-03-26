"use client";

export default function Header() {
  return (
    <header style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      padding: "24px 24px 0", background: "var(--bg-primary)",
      borderBottom: "1px solid var(--border)",
    }}>
      {/* Logo */}
      <div style={{ marginBottom: 18 }}>
        <span style={{
          fontFamily: "'Cormorant Garamond', Georgia, serif",
          fontSize: 28, fontWeight: 600, color: "var(--text-primary)",
          letterSpacing: "0.04em",
        }}>
          PATTERN LAB
        </span>
      </div>
      {/* Nav */}
      <nav style={{
        display: "flex", gap: 32, paddingBottom: 16,
      }}>
        {["MY LIBRARY", "CONTACT", "ABOUT"].map((item) => (
          <a key={item} href="#"
            style={{
              color: "var(--text-secondary)", textDecoration: "none",
              fontSize: 12, fontWeight: 500, letterSpacing: "0.12em",
              transition: "color 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-primary)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-secondary)")}
          >
            {item}
          </a>
        ))}
      </nav>
    </header>
  );
}
