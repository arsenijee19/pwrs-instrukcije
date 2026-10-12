"use client";
import Link from "next/link";
import { useEffect } from "react";
import { guideHref, UI, type Lang } from "@/lib/i18n";
import { GUIDE_META, GUIDE_TYPES, type GuideType } from "@/lib/types";

function cardCopy(g: GuideType, lang: Lang) {
  const m = GUIDE_META[g];
  const ui = UI[lang];
  const primary = m.kind === "primary";
  return {
    title: `${m.console}: ${primary ? ui.cardTitlePrimary : ui.cardTitleSecondary}`,
    sub: primary ? ui.cardPrimary(m.console) : ui.cardSecondary(m.console),
    grad: primary ? "from-sky-500/20 to-ps/5" : "from-indigo-500/20 to-violet/5",
  };
}

export function HomeChooser({ lang = "sr" }: { lang?: Lang }) {
  // Povratak na početnu uvek briše započeti napredak: novi ulazak u instrukcije kreće od nule.
  useEffect(() => {
    try {
      for (const store of [sessionStorage, localStorage]) {
        Object.keys(store).filter((k) => k.startsWith("pw:v1:")).forEach((k) => store.removeItem(k));
      }
    } catch {}
  }, []);
  return (
    <div className="stagger grid gap-4 sm:grid-cols-2">
      {GUIDE_TYPES.map((g) => (
        <Link key={g} href={guideHref(lang, g)} data-testid={`card-${g}`}
          className={`card lift block bg-gradient-to-br ${cardCopy(g, lang).grad} p-5 no-underline hover:border-ps`}>
          <span className="inline-block rounded-lg bg-white px-2.5 py-1 text-lg font-black tracking-tight text-[#003087]">{GUIDE_META[g].console}</span>
          <span className="mt-3 block text-xl font-extrabold leading-snug tracking-tight">{cardCopy(g, lang).title}</span>
          <span className="mt-1.5 block leading-relaxed text-slate-300">{cardCopy(g, lang).sub}</span>
          <span className="mt-3 inline-block rounded-full border border-line px-2.5 py-0.5 text-xs font-semibold text-slate-400">{GUIDE_META[g].short}</span>
        </Link>
      ))}
    </div>
  );
}
