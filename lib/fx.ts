/** Mali event-bus za efekte: bilo koja komponenta može da zatraži „burst“ čestica. */
export type BurstOpts = { x?: number; y?: number; count?: number; power?: number };
export function burst(opts: BurstOpts = {}) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("pw:burst", { detail: opts }));
}
export function burstFromElement(el: Element | null, opts: Omit<BurstOpts, "x" | "y"> = {}) {
  if (!el) return burst(opts);
  const r = el.getBoundingClientRect();
  burst({ ...opts, x: r.left + r.width / 2, y: r.top + r.height / 2 });
}
