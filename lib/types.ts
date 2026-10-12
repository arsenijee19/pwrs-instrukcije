import { z } from "zod";

export const GUIDE_TYPES = ["ps4-primary", "ps4-secondary", "ps5-primary", "ps5-secondary"] as const;
export type GuideType = (typeof GUIDE_TYPES)[number];
export const PRODUCTS = ["game", "ps_plus"] as const;
export type Product = (typeof PRODUCTS)[number];

export const GUIDE_META: Record<GuideType, { console: "PS4" | "PS5"; kind: "primary" | "secondary"; label: string; short: string; hint: string }> = {
  "ps4-primary": { console: "PS4", kind: "primary", label: "PS4 Primarni nalog", short: "PS4 Primary", hint: "Igru ili pretplatu preuzimate preko naloga koji ste dobili od nas, a igrate sa svog ličnog profila." },
  "ps4-secondary": { console: "PS4", kind: "secondary", label: "PS4 Sekundarni nalog", short: "PS4 Secondary", hint: "Igru ili pretplatu preuzimate i igrate na nalogu koji ste dobili od nas." },
  "ps5-primary": { console: "PS5", kind: "primary", label: "PS5 Primarni nalog", short: "PS5 Primary", hint: "Igru ili pretplatu preuzimate preko naloga koji ste dobili od nas, a igrate sa svog ličnog profila." },
  "ps5-secondary": { console: "PS5", kind: "secondary", label: "PS5 Sekundarni nalog", short: "PS5 Secondary", hint: "Igru ili pretplatu preuzimate i igrate na nalogu koji ste dobili od nas." },
};
import { UI, type Lang } from "./i18n";
/** Metapodaci vodiča na izabranom jeziku. */
export function guideMeta(g: GuideType, lang: Lang = "sr") {
  const m = GUIDE_META[g];
  const primary = m.kind === "primary";
  return { ...m, label: UI[lang].metaLabel(m.console, primary), sub: UI[lang].metaSub(primary), hint: UI[lang].metaHint(primary) };
}
export function isGuideType(v: string): v is GuideType {
  return (GUIDE_TYPES as readonly string[]).includes(v);
}

const safeUrl = z.string().max(500).refine((u) => /^https:\/\/[^\s]+$/.test(u) || u === "", "Mora biti https:// adresa");

export const MarkerSchema = z.object({
  id: z.string().max(40),
  type: z.enum(["target", "forbidden"]),
  x: z.number().min(0).max(100),
  y: z.number().min(0).max(100),
  w: z.number().min(0.5).max(100),
  h: z.number().min(0.5).max(100),
  label: z.string().max(40).default(""),
});
export type Marker = z.infer<typeof MarkerSchema>;

export const ImageSchema = z.object({
  src: z.string().max(200).regex(/^\/(guide|media)\/[a-z0-9-]+$/i, "Neispravna putanja slike"),
  w: z.number().int().min(1).max(10000),
  h: z.number().int().min(1).max(10000),
  alt: z.string().max(300),
  caption: z.string().max(200).default(""),
  maxW: z.number().int().min(100).max(4000).optional(),
  markers: z.array(MarkerSchema).max(12).default([]),
});
export type StepImage = z.infer<typeof ImageSchema>;

export const StepSchema = z.object({
  id: z.string().min(1).max(60),
  kind: z.enum(["step", "final"]).default("step"),
  purchase: z.enum(["both", "game", "ps_plus"]),
  title: z.string().min(1).max(160),
  body: z.string().max(3000),
  images: z.array(ImageSchema).max(6),
  level: z.enum(["none", "info", "important", "critical"]),
  warning: z.string().max(1000),
  support: z.boolean(),
  published: z.boolean(),
  sourcePdf: z.string().max(100).default(""),
  sourcePage: z.number().int().min(0).max(999).nullable().default(null),
  placeholder: z.string().max(400).default(""),
});
export type Step = z.infer<typeof StepSchema>;

const RuleSchema = z.object({
  title: z.string().max(160),
  text: z.string().max(1500),
  for: z.enum(["all", "primary", "secondary"]).default("all"),
  console: z.enum(["all", "ps4", "ps5"]).default("all"),
});

export const PromoSchema = z.object({
  id: z.string().min(1).max(60),
  title: z.string().max(160),
  text: z.string().max(500),
  image: z.string().max(200).regex(/^\/(guide|media)\/[a-z0-9-]+$/i).or(z.literal("")).default(""),
  button: z.string().max(80),
  url: safeUrl,
  enabled: z.boolean(),
  placements: z.array(z.enum(["home", "steps", "final"])).max(3),
});
export type Promo = z.infer<typeof PromoSchema>;

export const ContentSchema = z.object({
  settings: z.object({
    supportUrl: safeUrl, siteUrl: safeUrl, supportLabel: z.string().max(200),
    shopUrl: safeUrl.default("https://www.playworld.rs"), shopLabel: z.string().max(60).default("PlayWorld prodavnica"),
  }),
  terms: z.object({
    title: z.string().max(160),
    intro: z.string().max(1000),
    highlights: z.array(RuleSchema).max(8),
    rules: z.array(RuleSchema).max(20),
    checkbox: z.string().max(200),
    button: z.string().max(80),
  }),
  final: z.object({
    title: z.string().max(160),
    supportTitle: z.string().max(300),
    supportButton: z.string().max(80),
    primary: z.string().max(500),
    secondary: z.string().max(500),
    secondaryPs4: z.string().max(500).default(""),
    secondaryPs5: z.string().max(500).default(""),
    psPlus: z.string().max(500),
    common: z.string().max(500),
  }),
  promos: z.array(PromoSchema).max(12).default([]),
  guides: z.object({
    "ps4-primary": z.array(StepSchema).max(60),
    "ps4-secondary": z.array(StepSchema).max(60),
    "ps5-primary": z.array(StepSchema).max(60),
    "ps5-secondary": z.array(StepSchema).max(60),
  }),
});
export type Content = z.infer<typeof ContentSchema>;
export type Terms = Content["terms"];
