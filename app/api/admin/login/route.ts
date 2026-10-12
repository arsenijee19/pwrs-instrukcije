import { adminConfigured, clientIp, createSession, verifyPassword } from "@/lib/auth";
import { clearAttempts, loginBlocked, recordFailedLogin } from "@/lib/db";

export async function POST(req: Request) {
  const origin = req.headers.get("origin");
  const host = req.headers.get("host");
  if (origin && host && new URL(origin).host !== host) return Response.json({ error: "Neispravan origin." }, { status: 403 });
  if (!adminConfigured()) return Response.json({ error: "Admin lozinka nije podešena na serveru (vidi README)." }, { status: 503 });
  const ip = clientIp(req);
  if (loginBlocked(ip)) return Response.json({ error: "Previše pokušaja. Pokušajte ponovo za 15 minuta." }, { status: 429 });
  const body = (await req.json().catch(() => null)) as { password?: unknown } | null;
  const pw = typeof body?.password === "string" ? body.password : "";
  if (!pw || pw.length > 200 || !verifyPassword(pw)) {
    recordFailedLogin(ip);
    return Response.json({ error: "Pogrešna lozinka." }, { status: 401 });
  }
  clearAttempts(ip);
  await createSession();
  return Response.json({ ok: true });
}
