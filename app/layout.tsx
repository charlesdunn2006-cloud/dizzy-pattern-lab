import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pattern Lab — Print-Ready Downloads",
  description:
    "Upload your seamless pattern and export it print-ready for any product — correctly sized at 300 DPI.",
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
