import "server-only";
import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const COOKIE = "pw_admin";
const TTL_MS = 8 * 60 * 60 * 1000;

let devSecret: string | undefined;
function secret(): string {
  const s = process.env.SESSION_SECRET;
  if (s && s.length >= 16) return s;
  if (process.env.NODE_ENV === "production") throw new Error("SESSION_SECRET mora biti podešen (min. 16 karaktera).");
  return (devSecret ??= randomBytes(32).toString("hex"));
}
const sign = (data: string) => createHmac("sha256", secret()).update(data).digest("base64url");
const safeEq = (a: string, b: string) => {
  const A = Buffer.from(a), B = Buffer.from(b);
  return A.length === B.length && timingSafeEqual(A, B);
};

export function verifyPassword(input: string): boolean {
  const hash = process.env.ADMIN_PASSWORD_HASH;
  if (hash) {
    const [scheme, salt, key] = hash.split(":");
    if (scheme !== "scrypt" || !salt || !key) return false;
    const derived = scryptSync(input, salt, 64).toString("hex");
    return safeEq(derived, key);
  }
  const plain = process.env.ADMIN_PASSWORD;
  if (plain && process.env.NODE_ENV !== "production") return safeEq(input, plain);
  return false;
}
export function adminConfigured(): boolean {
  return !!process.env.ADMIN_PASSWORD_HASH || (!!process.env.ADMIN_PASSWORD && process.env.NODE_ENV !== "production");
}

export async function createSession(): Promise<void> {
  const payload = Buffer.from(JSON.stringify({ exp: Date.now() + TTL_MS, csrf: randomBytes(24).toString("base64url") })).toString("base64url");
  const jar = await cookies();
  jar.set(COOKIE, `${payload}.${sign(payload)}`, {
    httpOnly: true, sameSite: "strict", secure: process.env.NODE_ENV === "production", path: "/", maxAge: TTL_MS / 1000,
  });
}
export async function destroySession() {
  (await cookies()).delete(COOKIE);
}
export async function getSession(): Promise<{ csrf: string } | null> {
  const raw = (await cookies()).get(COOKIE)?.value;
  if (!raw) return null;
  const [payload, sig] = raw.split(".");
  if (!payload || !sig || !safeEq(sign(payload), sig)) return null;
  try {
    const p = JSON.parse(Buffer.from(payload, "base64url").toString());
    if (typeof p.exp !== "number" || p.exp < Date.now()) return null;
    return { csrf: String(p.csrf) };
  } catch {
    return null;
  }
}

/** Autorizacija za mutirajuće API rute: sesija + CSRF token + Origin provera. */
export async function requireAdmin(req: Request): Promise<Response | null> {
  const s = await getSession();
  if (!s) return Response.json({ error: "Niste prijavljeni." }, { status: 401 });
  if (req.method !== "GET") {
    const origin = req.headers.get("origin");
    const host = req.headers.get("host");
    if (origin && host && new URL(origin).host !== host) return Response.json({ error: "Neispravan origin." }, { status: 403 });
    const token = req.headers.get("x-csrf-token") ?? "";
    if (!safeEq(token, s.csrf)) return Response.json({ error: "CSRF provera nije prošla." }, { status: 403 });
  }
  return null;
}
export function clientIp(req: Request): string {
  return (req.headers.get("x-forwarded-for")?.split(",")[0] ?? req.headers.get("x-real-ip") ?? "local").trim();
}
