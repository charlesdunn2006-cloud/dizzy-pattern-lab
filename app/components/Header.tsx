"use client";

function FloralLeft() {
  return (
    <svg width="180" height="120" viewBox="0 0 120 80" fill="none" style={{ opacity: 0.22 }}>
      {/* Main branch */}
      <path d="M0 60 Q30 55 50 45 Q65 38 80 30" stroke="#14532d" strokeWidth="1.5" fill="none"/>
      <path d="M50 45 Q55 30 48 20" stroke="#14532d" strokeWidth="1" fill="none"/>
      <path d="M65 38 Q72 25 68 15" stroke="#14532d" strokeWidth="1" fill="none"/>
      {/* Leaves */}
      <ellipse cx="30" cy="52" rx="12" ry="6" transform="rotate(-20 30 52)" fill="#2e7d32"/>
      <ellipse cx="48" cy="22" rx="9" ry="5" transform="rotate(-50 48 22)" fill="#2e7d32"/>
      <ellipse cx="68" cy="17" rx="8" ry="4.5" transform="rotate(-40 68 17)" fill="#2e7d32"/>
      <ellipse cx="58" cy="40" rx="10" ry="5" transform="rotate(-15 58 40)" fill="#2e7d32"/>
      {/* Small leaves */}
      <ellipse cx="15" cy="58" rx="7" ry="3.5" transform="rotate(-10 15 58)" fill="#4a7a52"/>
      <ellipse cx="72" cy="28" rx="7" ry="3.5" transform="rotate(-30 72 28)" fill="#4a7a52"/>
      {/* Flowers */}
      <circle cx="42" cy="38" r="5" fill="#c9a9a6" opacity="0.7"/>
      <circle cx="42" cy="38" r="2" fill="#b87333" opacity="0.6"/>
      <circle cx="75" cy="22" r="4" fill="#c9a9a6" opacity="0.7"/>
      <circle cx="75" cy="22" r="1.5" fill="#b87333" opacity="0.6"/>
      {/* Petals */}
      <ellipse cx="38" cy="35" rx="3.5" ry="2" transform="rotate(-30 38 35)" fill="#deb8b0" opacity="0.5"/>
      <ellipse cx="46" cy="35" rx="3.5" ry="2" transform="rotate(30 46 35)" fill="#deb8b0" opacity="0.5"/>
      <ellipse cx="40" cy="42" rx="3.5" ry="2" transform="rotate(60 40 42)" fill="#deb8b0" opacity="0.5"/>
      <ellipse cx="44" cy="42" rx="3.5" ry="2" transform="rotate(-60 44 42)" fill="#deb8b0" opacity="0.5"/>
      {/* Small buds */}
      <circle cx="20" cy="55" r="2.5" fill="#deb8b0" opacity="0.5"/>
      <circle cx="82" cy="28" r="2" fill="#deb8b0" opacity="0.5"/>
      {/* Tiny dots / berries */}
      <circle cx="55" cy="32" r="1.5" fill="#b87333" opacity="0.4"/>
      <circle cx="35" cy="48" r="1.5" fill="#b87333" opacity="0.4"/>
      <circle cx="62" cy="42" r="1" fill="#b87333" opacity="0.3"/>
    </svg>
  );
}

function FloralRight() {
  return (
    <svg width="180" height="120" viewBox="0 0 120 80" fill="none" style={{ opacity: 0.22, transform: "scaleX(-1)" }}>
      {/* Same as left, mirrored via scaleX */}
      <path d="M0 60 Q30 55 50 45 Q65 38 80 30" stroke="#14532d" strokeWidth="1.5" fill="none"/>
      <path d="M50 45 Q55 30 48 20" stroke="#14532d" strokeWidth="1" fill="none"/>
      <path d="M65 38 Q72 25 68 15" stroke="#14532d" strokeWidth="1" fill="none"/>
      <ellipse cx="30" cy="52" rx="12" ry="6" transform="rotate(-20 30 52)" fill="#2e7d32"/>
      <ellipse cx="48" cy="22" rx="9" ry="5" transform="rotate(-50 48 22)" fill="#2e7d32"/>
      <ellipse cx="68" cy="17" rx="8" ry="4.5" transform="rotate(-40 68 17)" fill="#2e7d32"/>
      <ellipse cx="58" cy="40" rx="10" ry="5" transform="rotate(-15 58 40)" fill="#2e7d32"/>
      <ellipse cx="15" cy="58" rx="7" ry="3.5" transform="rotate(-10 15 58)" fill="#4a7a52"/>
      <ellipse cx="72" cy="28" rx="7" ry="3.5" transform="rotate(-30 72 28)" fill="#4a7a52"/>
      <circle cx="42" cy="38" r="5" fill="#c9a9a6" opacity="0.7"/>
      <circle cx="42" cy="38" r="2" fill="#b87333" opacity="0.6"/>
      <circle cx="75" cy="22" r="4" fill="#c9a9a6" opacity="0.7"/>
      <circle cx="75" cy="22" r="1.5" fill="#b87333" opacity="0.6"/>
      <ellipse cx="38" cy="35" rx="3.5" ry="2" transform="rotate(-30 38 35)" fill="#deb8b0" opacity="0.5"/>
      <ellipse cx="46" cy="35" rx="3.5" ry="2" transform="rotate(30 46 35)" fill="#deb8b0" opacity="0.5"/>
      <ellipse cx="40" cy="42" rx="3.5" ry="2" transform="rotate(60 40 42)" fill="#deb8b0" opacity="0.5"/>
      <ellipse cx="44" cy="42" rx="3.5" ry="2" transform="rotate(-60 44 42)" fill="#deb8b0" opacity="0.5"/>
      <circle cx="20" cy="55" r="2.5" fill="#deb8b0" opacity="0.5"/>
      <circle cx="82" cy="28" r="2" fill="#deb8b0" opacity="0.5"/>
      <circle cx="55" cy="32" r="1.5" fill="#b87333" opacity="0.4"/>
      <circle cx="35" cy="48" r="1.5" fill="#b87333" opacity="0.4"/>
      <circle cx="62" cy="42" r="1" fill="#b87333" opacity="0.3"/>
    </svg>
  );
}

