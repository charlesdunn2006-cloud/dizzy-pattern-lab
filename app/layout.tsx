import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dizzy with Excitement — AI Pattern Generator",
  description:
    "Describe your wallpaper pattern idea, set wall dimensions, and AI generates a seamless, print-ready design at 300 DPI.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
