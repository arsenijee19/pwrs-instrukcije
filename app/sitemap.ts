import type { MetadataRoute } from "next";
import { GUIDE_TYPES } from "@/lib/types";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://instrukcije.playworld.rs";
export default function sitemap(): MetadataRoute.Sitemap {
  return [SITE, `${SITE}/en`, ...GUIDE_TYPES.map((g) => `${SITE}/${g}`), ...GUIDE_TYPES.map((g) => `${SITE}/en/${g}`)].map((url) => ({ url, lastModified: new Date() }));
}
