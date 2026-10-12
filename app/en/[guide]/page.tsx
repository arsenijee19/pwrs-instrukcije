import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GuideFlow } from "@/components/GuideFlow";
import { getPublished } from "@/lib/db";
import { guideMeta, isGuideType } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ guide: string }> }): Promise<Metadata> {
  const { guide } = await params;
  if (!isGuideType(guide)) return {};
  const m = guideMeta(guide, "en");
  return {
    title: { absolute: `${m.console} ${m.kind === "primary" ? "Primary" : "Secondary"}: ${m.label} | PlayWorld instructions` },
    description: `Step-by-step guide for ${m.label}. ${m.hint}`,
    alternates: { canonical: `/en/${guide}`, languages: { sr: `/${guide}`, en: `/en/${guide}` } },
  };
}

export default async function GuidePageEn({ params }: { params: Promise<{ guide: string }> }) {
  const { guide } = await params;
  if (!isGuideType(guide)) notFound();
  return <GuideFlow guide={guide} lang="en" content={getPublished("en")} />;
}
