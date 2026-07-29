import type { Metadata, Viewport } from "next";
import { fontVariables } from "@/lib/fonts";
import "./globals.css";

export const metadata: Metadata = {
  // Makes OG image URLs absolute. Set SOON_SITE_URL to your real origin in prod.
  metadataBase: new URL(process.env.SOON_SITE_URL ?? "http://localhost:3000"),
  title: "Soon — count down to what you're waiting for",
  description:
    "Pick a date, pick a look, share the link. A countdown you can send to anyone, no account needed.",
  openGraph: {
    title: "Soon",
    description: "Pick a date, pick a look, share the link.",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // No maximum-scale / user-scalable: pinch zoom stays available.
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fbfbfa" },
    { media: "(prefers-color-scheme: dark)", color: "#101012" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={fontVariables}>
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
