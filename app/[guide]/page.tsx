import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GuideFlow } from "@/components/GuideFlow";
import { getPublished } from "@/lib/db";
import { guideMeta, isGuideType } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ guide: string }> }): Promise<Metadata> {
  const { guide } = await params;
  if (!isGuideType(guide)) return {};
  const m = guideMeta(guide, "sr");
  return { title: `${m.label}: ${m.sub}`, description: `Uputstvo, korak po korak, za ${m.label} (${m.sub.toLowerCase()}). ${m.hint}`, alternates: { canonical: `/${guide}`, languages: { sr: `/${guide}`, en: `/en/${guide}` } } };
}

export default async function GuidePage({ params }: { params: Promise<{ guide: string }> }) {
  const { guide } = await params;
  if (!isGuideType(guide)) notFound();
  return <GuideFlow guide={guide} content={getPublished()} />;
}
