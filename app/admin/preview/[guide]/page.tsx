import { notFound, redirect } from "next/navigation";
import { GuideFlow } from "@/components/GuideFlow";
import { getSession } from "@/lib/auth";
import { getDraft } from "@/lib/db";
import { isLang } from "@/lib/i18n";
import { isGuideType } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function Preview({ params, searchParams }: { params: Promise<{ guide: string }>; searchParams: Promise<{ lang?: string }> }) {
  if (!(await getSession())) redirect("/admin");
  const { guide } = await params;
  const sp = await searchParams;
  const lang = isLang(sp.lang) ? sp.lang : "sr";
  if (!isGuideType(guide)) notFound();
  return (
    <>
      <div className="bg-warn px-3 py-1.5 text-center text-sm font-bold text-black">PREGLED NACRTA. Ovo još nije javno objavljeno.</div>
      <GuideFlow guide={guide} lang={lang} content={getDraft(lang)} preview />
    </>
  );
}
