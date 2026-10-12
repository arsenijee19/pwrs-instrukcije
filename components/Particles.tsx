"use client";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

type P = { x: number; y: number; vx: number; vy: number; r: number; a: number; life: number; max: number; kind: number; rot: number; vr: number; hue: string; burst: boolean };
const COLORS = ["#5aa2ff", "#8b6bff", "#7fd6ff", "#c3a8ff"];
const SYMBOL_COLORS = ["#5fe0b0", "#ff6b81", "#5aa2ff", "#ff9ad5"]; // △ ○ ✕ □
const rnd = (a: number, b: number) => a + Math.random() * (b - a);

function drawSymbol(c: CanvasRenderingContext2D, kind: number, s: number) {
  c.beginPath();
  if (kind === 0) { c.moveTo(0, -s); c.lineTo(s * 0.9, s * 0.7); c.lineTo(-s * 0.9, s * 0.7); c.closePath(); }
  else if (kind === 1) c.arc(0, 0, s * 0.85, 0, Math.PI * 2);
  else if (kind === 2) { c.moveTo(-s, -s); c.lineTo(s, s); c.moveTo(s, -s); c.lineTo(-s, s); }
  else c.rect(-s * 0.8, -s * 0.8, s * 1.6, s * 1.6);
  c.stroke();
}

/** Pozadinske čestice + „burst“ pri prelazima. Samo transform/alpha na canvasu, bez layout-a. */
export function Particles() {
  const ref = useRef<HTMLCanvasElement>(null);
  const path = usePathname();
  const off = path?.startsWith("/admin");

  useEffect(() => {
    if (off) return;
    const canvas = ref.current!;
    const ctx = canvas.getContext("2d", { alpha: true })!;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduce.matches) return;
    let w = 0, h = 0, raf = 0, last = performance.now();
    const weak = (navigator.hardwareConcurrency || 8) <= 4;
    const dpr = Math.min(window.devicePixelRatio || 1, weak ? 1 : 1.5);
    const ps: P[] = [];

    const resize = () => {
      w = window.innerWidth; h = window.innerHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      canvas.style.width = w + "px"; canvas.style.height = h + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    const ambient = (): P => ({
      x: rnd(0, w), y: rnd(0, h), vx: rnd(-6, 6), vy: rnd(-16, -5), r: rnd(1, 2.8), a: rnd(0.12, 0.5),
      life: 0, max: Infinity, kind: -1, rot: 0, vr: 0, hue: COLORS[(Math.random() * COLORS.length) | 0], burst: false,
    });
    const symbol = (): P => ({
      x: rnd(0, w), y: rnd(0, h), vx: rnd(-4, 4), vy: rnd(-9, -3), r: rnd(9, 20), a: rnd(0.07, 0.15),
      life: 0, max: Infinity, kind: (Math.random() * 4) | 0, rot: rnd(0, 6.28), vr: rnd(-0.25, 0.25),
      hue: SYMBOL_COLORS[(Math.random() * 4) | 0], burst: false,
    });
    resize();
    const base = Math.round(Math.min(weak ? 22 : 40, Math.max(14, (w * h) / 26000)));
    for (let i = 0; i < base; i++) ps.push(ambient());
    for (let i = 0; i < (weak ? 4 : 7); i++) ps.push(symbol());

    const onBurst = (e: Event) => {
      const d = (e as CustomEvent).detail || {};
      const x = d.x ?? w / 2, y = d.y ?? h * 0.55, n = d.count ?? 18, pw = d.power ?? 1;
      for (let i = 0; i < n; i++) {
        const ang = rnd(-Math.PI, 0) + rnd(-0.6, 0.6), sp = rnd(150, 400) * pw;
        const sym = Math.random() < 0.55;
        ps.push({
          x, y, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp, r: sym ? rnd(6, 11) : rnd(1.5, 3.2), a: 0.95,
          life: 0, max: rnd(0.7, 1.4), kind: sym ? (Math.random() * 4) | 0 : -1, rot: rnd(0, 6.28), vr: rnd(-6, 6),
          hue: sym ? SYMBOL_COLORS[(Math.random() * 4) | 0] : COLORS[(Math.random() * COLORS.length) | 0], burst: true,
        });
      }
    };

    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      ctx.clearRect(0, 0, w, h);
      for (let i = ps.length - 1; i >= 0; i--) {
        const p = ps[i];
        p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt;
        let alpha = p.a;
        if (p.burst) {
          p.life += dt; p.vy += 340 * dt; p.vx *= 1 - 1.4 * dt;
          const k = p.life / p.max; alpha = p.a * (1 - k) * (1 - k);
          if (p.life >= p.max) { ps.splice(i, 1); continue; }
        } else {
          if (p.y < -30) { p.y = h + 20; p.x = rnd(0, w); }
          if (p.x < -30) p.x = w + 20; else if (p.x > w + 30) p.x = -20;
          if (p.kind < 0) alpha = p.a * (0.6 + 0.4 * Math.sin(now / 900 + i));
        }
        ctx.globalAlpha = alpha;
        if (p.kind < 0) {
          ctx.fillStyle = p.hue; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.2832); ctx.fill();
        } else {
          ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
          ctx.strokeStyle = p.hue; ctx.lineWidth = p.burst ? 2.2 : 1.6; ctx.lineCap = "round"; ctx.lineJoin = "round";
          drawSymbol(ctx, p.kind, p.r); ctx.restore();
        }
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(frame);
    };
    const onVis = () => { cancelAnimationFrame(raf); if (!document.hidden) { last = performance.now(); raf = requestAnimationFrame(frame); } };

    raf = requestAnimationFrame(frame);
    window.addEventListener("resize", resize);
    window.addEventListener("pw:burst", onBurst);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pw:burst", onBurst);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [off]);

  if (off) return null;
  return <canvas ref={ref} aria-hidden="true" className="pointer-events-none fixed inset-0 z-0" />;
}
