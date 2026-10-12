"use client";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { guideHref, homeHref, UI, type Lang } from "@/lib/i18n";
import { guideMeta, type Content, type GuideType, type Product, type Promo, type Step } from "@/lib/types";
import { burst, burstFromElement } from "@/lib/fx";
import { HtmlLang } from "./HtmlLang";
import { PromotionalBanner } from "./PromotionalBanner";
import { RichText } from "./RichText";
import { ZoomImage } from "./StepImage";

type Phase = "product" | "terms" | "steps";
type Saved = { product: Product | null; accepted: boolean; step: number };
const KEY = (g: GuideType) => `pw:v1:${g}`;

function load(g: GuideType): Saved {
  try {
    const v = JSON.parse(sessionStorage.getItem(KEY(g)) || "null");
    if (v && typeof v === "object") {
      return {
        product: v.product === "game" || v.product === "ps_plus" ? v.product : null,
        accepted: v.accepted === true,
        step: Number.isInteger(v.step) && v.step >= 0 ? v.step : 0,
      };
    }
  } catch {}
  return { product: null, accepted: false, step: 0 };
}
function productFromQuery(): Product | null {
  const q = new URLSearchParams(window.location.search);
  const v = (q.get("proizvod") || q.get("product") || "").toLowerCase();
  if (["igra", "game", "digitalna-igra"].includes(v)) return "game";
  if (["ps-plus", "psplus", "ps_plus", "pretplata", "plus"].includes(v)) return "ps_plus";
  return null;
}

const LEVEL_STYLE = {
  info: { box: "border-sky-400/40 bg-sky-500/10", chip: "bg-sky-500/90 text-white", labelKey: "lvlInfo", icon: "ℹ️" },
  important: { box: "border-warn/50 bg-warn/10", chip: "bg-warn text-black", labelKey: "lvlImportant", icon: "⚠️" },
  critical: { box: "border-bad/70 bg-bad/10", chip: "bg-bad text-white", labelKey: "lvlCritical", icon: "⛔" },
} as const;

