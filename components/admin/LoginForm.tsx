"use client";
import { useState } from "react";

export function LoginForm({ configured }: { configured: boolean }) {
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setErr("");
    const r = await fetch("/api/admin/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ password: pw }) });
    if (r.ok) location.reload();
    else { setErr((await r.json().catch(() => ({}))).error || "Greška."); setBusy(false); }
  }
  return (
    <main className="mx-auto max-w-sm px-4 py-24">
      <h1 className="text-2xl font-extrabold">PlayWorld admin</h1>
      {!configured && <p className="mt-4 rounded-xl border border-warn bg-warn/10 p-3 text-sm">Admin lozinka nije podešena na serveru. Pogledajte README (ADMIN_PASSWORD_HASH).</p>}
      <form onSubmit={submit} className="mt-6 space-y-4">
        <label className="block text-sm font-semibold">Lozinka
          <input type="password" autoComplete="current-password" value={pw} onChange={(e) => setPw(e.target.value)} autoFocus
            className="mt-1 w-full rounded-xl border border-line bg-panel px-4 py-3 text-base" />
        </label>
        {err && <p role="alert" className="text-sm font-semibold text-bad">{err}</p>}
        <button className="btn btn-primary w-full" disabled={busy || !pw}>Prijavi se</button>
      </form>
    </main>
  );
}
