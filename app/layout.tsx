import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Particles } from "@/components/Particles";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://instrukcije.playworld.rs";

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: { default: "PlayWorld instrukcije: aktivacija PlayStation naloga", template: "%s • PlayWorld instrukcije" },
  description: "Jednostavno uputstvo, korak po korak, za PS4 i PS5 nalog koji ste kupili u PlayWorld prodavnici.",
  openGraph: { title: "PlayWorld instrukcije", description: "Aktivacija PS4 i PS5 naloga korak po korak.", url: SITE, siteName: "PlayWorld", locale: "sr_RS", type: "website" },
  robots: { index: true, follow: true },
};
export const viewport: Viewport = { themeColor: "#050816", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sr-Latn">
      <body><div className="bg-aurora" aria-hidden="true" /><Particles />{children}</body>
    </html>
  );
}
