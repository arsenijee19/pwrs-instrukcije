"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { GUIDE_META, GUIDE_TYPES, type Content, type GuideType, type Marker, type Promo, type Step, type StepImage } from "@/lib/types";
import { Markers } from "../StepImage";
import type { Lang } from "@/lib/i18n";

type State = { csrf: string; draft: Content; dirty: boolean; history: { id: number; created_at: string }[] };
type Tab = GuideType | "terms" | "final" | "promos" | "settings" | "history";

const inputCls = "w-full rounded-xl border border-line bg-panel px-3 py-2.5 text-base";
const uid = () => Math.random().toString(36).slice(2, 10);

export function AdminApp() {
  const [st, setSt] = useState<State | null>(null);
  const [content, setContent] = useState<Content | null>(null);
  const [localDirty, setLocalDirty] = useState(false);
  const [tab, setTab] = useState<Tab>("ps5-primary");
  const [msg, setMsg] = useState<{ t: "ok" | "err"; m: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [lang, setLang] = useState<Lang>("sr");
  const sUrl = `/api/admin/state?lang=${lang}`;

  const api = useCallback(async (method: string, url: string, body?: unknown, form?: FormData) => {
    const r = await fetch(url, {
      method,
      headers: { ...(form ? {} : { "content-type": "application/json" }), "x-csrf-token": csrfRef.current },
      body: form ?? (body !== undefined ? JSON.stringify(body) : undefined),
    });
    const j = await r.json().catch(() => ({}));
    if (r.status === 401) { location.reload(); }
    if (!r.ok) throw new Error(j.error || `Greška ${r.status}`);
    return j;
  }, []);
  const csrfRef = useRef("");

  useEffect(() => {
    setSt(null);
    fetch(`/api/admin/state?lang=${lang}`).then((r) => r.json()).then((j: State) => {
      csrfRef.current = j.csrf; setSt(j); setContent(j.draft); setLocalDirty(false);
    });
  }, [lang]);
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => { if (localDirty) e.preventDefault(); };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [localDirty]);

  const flash = (t: "ok" | "err", m: string) => { setMsg({ t, m }); setTimeout(() => setMsg(null), 5000); };
  const edit = (fn: (c: Content) => void) => {
    setContent((c) => { if (!c) return c; const n = structuredClone(c); fn(n); return n; });
    setLocalDirty(true);
  };

  async function run<T>(fn: () => Promise<T>, ok: string): Promise<T | undefined> {
    setBusy(true);
    try { const r = await fn(); flash("ok", ok); return r; } catch (e) { flash("err", (e as Error).message); } finally { setBusy(false); }
  }
  const adopt = (j: State) => { setSt({ ...j, csrf: csrfRef.current }); setContent(j.draft); setLocalDirty(false); };
  const save = () => run(async () => adopt(await api("PUT", sUrl, content)), "Nacrt je sačuvan.");
  const publish = async () => {
    if (!confirm("Objaviti izmene na javnom sajtu? Kupci će odmah videti nove korake.")) return;
    await run(async () => {
      if (localDirty) await api("PUT", sUrl, content);
      adopt(await api("POST", sUrl, { action: "publish" }));
    }, "Objavljeno na javnom sajtu.");
  };
  const discard = async () => {
    if (!confirm("Odbaciti sve neobjavljene izmene i vratiti nacrt na objavljenu verziju?")) return;
    await run(async () => adopt(await api("POST", sUrl, { action: "discard" })), "Nacrt je vraćen na objavljenu verziju.");
  };
  const logout = async () => { await api("POST", "/api/admin/logout", {}).catch(() => {}); location.reload(); };
  const previewHref = async (g: GuideType) => {
    if (localDirty) { const ok = await save(); if (!ok) return; }
    window.open(`/admin/preview/${g}?lang=${lang}`, "_blank");
  };

  if (!content || !st) return <p className="p-8">Učitavanje…</p>;
  const unpublished = st.dirty || localDirty;
  const tabs: { id: Tab; label: string }[] = [
    ...GUIDE_TYPES.map((g) => ({ id: g as Tab, label: GUIDE_META[g].short })),
    { id: "terms", label: "Pravila" }, { id: "final", label: "Završni ekran" }, { id: "promos", label: "Promocije" }, { id: "settings", label: "Podešavanja" }, { id: "history", label: "Verzije" },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 pb-24">
      <header className="sticky top-0 z-30 -mx-4 border-b border-line bg-ink px-4 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex overflow-hidden rounded-xl border border-line text-sm font-bold" role="group" aria-label="Jezik sadržaja">
            {(["sr", "en"] as Lang[]).map((l) => (
              <button key={l} className={`px-3 py-1.5 ${lang === l ? "bg-ps text-white" : "bg-panel text-slate-300"}`}
                onClick={() => { if (l !== lang && (!localDirty || confirm("Imate nesačuvane izmene. Odbaciti ih i promeniti jezik?"))) setLang(l); }}>
                {l === "sr" ? "SR" : "EN"}
              </button>
            ))}
          </div>
          <h1 className="mr-auto text-lg font-extrabold">PlayWorld admin
            {unpublished && <span className="ml-2 rounded-md bg-warn px-2 py-0.5 text-xs font-bold text-black">{localDirty ? "Nesačuvane izmene" : "Neobjavljeno"}</span>}
          </h1>
          <button className="btn btn-ghost !min-h-10 !px-3 !text-sm" disabled={busy || !localDirty} onClick={save}>Sačuvaj nacrt</button>
          <button className="btn btn-primary !min-h-10 !px-3 !text-sm" disabled={busy || !unpublished} onClick={publish}>Objavi</button>
          <button className="btn btn-ghost !min-h-10 !px-3 !text-sm" disabled={busy || !st.dirty && !localDirty} onClick={discard}>Odbaci</button>
          <button className="btn btn-ghost !min-h-10 !px-3 !text-sm" onClick={logout}>Odjava</button>
        </div>
        {msg && <p role="status" className={`mt-2 rounded-lg px-3 py-1.5 text-sm font-semibold ${msg.t === "ok" ? "bg-ok/20 text-ok" : "bg-bad/20 text-bad"}`}>{msg.m}</p>}
        <nav className="-mx-1 mt-3 flex gap-1.5 overflow-x-auto pb-1">
          {tabs.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-bold ${tab === t.id ? "bg-ps text-white" : "bg-panel2 text-slate-300"}`}>{t.label}</button>
          ))}
        </nav>
      </header>

      <div className="pt-5">
        {(GUIDE_TYPES as readonly string[]).includes(tab) && (
          <StepsEditor guide={tab as GuideType} content={content} edit={edit} api={api} flash={flash} onPreview={() => previewHref(tab as GuideType)} />
        )}
        {tab === "terms" && <TermsEditor content={content} edit={edit} />}
        {tab === "final" && <FinalEditor content={content} edit={edit} />}
        {tab === "promos" && <PromosEditor content={content} edit={edit} api={api} flash={flash} />}
        {tab === "settings" && (
          <div className="card space-y-4 p-5">
            <Field label="Podrška URL (https://)"><input className={inputCls} value={content.settings.supportUrl} onChange={(e) => edit((c) => { c.settings.supportUrl = e.target.value; })} /></Field>
            <Field label="Javni URL sajta"><input className={inputCls} value={content.settings.siteUrl} onChange={(e) => edit((c) => { c.settings.siteUrl = e.target.value; })} /></Field>
            <Field label="Link ka prodavnici (https://)"><input className={inputCls} value={content.settings.shopUrl} onChange={(e) => edit((c) => { c.settings.shopUrl = e.target.value; })} /></Field>
            <Field label="Tekst linka ka prodavnici (u zaglavlju)"><input className={inputCls} value={content.settings.shopLabel} onChange={(e) => edit((c) => { c.settings.shopLabel = e.target.value; })} /></Field>
            <Field label="Tekst linka podrške (na 2FA / GET STARTED koracima)"><textarea rows={2} className={inputCls} value={content.settings.supportLabel} onChange={(e) => edit((c) => { c.settings.supportLabel = e.target.value; })} /></Field>
            <hr className="border-line" />
            <button className="btn btn-ghost" onClick={async () => {
              if (!confirm("Vratiti SVE korake, pravila i poruke u nacrtu na fabričke vrednosti? Nacrt će biti prepisan.")) return;
              await run(async () => adopt(await api("POST", sUrl, { action: "reset" })), "Nacrt vraćen na fabričke vrednosti (nije objavljeno).");
            }}>Vrati nacrt na fabričke vrednosti</button>
          </div>
        )}
        {tab === "history" && (
          <div className="card p-5">
            <p className="mb-3 text-slate-300">Prethodne objavljene verzije (poslednjih 20). „Vrati u nacrt“ ne menja javni sajt dok ne kliknete Objavi.</p>
            {st.history.length === 0 && <p className="text-slate-400">Još nema prethodnih verzija.</p>}
            <ul className="divide-y divide-line">
              {st.history.map((h) => (
                <li key={h.id} className="flex items-center justify-between py-2.5">
                  <span>{new Date(h.created_at).toLocaleString("sr-RS")}</span>
                  <button className="btn btn-ghost !min-h-9 !text-sm" onClick={async () => {
                    if (!confirm("Prepisati nacrt ovom verzijom?")) return;
                    await run(async () => adopt(await api("POST", sUrl, { action: "restore", id: h.id })), "Verzija vraćena u nacrt.");
                  }}>Vrati u nacrt</button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block text-sm font-semibold text-slate-300"><span className="mb-1 block">{label}</span>{children}</label>;
}

/* ------------------------------------------------------------ koraci */
type Api = (m: string, u: string, b?: unknown, f?: FormData) => Promise<any>;
type Edit = (fn: (c: Content) => void) => void;

function StepsEditor({ guide, content, edit, api, flash, onPreview }: {
  guide: GuideType; content: Content; edit: Edit; api: Api; flash: (t: "ok" | "err", m: string) => void; onPreview: () => void;
}) {
  const steps = content.guides[guide];
  const [open, setOpen] = useState<string | null>(null);
  const [drag, setDrag] = useState<number | null>(null);
  const move = (from: number, to: number) => {
    if (to < 0 || to >= steps.length || from === to) return;
    edit((c) => { const a = c.guides[guide]; const [x] = a.splice(from, 1); a.splice(to, 0, x); });
  };
  const addStep = () => {
    const id = `${guide}-${uid()}`;
    edit((c) => {
      const a = c.guides[guide];
      const at = a.findIndex((s) => s.kind === "final");
      a.splice(at < 0 ? a.length : at, 0, {
        id, kind: "step", purchase: "both", title: "Novi korak", body: "", images: [], level: "none", warning: "",
        support: false, published: true, sourcePdf: "", sourcePage: null, placeholder: "",
      });
    });
    setOpen(id);
  };
  const stepsCountPer = (p: "game" | "ps_plus") => steps.filter((s) => s.published && (s.purchase === "both" || s.purchase === p)).length;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="mr-auto">
          <h2 className="text-xl font-extrabold">{GUIDE_META[guide].label}</h2>
          <p className="text-sm text-slate-400">Digitalna igra: {stepsCountPer("game")} koraka • PS Plus: {stepsCountPer("ps_plus")} koraka</p>
        </div>
        <button className="btn btn-ghost !min-h-10 !text-sm" onClick={onPreview}>👁 Pregled nacrta</button>
        <button className="btn btn-primary !min-h-10 !text-sm" onClick={addStep}>+ Novi korak</button>
      </div>
      <ol className="space-y-2">
        {steps.map((s, i) => (
          <li key={s.id} draggable onDragStart={() => setDrag(i)} onDragOver={(e) => e.preventDefault()}
            onDrop={() => { if (drag !== null) move(drag, i); setDrag(null); }}
            className={`card overflow-hidden ${drag === i ? "opacity-50" : ""} ${!s.published ? "opacity-70" : ""}`}>
            <div className="flex items-center gap-2 p-3">
              <span className="cursor-grab select-none px-1 text-xl text-slate-500" title="Prevucite da promenite redosled">⠿</span>
              <span className="w-7 text-center text-sm font-bold text-slate-400">{i + 1}</span>
              <button className="min-w-0 flex-1 bg-transparent text-left" onClick={() => setOpen(open === s.id ? null : s.id)}>
                <span className="block truncate font-bold">{s.kind === "final" ? "🏁 Završni ekran" : s.title}</span>
                <span className="mt-0.5 flex flex-wrap gap-1.5 text-[11px] font-bold uppercase">
                  {s.purchase !== "both" && <span className="rounded bg-violet/30 px-1.5 py-0.5">{s.purchase === "game" ? "samo igra" : "samo PS Plus"}</span>}
                  {s.level !== "none" && <span className={`rounded px-1.5 py-0.5 ${s.level === "critical" ? "bg-bad text-white" : s.level === "important" ? "bg-warn text-black" : "bg-sky-500"}`}>{s.level}</span>}
                  {!s.published && <span className="rounded bg-slate-600 px-1.5 py-0.5">sakriveno</span>}
                  {s.images.length > 0 && <span className="rounded bg-panel2 px-1.5 py-0.5">{s.images.length} slika</span>}
                </span>
              </button>
              <div className="flex shrink-0 gap-1">
                <IconBtn label="Gore" onClick={() => move(i, i - 1)} disabled={i === 0}>↑</IconBtn>
                <IconBtn label="Dole" onClick={() => move(i, i + 1)} disabled={i === steps.length - 1}>↓</IconBtn>
                <IconBtn label={s.published ? "Sakrij" : "Prikaži"} onClick={() => edit((c) => { c.guides[guide][i].published = !s.published; })}>{s.published ? "🙈" : "👁"}</IconBtn>
                {s.kind !== "final" && <>
                  <IconBtn label="Dupliraj" onClick={() => edit((c) => { const copy = structuredClone(s); copy.id = `${guide}-${uid()}`; copy.title += " (kopija)"; c.guides[guide].splice(i + 1, 0, copy); })}>⧉</IconBtn>
                  <IconBtn label="Obriši" onClick={() => { if (confirm(`Obrisati korak „${s.title}“? Ovo ne možete poništiti osim odbacivanjem nacrta.`)) edit((c) => { c.guides[guide].splice(i, 1); }); }}>🗑</IconBtn>
                </>}
              </div>
            </div>
            {open === s.id && <StepForm step={s} guide={guide} edit={edit} idx={i} api={api} flash={flash} />}
          </li>
        ))}
      </ol>
    </div>
  );
}
function IconBtn({ label, onClick, disabled, children }: { label: string; onClick: () => void; disabled?: boolean; children: React.ReactNode }) {
  return <button title={label} aria-label={label} disabled={disabled} onClick={onClick} className="h-10 w-10 rounded-lg bg-panel2 text-lg disabled:opacity-30">{children}</button>;
}

function StepForm({ step, guide, idx, edit, api, flash }: { step: Step; guide: GuideType; idx: number; edit: Edit; api: Api; flash: (t: "ok" | "err", m: string) => void }) {
  const set = (fn: (s: Step) => void) => edit((c) => fn(c.guides[guide][idx]));
  const isFinal = step.kind === "final";
  const fileRef = useRef<HTMLInputElement>(null);
  async function upload(file: File, replaceAt?: number) {
    const fd = new FormData(); fd.append("file", file);
    try {
      const r = await api("POST", "/api/admin/upload", undefined, fd);
      set((s) => {
        const im: StepImage = { src: r.src, w: r.w, h: r.h, alt: replaceAt !== undefined ? s.images[replaceAt].alt : "", caption: "", markers: [] };
        if (replaceAt !== undefined) im.markers = s.images[replaceAt].markers, s.images[replaceAt] = im; else s.images.push(im);
      });
      flash("ok", "Slika je uploadovana. Dodajte alt opis.");
    } catch (e) { flash("err", (e as Error).message); }
  }
  return (
    <div className="space-y-4 border-t border-line bg-ink/40 p-4">
      {isFinal ? (
        <p className="text-sm text-slate-300">Završni ekran: naslov, poruke i link podrške uređuju se u kartici „Završni ekran“.</p>
      ) : (
        <>
          <Field label="Naslov koraka"><input className={inputCls} value={step.title} onChange={(e) => set((s) => { s.title = e.target.value; })} /></Field>
          <Field label="Opis (**podebljano**, liste sa „- “, prazan red = novi pasus)">
            <textarea rows={5} className={inputCls} value={step.body} onChange={(e) => set((s) => { s.body = e.target.value; })} />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Prikazuje se za">
              <select className={inputCls} value={step.purchase} onChange={(e) => set((s) => { s.purchase = e.target.value as Step["purchase"]; })}>
                <option value="both">Digitalnu igru i PS Plus</option><option value="game">Samo digitalnu igru</option><option value="ps_plus">Samo PS Plus</option>
              </select>
            </Field>
            <Field label="Tip upozorenja">
              <select className={inputCls} value={step.level} onChange={(e) => set((s) => { s.level = e.target.value as Step["level"]; })}>
                <option value="none">Bez upozorenja</option><option value="info">Informacija (plavo)</option><option value="important">Važno (žuto)</option><option value="critical">Kritično (crveno)</option>
              </select>
            </Field>
          </div>
          <Field label="Tekst upozorenja"><textarea rows={2} className={inputCls} value={step.warning} onChange={(e) => set((s) => { s.warning = e.target.value; })} /></Field>
          <label className="flex items-center gap-3 font-semibold"><input type="checkbox" className="h-5 w-5" checked={step.support} onChange={(e) => set((s) => { s.support = e.target.checked; })} /> Prikaži link ka podršci na ovom koraku</label>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Izvorni PDF (za evidenciju)"><input className={inputCls} value={step.sourcePdf} onChange={(e) => set((s) => { s.sourcePdf = e.target.value; })} /></Field>
            <Field label="Strana u PDF-u"><input type="number" min={0} className={inputCls} value={step.sourcePage ?? ""} onChange={(e) => set((s) => { s.sourcePage = e.target.value === "" ? null : Number(e.target.value); })} /></Field>
          </div>
          <div>
            <p className="mb-2 text-sm font-bold text-slate-300">Slike i oznake</p>
            <div className="space-y-4">
              {step.images.map((im, ii) => (
                <ImageEditor key={im.src + ii} im={im}
                  onChange={(fn) => set((s) => fn(s.images[ii]))}
                  onRemove={() => { if (confirm("Ukloniti sliku sa ovog koraka?")) set((s) => { s.images.splice(ii, 1); }); }}
                  onMove={(d) => set((s) => { const j = ii + d; if (j >= 0 && j < s.images.length) { const [x] = s.images.splice(ii, 1); s.images.splice(j, 0, x); } })}
                  onReplace={(f) => upload(f, ii)} />
              ))}
            </div>
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); e.target.value = ""; }} />
            <button className="btn btn-ghost mt-3 !min-h-10 !text-sm" onClick={() => fileRef.current?.click()}>+ Dodaj sliku (JPG/PNG/WebP, do 10 MB)</button>
            {step.images.length === 0 && step.placeholder && <p className="mt-2 rounded-lg border border-warn/60 bg-warn/10 p-2 text-sm">⚠ {step.placeholder}</p>}
          </div>
        </>
      )}
    </div>
  );
}

function ImageEditor({ im, onChange, onRemove, onMove, onReplace }: {
  im: StepImage; onChange: (fn: (i: StepImage) => void) => void; onRemove: () => void; onMove: (d: number) => void; onReplace: (f: File) => void;
}) {
  const box = useRef<HTMLDivElement>(null);
  const [draw, setDraw] = useState<{ x0: number; y0: number; x1: number; y1: number } | null>(null);
  const [kind, setKind] = useState<Marker["type"]>("target");
  const rep = useRef<HTMLInputElement>(null);
  const pt = (e: React.PointerEvent) => {
    const r = box.current!.getBoundingClientRect();
    return { x: Math.min(100, Math.max(0, ((e.clientX - r.left) / r.width) * 100)), y: Math.min(100, Math.max(0, ((e.clientY - r.top) / r.height) * 100)) };
  };
  const rect = draw && { x: Math.min(draw.x0, draw.x1), y: Math.min(draw.y0, draw.y1), w: Math.abs(draw.x1 - draw.x0), h: Math.abs(draw.y1 - draw.y0) };
  const num = (v: string) => Math.min(100, Math.max(0, Number(v) || 0));
  return (
    <div className="rounded-2xl border border-line p-3">
      <div ref={box} className="relative cursor-crosshair touch-none select-none overflow-hidden rounded-xl"
        onPointerDown={(e) => { (e.target as HTMLElement).setPointerCapture?.(e.pointerId); const p = pt(e); setDraw({ x0: p.x, y0: p.y, x1: p.x, y1: p.y }); }}
        onPointerMove={(e) => { if (draw) { const p = pt(e); setDraw({ ...draw, x1: p.x, y1: p.y }); } }}
        onPointerUp={() => {
          if (rect && rect.w > 1 && rect.h > 1) onChange((i) => { i.markers.push({ id: uid(), type: kind, x: +rect.x.toFixed(1), y: +rect.y.toFixed(1), w: +rect.w.toFixed(1), h: +rect.h.toFixed(1), label: kind === "target" ? "Izaberite" : "NE" }); });
          setDraw(null);
        }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`${im.src}-800.webp`} alt={im.alt} className="block w-full" draggable={false} />
        <Markers markers={im.markers} />
        {rect && <span className="absolute border-2 border-dashed border-white bg-white/10" style={{ left: `${rect.x}%`, top: `${rect.y}%`, width: `${rect.w}%`, height: `${rect.h}%` }} />}
      </div>
      <p className="mt-2 text-xs text-slate-400">Prevucite preko slike da nacrtate oznaku. Vrsta nove oznake:
        <select className="ml-2 rounded bg-panel px-2 py-1" value={kind} onChange={(e) => setKind(e.target.value as Marker["type"])}>
          <option value="target">✔ Izaberite ovo (zeleno)</option><option value="forbidden">✕ Zabranjeno (crveno)</option>
        </select>
      </p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <Field label="Alt opis (za čitače ekrana)"><input className={inputCls} value={im.alt} onChange={(e) => onChange((i) => { i.alt = e.target.value; })} /></Field>
        <Field label="Natpis ispod slike (opciono)"><input className={inputCls} value={im.caption} onChange={(e) => onChange((i) => { i.caption = e.target.value; })} /></Field>
      </div>
      {im.markers.length > 0 && (
        <ul className="mt-3 space-y-2">
          {im.markers.map((m, mi) => (
            <li key={m.id} className="flex flex-wrap items-center gap-2 text-sm">
              <span className={m.type === "target" ? "text-ok" : "text-bad"}>{m.type === "target" ? "✔" : "✕"}</span>
              <input className="w-28 rounded bg-panel px-2 py-1" value={m.label} placeholder="natpis" onChange={(e) => onChange((i) => { i.markers[mi].label = e.target.value.slice(0, 40); })} />
              {(["x", "y", "w", "h"] as const).map((k) => (
                <label key={k} className="flex items-center gap-1">{k}<input type="number" step="0.5" className="w-16 rounded bg-panel px-1 py-1" value={m[k]} onChange={(e) => onChange((i) => { i.markers[mi][k] = num(e.target.value) || (k === "w" || k === "h" ? 1 : 0); })} />%</label>
              ))}
              <button className="rounded bg-panel2 px-2 py-1" onClick={() => onChange((i) => { i.markers.splice(mi, 1); })}>Ukloni</button>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-3 flex flex-wrap gap-2">
        <button className="btn btn-ghost !min-h-9 !px-3 !text-sm" onClick={() => onMove(-1)}>↑ Gore</button>
        <button className="btn btn-ghost !min-h-9 !px-3 !text-sm" onClick={() => onMove(1)}>↓ Dole</button>
        <input ref={rep} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) onReplace(f); e.target.value = ""; }} />
        <button className="btn btn-ghost !min-h-9 !px-3 !text-sm" onClick={() => rep.current?.click()}>Zameni sliku</button>
        <button className="btn btn-ghost !min-h-9 !px-3 !text-sm !text-bad" onClick={onRemove}>Ukloni sliku</button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------ pravila / kraj */
function TermsEditor({ content, edit }: { content: Content; edit: Edit }) {
  const t = content.terms;
  const FOR = [["all", "Svi tipovi"], ["primary", "Samo Primary"], ["secondary", "Samo Secondary"]] as const;
  const list = (key: "highlights" | "rules", title: string) => (
    <div className="card p-5">
      <h3 className="mb-3 text-lg font-bold">{title}</h3>
      <div className="space-y-4">
        {t[key].map((r, i) => (
          <div key={i} className="rounded-xl border border-line p-3">
            <input className={inputCls} value={r.title} onChange={(e) => edit((c) => { c.terms[key][i].title = e.target.value; })} />
            <textarea rows={3} className={`${inputCls} mt-2`} value={r.text} onChange={(e) => edit((c) => { c.terms[key][i].text = e.target.value; })} />
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <select className="rounded-lg bg-panel px-2 py-1.5" value={r.for} onChange={(e) => edit((c) => { c.terms[key][i].for = e.target.value as "all"; })}>
                {FOR.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
              <select className="rounded-lg bg-panel px-2 py-1.5" value={r.console} onChange={(e) => edit((c) => { c.terms[key][i].console = e.target.value as "all"; })}>
                <option value="all">PS4 i PS5</option><option value="ps4">Samo PS4</option><option value="ps5">Samo PS5</option>
              </select>
              <button className="rounded-lg bg-panel2 px-2 py-1.5" disabled={i === 0} onClick={() => edit((c) => { const a = c.terms[key]; [a[i - 1], a[i]] = [a[i], a[i - 1]]; })}>↑</button>
              <button className="rounded-lg bg-panel2 px-2 py-1.5" disabled={i === t[key].length - 1} onClick={() => edit((c) => { const a = c.terms[key]; [a[i + 1], a[i]] = [a[i], a[i + 1]]; })}>↓</button>
              <button className="rounded-lg bg-panel2 px-2 py-1.5" onClick={() => { if (confirm("Obrisati stavku?")) edit((c) => { c.terms[key].splice(i, 1); }); }}>🗑</button>
            </div>
          </div>
        ))}
      </div>
      <button className="btn btn-ghost mt-3 !min-h-10 !text-sm" onClick={() => edit((c) => { c.terms[key].push({ title: "Novo pravilo", text: "", for: "all", console: "all" }); })}>+ Dodaj</button>
    </div>
  );
  return (
    <div className="space-y-5">
      <div className="card space-y-4 p-5">
        <Field label="Naslov"><input className={inputCls} value={t.title} onChange={(e) => edit((c) => { c.terms.title = e.target.value; })} /></Field>
        <Field label="Uvod"><textarea rows={2} className={inputCls} value={t.intro} onChange={(e) => edit((c) => { c.terms.intro = e.target.value; })} /></Field>
        <Field label="Tekst checkbox-a"><input className={inputCls} value={t.checkbox} onChange={(e) => edit((c) => { c.terms.checkbox = e.target.value; })} /></Field>
        <Field label="Tekst dugmeta"><input className={inputCls} value={t.button} onChange={(e) => edit((c) => { c.terms.button = e.target.value; })} /></Field>
      </div>
      {list("highlights", "Kratke kartice (najvažnije zabrane)")}
      {list("rules", "Pun tekst pravila")}
    </div>
  );
}

function FinalEditor({ content, edit }: { content: Content; edit: Edit }) {
  const f = content.final;
  const rows: [keyof Content["final"], string, number][] = [
    ["title", "Naslov", 1], ["supportTitle", "Poruka o dodatnom kodu / pomoći", 2], ["supportButton", "Tekst dugmeta podrške", 1],
    ["primary", "Sažetak za Primary", 2], ["secondary", "Sažetak za Secondary", 2], ["secondaryPs4", "Dodatak za Secondary (PS4)", 2], ["secondaryPs5", "Dodatak za Secondary (PS5)", 2], ["psPlus", "Dodatak za PS Plus", 2], ["common", "Opšte pravilo (svi)", 2],
  ];
  return (
    <div className="card space-y-4 p-5">
      {rows.map(([k, label, r]) => (
        <Field key={k} label={label}><textarea rows={r} className={inputCls} value={f[k]} onChange={(e) => edit((c) => { c.final[k] = e.target.value; })} /></Field>
      ))}
      <p className="text-sm text-slate-400">Link podrške (https://support.playworld.rs) menja se u kartici „Podešavanja“.</p>
    </div>
  );
}

/* ------------------------------------------------------------ promocije */
function PromosEditor({ content, edit, api, flash }: { content: Content; edit: Edit; api: Api; flash: (t: "ok" | "err", m: string) => void }) {
  const list = content.promos;
  const PLACES: [Promo["placements"][number], string][] = [["home", "Početna stranica"], ["steps", "Tokom koraka (diskretno)"], ["final", "Završna stranica"]];
  async function upload(file: File, i: number) {
    const fd = new FormData(); fd.append("file", file);
    try { const r = await api("POST", "/api/admin/upload", undefined, fd); edit((c) => { c.promos[i].image = r.src; }); flash("ok", "Slika je uploadovana."); }
    catch (e) { flash("err", (e as Error).message); }
  }
  return (
    <div className="space-y-4">
      <p className="text-slate-300">Interni PlayWorld baneri. Svaki se prikazuje samo na izabranim mestima i nikada ne prekriva instrukcije. Cene, popuste i rokove unosite samo ako su tačni.</p>
      {list.map((p, i) => (
        <div key={p.id} className={`card space-y-3 p-4 ${p.enabled ? "" : "opacity-70"}`}>
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 font-bold"><input type="checkbox" className="h-5 w-5" checked={p.enabled} onChange={(e) => edit((c) => { c.promos[i].enabled = e.target.checked; })} /> Uključen</label>
            <button className="ml-auto rounded-lg bg-panel2 px-3 py-1.5" onClick={() => { if (confirm("Obrisati baner?")) edit((c) => { c.promos.splice(i, 1); }); }}>🗑 Obriši</button>
          </div>
          <Field label="Naslov"><input className={inputCls} value={p.title} onChange={(e) => edit((c) => { c.promos[i].title = e.target.value; })} /></Field>
          <Field label="Opis"><textarea rows={3} className={inputCls} value={p.text} onChange={(e) => edit((c) => { c.promos[i].text = e.target.value; })} /></Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Tekst dugmeta"><input className={inputCls} value={p.button} onChange={(e) => edit((c) => { c.promos[i].button = e.target.value; })} /></Field>
            <Field label="Link (https://)"><input className={inputCls} value={p.url} onChange={(e) => edit((c) => { c.promos[i].url = e.target.value; })} /></Field>
          </div>
          <div className="flex flex-wrap gap-4">
            {PLACES.map(([k, l]) => (
              <label key={k} className="flex items-center gap-2 text-sm font-semibold">
                <input type="checkbox" className="h-5 w-5" checked={p.placements.includes(k)}
                  onChange={(e) => edit((c) => { const a = c.promos[i].placements; if (e.target.checked) { if (!a.includes(k)) a.push(k); } else c.promos[i].placements = a.filter((x) => x !== k); })} /> {l}
              </label>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {p.image && <img src={`${p.image}-800.webp`} alt="" className="h-16 w-28 rounded-lg object-cover" />}
            <label className="btn btn-ghost !min-h-10 !text-sm">{p.image ? "Zameni sliku" : "Dodaj sliku (opciono)"}
              <input type="file" hidden accept="image/jpeg,image/png,image/webp" onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f, i); e.target.value = ""; }} />
            </label>
            {p.image && <button className="btn btn-ghost !min-h-10 !text-sm" onClick={() => edit((c) => { c.promos[i].image = ""; })}>Ukloni sliku</button>}
          </div>
        </div>
      ))}
      <button className="btn btn-primary !min-h-11" onClick={() => edit((c) => { c.promos.push({ id: `promo-${uid()}`, title: "Novi baner", text: "", image: "", button: "Saznajte više", url: c.settings.shopUrl, enabled: false, placements: ["home"] }); })}>+ Novi baner</button>
    </div>
  );
}
