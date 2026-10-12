"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { UI, type Lang } from "@/lib/i18n";
import type { Marker, StepImage as Img } from "@/lib/types";

export function Markers({ markers }: { markers: Marker[] }) {
  return (
    <>
      {markers.map((m) => (
        <span
          key={m.id}
          aria-hidden="true"
          className={`pointer-events-none absolute rounded-lg border-[3px] ${
            m.type === "target" ? "marker-pulse border-ok shadow-[0_0_0_2px_rgba(0,0,0,.45),0_0_22px_4px_rgba(37,224,140,.65)]" : "marker-forbidden border-bad shadow-[0_0_0_2px_rgba(0,0,0,.45)]"
          }`}
          style={{ left: `${m.x}%`, top: `${m.y}%`, width: `${m.w}%`, height: `${m.h}%` }}
        >
          {m.type === "forbidden" && (
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
              <line x1="6" y1="6" x2="94" y2="94" stroke="#ff4a5e" strokeWidth="5" vectorEffect="non-scaling-stroke" />
              <line x1="94" y1="6" x2="6" y2="94" stroke="#ff4a5e" strokeWidth="5" vectorEffect="non-scaling-stroke" />
            </svg>
          )}
          {m.label && (
            <span className={`absolute -top-3 left-1.5 whitespace-nowrap rounded-md px-1.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide sm:text-xs ${
              m.type === "target" ? "bg-ok text-black" : "bg-bad text-white"
            }`}>
              {m.label}
            </span>
          )}
        </span>
      ))}
    </>
  );
}

export function ImgTag({ img, sizes, eager = false, className = "" }: { img: Img; sizes: string; eager?: boolean; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`${img.src}-1600.webp`}
      srcSet={`${img.src}-800.webp 800w, ${img.src}-1600.webp ${Math.max(img.w, 1600)}w`}
      sizes={sizes}
      width={img.w}
      height={img.h}
      alt={img.alt}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      {...(eager ? { fetchPriority: "high" as const } : {})}
      className={`block h-auto w-full select-none ${className}`}
      draggable={false}
    />
  );
}

export function ZoomImage({ img, eager, lang = "sr" }: { img: Img; eager?: boolean; lang?: Lang }) {
  const ui = UI[lang];
  const [open, setOpen] = useState(false);
  const [zoom, setZoom] = useState(2);
  const ZOOMS = [1, 1.5, 2, 3];
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [open]);

  return (
    <figure className="m-0 mx-auto" style={img.maxW ? { maxWidth: `${img.maxW}px` } : undefined}>
      <button type="button" onClick={() => { setZoom(2); setOpen(true); }} aria-label={ui.zoomLabel(img.alt)}
        className="group relative block w-full overflow-hidden rounded-2xl border border-line skeleton p-0 shadow-xl">
        <span className="relative block">
          <ImgTag img={img} eager={eager} sizes="(min-width: 768px) 720px, 100vw" />
          <Markers markers={img.markers} />
        </span>
        <span className="absolute left-2 top-2 rounded-full bg-black/65 px-2.5 py-1 text-[11px] font-semibold text-white/90">{ui.zoomChip}</span>
      </button>
      {img.caption && <figcaption className="mt-2 text-center text-sm text-slate-400">{img.caption}</figcaption>}
      {open && createPortal(
        <div role="dialog" aria-modal="true" aria-label={ui.enlarged} className="fixed inset-0 z-50 flex flex-col bg-black">
          <div className="flex items-center justify-between gap-2 border-b border-line p-3">
            <button className="btn btn-ghost !min-h-11 !px-3 whitespace-nowrap !text-base" onClick={() => setZoom((z) => ZOOMS[Math.max(0, ZOOMS.indexOf(z) - 1)])} disabled={zoom === ZOOMS[0]}>{ui.zoomOut}</button>
            <button className="btn btn-ghost !min-h-11 !px-3 whitespace-nowrap !text-base" onClick={() => setZoom((z) => ZOOMS[Math.min(ZOOMS.length - 1, ZOOMS.indexOf(z) + 1)])} disabled={zoom === ZOOMS[ZOOMS.length - 1]}>{ui.zoomIn}</button>
            <button className="btn btn-primary !min-h-11 !px-3 whitespace-nowrap !text-base" onClick={() => setOpen(false)} autoFocus>{ui.close}</button>
          </div>
          <div className="flex-1 overflow-auto [will-change:scroll-position] [-webkit-overflow-scrolling:touch]">
            <div className="relative mx-auto" style={{ width: `${zoom * 100}%`, maxWidth: zoom === 1 ? "100%" : "none" }}>
              <ImgTag img={img} sizes="2000px" eager />
              <Markers markers={img.markers} />
            </div>
          </div>
          <p className="p-2 text-center text-xs text-slate-400">{ui.dragHint}</p>
        </div>,
        document.body,
      )}
      </figure>
  );
}
