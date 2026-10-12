import Link from "next/link";
import { HtmlLang } from "@/components/HtmlLang";
import { HomeChooser } from "@/components/HomeChooser";
import { PromotionalBanner } from "@/components/PromotionalBanner";
import { getPublished } from "@/lib/db";
import { homeHref, UI, type Lang } from "@/lib/i18n";

export function HomePage({ lang }: { lang: Lang }) {
  const c = getPublished(lang);
  const ui = UI[lang];
  const promos = c.promos.filter((p) => p.enabled && p.placements.includes("home"));
  return (
    <main className="stagger mx-auto max-w-3xl px-4 pb-16 pt-8">
      <HtmlLang lang={lang} />
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-ps sm:text-sm">{ui.siteName}</p>
        <div className="flex items-center gap-3">
          <Link href={homeHref(lang === "en" ? "sr" : "en")} hrefLang={lang === "en" ? "sr" : "en"} aria-label={ui.langSwitchLabel}
            className="rounded-lg border border-line bg-panel/70 px-2.5 py-1 text-xs font-extrabold tracking-wide no-underline" data-testid="lang-switch">{lang === "en" ? "SR" : "EN"}</Link>
          <a href={c.settings.shopUrl} target="_blank" rel="noopener noreferrer" className="whitespace-nowrap text-xs font-semibold text-sky-300 no-underline sm:text-sm">🛒 {c.settings.shopLabel} ↗</a>
        </div>
      </div>
      <h1 className="mt-4 text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">{ui.homeTitle}</h1>
      <p className="mt-3 text-lg leading-relaxed text-slate-300">{ui.homeLead}</p>
      <div className="mt-6"><HomeChooser lang={lang} /></div>
      <section className="card mt-8 p-5 leading-relaxed text-slate-300">
        <h2 className="text-lg font-bold text-white">{ui.howTitle}</h2>
        <p className="mt-3"><strong className="text-white">{ui.howPrimary}</strong> {ui.howPrimaryText}</p>
        <p className="mt-3"><strong className="text-white">{ui.howSecondary}</strong> {ui.howSecondaryText}</p>
        <p className="mt-3 text-sm text-slate-400">{ui.howNote}{" "}
          <a className="underline" href={c.settings.supportUrl} target="_blank" rel="noopener noreferrer">support.playworld.rs</a>.</p>
      </section>
      {promos.map((p) => <div key={p.id} className="mt-6"><PromotionalBanner promo={p} /></div>)}
    </main>
  );
}
