"use client";

import { useState, useRef } from "react";

export default function Tooltip({
  text,
  children,
  position = "top",
}: {
  text: string;
  children: React.ReactNode;
  position?: "top" | "bottom";
}) {
  const [visible, setVisible] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = () => {
    timeoutRef.current = setTimeout(() => setVisible(true), 400);
  };
  const hide = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setVisible(false);
  };

  return (
    <div
      onMouseEnter={show}
      onMouseLeave={hide}
      style={{ position: "relative", display: "inline-flex" }}
    >
      {children}
      {visible && (
        <div
          style={{
            position: "absolute",
            [position === "top" ? "bottom" : "top"]: "calc(100% + 8px)",
            left: "50%",
            transform: "translateX(-50%)",
            padding: "6px 12px",
            borderRadius: 6,
            background: "var(--text-primary)",
            color: "#fff",
            fontSize: 11,
            fontWeight: 500,
            whiteSpace: "nowrap",
            pointerEvents: "none",
            zIndex: 50,
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
            animation: "tooltipFadeIn 0.15s ease",
          }}
        >
          {text}
          <div
            style={{
              position: "absolute",
              [position === "top" ? "top" : "bottom"]: "100%",
              left: "50%",
              transform: "translateX(-50%)",
              width: 0,
              height: 0,
              borderLeft: "5px solid transparent",
              borderRight: "5px solid transparent",
              ...(position === "top"
                ? { borderTop: "5px solid var(--text-primary)" }
                : { borderBottom: "5px solid var(--text-primary)" }),
            }}
          />
        </div>
      )}
    </div>
  );
}
