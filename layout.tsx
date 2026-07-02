import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Reelforge — Automated faceless video studio",
  description:
    "Generate scripts, voiceovers, and videos on autopilot, then schedule them across YouTube, Instagram, and TikTok.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="font-body bg-ink-900 text-[#EDEEF0] antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
