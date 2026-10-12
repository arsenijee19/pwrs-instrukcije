import type { Promo } from "@/lib/types";

/** Interni PlayWorld baner. Nikada se ne pozicionira preko sadržaja: uvek je običan blok u toku stranice. */
export function PromotionalBanner({ promo, variant = "card" }: { promo: Promo; variant?: "card" | "slim" }) {
  if (variant === "slim") {
    return (
      <a href={promo.url} target="_blank" rel="noopener noreferrer"
        className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-panel/70 px-4 py-3 text-sm no-underline">
        <span className="min-w-0"><strong className="text-white">{promo.title}</strong>
          <span className="block truncate text-slate-400">{promo.text}</span></span>
        <span className="shrink-0 font-semibold text-sky-300">{promo.button} ↗</span>
      </a>
    );
  }
  return (
    <section aria-label={promo.title} className="card overflow-hidden border-violet/40 bg-gradient-to-br from-violet/20 via-panel to-ps/15">
      <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center">
        {promo.image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={`${promo.image}-800.webp`} alt="" loading="lazy" decoding="async" className="h-36 w-full rounded-2xl object-cover sm:h-32 sm:w-48" />
        )}
        <div className="min-w-0 flex-1">
          <h2 className="text-xl font-extrabold leading-snug text-white">{promo.title}</h2>
          <p className="mt-2 leading-relaxed text-slate-300">{promo.text}</p>
          <a href={promo.url} target="_blank" rel="noopener noreferrer" className="btn btn-primary mt-4 w-full no-underline sm:w-auto">
            {promo.button} →
          </a>
        </div>
      </div>
    </section>
  );
}