export function GuideFlow({ guide, content, preview = false, lang = "sr" }: { guide: GuideType; content: Content; preview?: boolean; lang?: Lang }) {
  const ui = UI[lang];
  const meta = guideMeta(guide, lang);
  const [ready, setReady] = useState(false);
  const [s, setS] = useState<Saved>({ product: null, accepted: false, step: 0 });
  const [agree, setAgree] = useState(false);
  const scroller = useRef<HTMLElement>(null);
  const [dir, setDir] = useState<"next" | "prev">("next");

  // učitavanje sačuvanog napretka (samo lokalno u browseru)
  useEffect(() => {
    let init = preview ? { product: productFromQuery() ?? "game", accepted: true, step: 0 } as Saved : load(guide);
    const q = productFromQuery();
    if (!preview && q && !init.accepted) init = { ...init, product: q };
    setS(init);
    setReady(true);
  }, [guide, preview]);

  const persist = useCallback((next: Saved) => {
    setS(next);
    if (preview) return;
    try {
      sessionStorage.setItem(KEY(guide), JSON.stringify(next));
    } catch {}
  }, [guide, preview]);

  const steps = useMemo(
    () => content.guides[guide].filter((st) => st.published && (st.purchase === "both" || st.purchase === s.product)),
    [content, guide, s.product],
  );
  const phase: Phase = !s.product ? "product" : !s.accepted ? "terms" : "steps";
  const idx = Math.min(s.step, Math.max(steps.length - 1, 0));
  const step: Step | undefined = steps[idx];
  const isFinal = step?.kind === "final";

  // historija: dugme "nazad" u browseru ide na prethodni korak
  const go = useCallback((n: number) => {
    setDir(n >= s.step ? "next" : "prev");
    if (n > s.step) burstFromElement(document.querySelector("[data-testid=next]"), { count: 12, power: 0.8 });
    persist({ ...s, step: n });
    if (!preview) window.history.pushState({ n }, "", `#korak-${n + 1}`);
  }, [persist, s, preview]);
  useEffect(() => {
    const onPop = () => {
      const m = /^#korak-(\d+)$/.exec(window.location.hash);
      setS((cur) => ({ ...cur, step: m ? Math.max(0, Number(m[1]) - 1) : cur.step }));
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);
  useEffect(() => {
    // pri promeni koraka ili ekrana, sadržaj se uvek vraća na sam početak
    if (ready) scroller.current?.scrollTo({ top: 0, left: 0 });
  }, [idx, phase, ready, s.product]);
  useEffect(() => {
    if (phase !== "steps") return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.closest("input,textarea,select")) return;
      if (e.key === "ArrowRight" && idx < steps.length - 1) go(idx + 1);
      if (e.key === "ArrowLeft" && idx > 0) go(idx - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, idx, steps.length, go]);

  useEffect(() => {
    // unapred učitaj slike sledećeg koraka da prelaz bude trenutan
    const next = steps[idx + 1];
    next?.images.forEach((im) => { const i = new Image(); i.src = `${im.src}-1600.webp`; });
  }, [steps, idx]);

  const restart = () => {
    if (!preview) { try { sessionStorage.removeItem(KEY(guide)); } catch {} window.history.replaceState(null, "", window.location.pathname); }
    setAgree(false);
    setS({ product: null, accepted: false, step: 0 });
  };
  const supportUrl = content.settings.supportUrl;

  /* ---------- zaglavlje ---------- */
  const phaseText =
    phase === "steps" && steps.length > 0
      ? `${ui.stepOf(idx + 1, steps.length)}${s.product ? ` · ${s.product === "game" ? ui.gameShort : ui.plusShort}` : ""}`
      : phase === "terms" ? ui.phaseTerms : ui.phaseProduct;
  const iconBtn = "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-line bg-panel/70 text-slate-200 no-underline transition-transform active:scale-95";
  const header = (
    <header className="flex-none border-b border-line bg-ink/80">
      <div className="mx-auto grid max-w-3xl grid-cols-[auto_1fr_auto] items-center gap-3 px-3 py-2 sm:px-4">
        <Link href={homeHref(lang)} aria-label={ui.backToAccounts} title={ui.backToAccounts} className={iconBtn}>
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 5l-7 7 7 7" /></svg>
        </Link>
        <div className="min-w-0 text-center leading-tight">
          <p className="truncate text-[15px] font-extrabold tracking-tight" data-testid="guide-badge">{meta.label}</p>
          <p className="mt-0.5 truncate text-xs font-medium text-slate-400" data-testid="step-counter">{phaseText}</p>
        </div>
        <div className="flex items-center gap-2">
          {!preview && (
            <Link href={guideHref(lang === "en" ? "sr" : "en", guide)} hrefLang={lang === "en" ? "sr" : "en"} aria-label={ui.langSwitchLabel} title={ui.langSwitchLabel}
              className={`${iconBtn} text-xs font-extrabold tracking-wide`} data-testid="lang-switch">{lang === "en" ? "SR" : "EN"}</Link>
          )}
          <a href={content.settings.shopUrl} target="_blank" rel="noopener noreferrer" aria-label={content.settings.shopLabel} title={content.settings.shopLabel}
            className={iconBtn} data-testid="shop-link">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="20" r="1.4" /><circle cx="18" cy="20" r="1.4" /><path d="M3 4h2.4l2.2 11h10.800l2-8H6.300" /></svg>
          </a>
          <button onClick={restart} aria-label={ui.restart} title={ui.restart} className={iconBtn} data-testid="restart-top">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 3-6.700" /><path d="M3 4v5h5" /></svg>
          </button>
        </div>
      </div>
      <div className="h-[3px] bg-panel2" role="progressbar" aria-valuemin={0} aria-valuemax={steps.length || 1} aria-valuenow={phase === "steps" ? idx + 1 : 0}>
        <div className="h-full w-full origin-left bg-gradient-to-r from-ps to-violet transition-transform duration-300 ease-out"
          style={{ transform: `scaleX(${phase === "steps" && steps.length ? (idx + 1) / steps.length : 0})` }} />
      </div>
    </header>
  );

  let body: React.ReactNode;
  let footer: React.ReactNode = null;
  const stepPromo = content.promos.find((p) => p.enabled && p.placements.includes("steps"));
  const finalPromos = content.promos.filter((p) => p.enabled && p.placements.includes("final"));
  if (!ready) {
    body = (
      <div className="space-y-4" aria-busy="true">
        <div className="skeleton h-10 w-3/4" /><div className="skeleton h-64 w-full" /><div className="skeleton h-20 w-full" />
      </div>
    );
  } else if (phase === "product") {
    body = <ProductScreen guide={guide} lang={lang} onPick={(p, el) => { burstFromElement(el, { count: 16 }); persist({ product: p, accepted: false, step: 0 }); }} />;
  } else if (phase === "terms") {
    const t = content.terms;
    body = <TermsScreen guide={guide} lang={lang} content={content} onChangeProduct={() => persist({ ...s, product: null })} />;
    footer = (
      <div className="mx-auto max-w-3xl space-y-3 px-4 py-3">
        <label className="flex cursor-pointer items-start gap-3 text-base font-semibold leading-snug">
          <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-0.5 h-6 w-6 shrink-0 accent-[#2f7bff]" data-testid="terms-check" />
          <span>{t.checkbox}</span>
        </label>
        <button className="btn btn-primary w-full" disabled={!agree} data-testid="terms-accept"
          onClick={(e) => { burstFromElement(e.currentTarget, { count: 26, power: 1 }); setDir("next"); persist({ ...s, accepted: true, step: 0 }); if (!preview) window.history.pushState(null, "", "#korak-1"); }}>
          {t.button}
        </button>
      </div>
    );
  } else if (!step) {
    body = <p className="py-6">{ui.noSteps}</p>;
  } else if (isFinal) {
    body = <FinalScreen guide={guide} lang={lang} product={s.product!} content={content} promos={finalPromos} onBack={() => go(idx - 1)} onRestart={restart} />;
  } else {
    body = (
      <>
        <StepView step={step} lang={lang} supportUrl={supportUrl} supportLabel={content.settings.supportLabel} />
        {stepPromo && step.level !== "critical" && <div className="mt-6"><PromotionalBanner promo={stepPromo} variant="slim" /></div>}
      </>
    );
    footer = (
      <div className="mx-auto flex max-w-3xl gap-3 px-4 py-3">
        <button className="btn btn-ghost flex-[1]" disabled={idx === 0} onClick={() => go(idx - 1)}>{ui.back}</button>
        <button className="btn btn-primary flex-[2]" onClick={() => go(idx + 1)} data-testid="next">
          {steps[idx + 1]?.kind === "final" ? ui.finish : ui.next}
        </button>
      </div>
    );
  }

  // Aplikacija je „shell“: zaglavlje i podnožje su stalni redovi, a samo srednji deo se skroluje.
  // Zato je nemoguće da jedan element prekrije drugi (nema fixed/sticky pozicioniranja).
  return (
    <div className="app-shell" style={preview ? { height: "calc(100dvh - 32px)" } : undefined}>
      <HtmlLang lang={lang} />
      {header}
      <main ref={scroller} className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain">
        <div key={`${phase}-${idx}`} className={`${phase === "steps" ? (dir === "next" ? "slide-next" : "slide-prev") : "fade-in"} mx-auto w-full max-w-3xl px-4 pb-10 pt-6`}>{body}</div>
      </main>
      {footer && (
        <footer className="flex-none border-t border-line bg-ink/80" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>{footer}</footer>
      )}
    </div>
  );
}

/* ---------- izbor proizvoda ---------- */
function ProductScreen({ guide, lang, onPick }: { guide: GuideType; lang: Lang; onPick: (p: Product, el: Element) => void }) {
  const ui = UI[lang];
  const meta = guideMeta(guide, lang);
  const options: { id: Product; test: string; title: string; text: string; icon: React.ReactNode }[] = [
    { id: "game", test: "product-game", title: ui.optGame, text: ui.optGameText, icon: <img src="/icons/astro-bot.webp" alt="" width={96} height={96} className="h-full w-full object-cover" /> },
    { id: "ps_plus", test: "product-psplus", title: ui.optPlus, text: ui.optPlusText, icon: <img src="/icons/ps-plus.webp" alt="" width={96} height={96} className="h-full w-full rounded-2xl object-cover" /> },
  ];
  return (
    <section className="stagger">
      <p className="text-sm font-bold uppercase tracking-wider text-ps">{meta.short}</p>
      <h1 className="mt-1 text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">{ui.productTitle}</h1>
      <p className="mt-3 border-l-2 border-ps/70 pl-4 text-[17px] leading-relaxed text-slate-300">
        {ui.youChose(meta.console, meta.kind === "primary" ? "Primary" : "Secondary")} {meta.hint}
      </p>
      <div className="mt-6 grid gap-4">
        {options.map((o) => (
          <button key={o.id} onClick={(e) => onPick(o.id, e.currentTarget)} data-testid={o.test}
            className="card lift group flex items-center gap-4 p-4 text-left hover:border-ps sm:gap-5 sm:p-5">
            <span className="flex h-[80px] w-[80px] shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-line bg-gradient-to-br from-panel2 to-ink shadow-inner sm:h-24 sm:w-24">{o.icon}</span>
            <span className="min-w-0 flex-1">
              <span className="block text-xl font-extrabold leading-tight tracking-tight">{o.title}</span>
              <span className="mt-1 block leading-snug text-slate-300">{o.text}</span>
            </span>
            <span aria-hidden className="shrink-0 text-2xl text-slate-500 transition-transform group-hover:translate-x-1 group-hover:text-ps">›</span>
          </button>
        ))}
      </div>
      <p className="mt-6 flex gap-2 text-sm leading-relaxed text-slate-400">
        <svg aria-hidden viewBox="0 0 24 24" className="mt-0.5 h-5 w-5 shrink-0 text-slate-500" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>
        <span>{ui.noData}</span>
      </p>
    </section>
  );
}

/* ---------- pravila ---------- */
const HIGHLIGHT_ICONS = ["🔑", "🛡️", "🎮", "📌", "📋", "✔️"];
function TermsScreen({ guide, lang, content, onChangeProduct }: { guide: GuideType; lang: Lang; content: Content; onChangeProduct: () => void }) {
  const ui = UI[lang];
  const { kind, console: cons } = guideMeta(guide, lang);
  const t = content.terms;
  const show = (r: { for: string; console?: string }) =>
    (r.for === "all" || r.for === kind) && (!r.console || r.console === "all" || r.console === cons.toLowerCase());
  return (
    <section className="stagger">
      <h1 className="text-3xl font-extrabold leading-tight tracking-tight">{t.title}</h1>
      <p className="mt-3 text-lg leading-relaxed text-slate-300">{t.intro}</p>
      <h2 className="mb-3 mt-8 text-sm font-bold uppercase tracking-wider text-slate-400">{ui.termsHighlights}</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {t.highlights.filter(show).map((h, i) => (
          <div key={i} className="rounded-2xl border border-line bg-panel/70 p-4">
            <p className="font-bold leading-snug"><span aria-hidden className="mr-2">{HIGHLIGHT_ICONS[i % HIGHLIGHT_ICONS.length]}</span>{h.title}</p>
            <p className="mt-1.5 text-[15px] leading-relaxed text-slate-300">{h.text}</p>
          </div>
        ))}
      </div>
      <h2 className="mb-3 mt-10 text-sm font-bold uppercase tracking-wider text-slate-400">{ui.termsDetails}</h2>
      <ol className="divide-y divide-line rounded-2xl border border-line bg-panel/60">
        {t.rules.filter(show).map((r, i) => (
          <li key={i} className="flex gap-3 p-4">
            <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-panel2 text-xs font-bold text-slate-300">{i + 1}</span>
            <span><span className="block font-bold leading-snug">{r.title}</span>
              <span className="mt-1 block text-[15px] leading-relaxed text-slate-300">{r.text}</span></span>
          </li>
        ))}
      </ol>
      <button onClick={onChangeProduct} className="mt-5 bg-transparent text-sm font-semibold text-slate-400 underline">{ui.wrongChoice}</button>
    </section>
  );
}

/* ---------- korak ---------- */
function StepView({ step, lang, supportUrl, supportLabel }: { step: Step; lang: Lang; supportUrl: string; supportLabel: string }) {
  const ui = UI[lang];
  const lvl = step.level !== "none" ? LEVEL_STYLE[step.level] : null;
  const warning = step.warning && (
    <div role={step.level === "critical" ? "alert" : "note"} className={`rounded-2xl border p-4 ${lvl ? lvl.box : "border-line"}`} data-testid="warning">
      {lvl && <span className={`mb-2 inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-extrabold tracking-wide ${lvl.chip}`}>{lvl.icon} {ui[lvl.labelKey]}</span>}
      <p className="text-[15px] font-medium leading-relaxed text-slate-100 sm:text-base">{step.warning}</p>
    </div>
  );
  return (
    <article className="stagger">
      <h1 className="text-2xl font-extrabold leading-tight tracking-tight sm:text-3xl" data-testid="step-title">{step.title}</h1>
      {step.level === "critical" && <div className="mt-4">{warning}</div>}
      <div className="mt-5 space-y-4">
        {step.images.map((im, i) => <ZoomImage key={im.src + i} img={im} eager={i === 0} lang={lang} />)}
      </div>
      <RichText text={step.body} className="mt-5 text-[17px] leading-relaxed text-slate-100 sm:text-lg" />
      {step.level !== "critical" && warning && <div className="mt-5">{warning}</div>}
      {step.support && (
        <a href={supportUrl} target="_blank" rel="noopener noreferrer"
          className="mt-5 flex items-center justify-between gap-3 rounded-2xl border border-ps/60 bg-ps/15 p-4 font-semibold leading-snug no-underline" data-testid="support-link">
          <span>{supportLabel}</span><span aria-hidden>↗</span>
        </a>
      )}
    </article>
  );
}

/* ---------- završni ekran ---------- */
function FinalScreen({ guide, lang, product, content, promos, onBack, onRestart }: {
  guide: GuideType; lang: Lang; product: Product; content: Content; promos: Promo[]; onBack: () => void; onRestart: () => void;
}) {
  const ui = UI[lang];
  const meta = guideMeta(guide, lang);
  const f = content.final;
  const secondaryNote = meta.console === "PS4" ? f.secondaryPs4 : f.secondaryPs5;
  const lines = meta.kind === "primary"
    ? [f.primary, product === "ps_plus" ? f.psPlus : "", f.common]
    : [f.secondary, secondaryNote, product === "ps_plus" ? f.psPlus : "", f.common];
  return (
    <section className="stagger">
      <FinalBurst />
      <div className="pop text-5xl" aria-hidden>🎉</div>
      <h1 className="mt-2 text-3xl font-extrabold leading-tight tracking-tight" data-testid="final-title">{f.title}</h1>
      <div className="card mt-5 p-5">
        <p className="text-sm font-bold uppercase tracking-wider text-ps">{ui.yourChoice}</p>
        <p className="mt-1 text-xl font-extrabold">{meta.label}</p>
        <p className="text-slate-300">{product === "game" ? ui.gameLabel : ui.plusLabel}</p>
        <ul className="mt-4 space-y-3">
          {lines.filter(Boolean).map((l, i) => <li key={i} className="flex gap-2.5 leading-relaxed"><span aria-hidden>✔️</span><span>{l}</span></li>)}
        </ul>
      </div>
      {promos.map((p) => <div key={p.id} className="mt-5"><PromotionalBanner promo={p} /></div>)}
      <div className="card mt-5 border-ps/60 p-5" data-testid="final-support-card">
        <p className="text-lg font-extrabold leading-snug">{f.supportTitle}</p>
        <a href={content.settings.supportUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary mt-4 w-full no-underline" data-testid="final-support">
          {f.supportButton} →
        </a>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <button className="btn btn-primary" onClick={onRestart} data-testid="restart">{ui.restartFinal}</button>
        <Link href={homeHref(lang)} className="btn btn-ghost no-underline">{ui.backToAccounts}</Link>
      </div>
      <button onClick={onBack} className="mt-4 bg-transparent text-sm font-semibold text-slate-400 underline">{ui.prevStep}</button>
    </section>
  );
}

/** Slavlje pri dolasku na završni ekran. */
function FinalBurst() {
  useEffect(() => {
    const t = setTimeout(() => burst({ x: window.innerWidth / 2, y: window.innerHeight * 0.22, count: 70, power: 1.5 }), 250);
    return () => clearTimeout(t);
  }, []);
  return null;
}