function FloralDivider() {
  return (
    <svg width="280" height="28" viewBox="0 0 200 20" fill="none" style={{ opacity: 0.3 }}>
      {/* Center flower */}
      <circle cx="100" cy="10" r="4" fill="#c9a9a6"/>
      <circle cx="100" cy="10" r="1.8" fill="#b87333"/>
      <ellipse cx="95" cy="8" rx="3.5" ry="2" transform="rotate(-40 95 8)" fill="#deb8b0"/>
      <ellipse cx="105" cy="8" rx="3.5" ry="2" transform="rotate(40 105 8)" fill="#deb8b0"/>
      <ellipse cx="95" cy="12" rx="3.5" ry="2" transform="rotate(40 95 12)" fill="#deb8b0"/>
      <ellipse cx="105" cy="12" rx="3.5" ry="2" transform="rotate(-40 105 12)" fill="#deb8b0"/>
      {/* Left branch */}
      <path d="M95 10 Q70 8 40 10 Q20 11 5 14" stroke="#14532d" strokeWidth="1" fill="none"/>
      <ellipse cx="60" cy="7" rx="8" ry="4" transform="rotate(-10 60 7)" fill="#2e7d32"/>
      <ellipse cx="35" cy="11" rx="7" ry="3.5" transform="rotate(5 35 11)" fill="#4a7a52"/>
      <circle cx="75" cy="8" r="2.5" fill="#deb8b0" opacity="0.6"/>
      <circle cx="18" cy="13" r="2" fill="#deb8b0" opacity="0.5"/>
      {/* Right branch */}
      <path d="M105 10 Q130 8 160 10 Q180 11 195 14" stroke="#14532d" strokeWidth="1" fill="none"/>
      <ellipse cx="140" cy="7" rx="8" ry="4" transform="rotate(10 140 7)" fill="#2e7d32"/>
      <ellipse cx="165" cy="11" rx="7" ry="3.5" transform="rotate(-5 165 11)" fill="#4a7a52"/>
      <circle cx="125" cy="8" r="2.5" fill="#deb8b0" opacity="0.6"/>
      <circle cx="182" cy="13" r="2" fill="#deb8b0" opacity="0.5"/>
    </svg>
  );
}

export default function Header() {
  return (
    <header style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      padding: "24px 24px 0", background: "#FFF8F0",
      borderBottom: "1px solid var(--border)",
      position: "relative", overflow: "hidden",
    }}>
      {/* Floral decorations flanking the logo */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        gap: 12, marginBottom: 4,
      }}>
        <FloralLeft />
        <div style={{ textAlign: "center" }}>
          <a href="/" style={{
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontSize: 28, fontWeight: 600, color: "var(--text-primary)",
            letterSpacing: "0.04em", textDecoration: "none",
            display: "block",
          }}>
            Dizzy with Excitement
          </a>
        </div>
        <FloralRight />
      </div>

      {/* Floral divider */}
      <FloralDivider />

      {/* Subtitle */}
      <p style={{
        fontSize: 11, fontWeight: 500, letterSpacing: "0.15em",
        color: "var(--text-muted)", marginBottom: 14, textTransform: "uppercase",
        marginTop: 4,
      }}>
        AI Pattern Generator
      </p>

      {/* Nav */}
      <nav style={{
        display: "flex", gap: 32, paddingBottom: 16,
      }}>
        <span style={{
          color: "var(--text-primary)", fontSize: 12, fontWeight: 500,
          letterSpacing: "0.12em", borderBottom: "2px solid var(--text-primary)",
          paddingBottom: 2,
        }}>
          GENERATOR
        </span>
        <a href="/trending"
          style={{
            color: "var(--text-secondary)", textDecoration: "none",
            fontSize: 12, fontWeight: 500, letterSpacing: "0.12em",
            transition: "color 0.2s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-primary)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-secondary)")}
        >
          TRENDING {new Date().getFullYear()}
        </a>
        <a href="/saved"
          style={{
            color: "var(--text-secondary)", textDecoration: "none",
            fontSize: 12, fontWeight: 500, letterSpacing: "0.12em",
            transition: "color 0.2s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-primary)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-secondary)")}
        >
          SAVED
        </a>
      </nav>
    </header>
  );
}
