import "server-only";
import { createRequire } from "node:module";
import type { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";
import manifest from "../content/assets-manifest.json";
import type { Lang } from "./i18n";
import { defaultContent } from "./seed";
import { ContentSchema, type Content } from "./types";

export const DATA_DIR = path.resolve(/* turbopackIgnore: true */ process.env.DATA_DIR || "./data");
export const UPLOAD_DIR = path.join(DATA_DIR, "uploads");

const key = (kind: "published" | "draft", lang: Lang) => (lang === "sr" ? kind : `${kind}:${lang}`);

/** Slike iz PDF-a dobijaju novi hash pri svakoj obradi; sadržaj u bazi se uvek usmerava na aktuelne fajlove. */
function remapAssets(c: Content): Content {
  const m = manifest as Record<string, { src: string; w: number; h: number; maxW?: number }>;
  for (const steps of Object.values(c.guides)) for (const st of steps) for (const im of st.images) {
    if (!im.src.startsWith("/guide/")) continue;
    const cur = m[im.src.slice(7).replace(/-[0-9a-f]{8}$/, "")];
    if (cur) { im.src = cur.src; im.w = cur.w; im.h = cur.h; if (cur.maxW) im.maxW = cur.maxW; }
  }
  return c;
}

type G = typeof globalThis & { __pwDb?: DatabaseSync };

/** node:sqlite (Node ≥ 22.5), a ako ga nema (npr. Node 20 na hostingu) pada na better-sqlite3 (isti API). */
function createDatabase(file: string): DatabaseSync {
  const builtin = (process as unknown as { getBuiltinModule?: (n: string) => { DatabaseSync: new (f: string) => DatabaseSync } | undefined }).getBuiltinModule;
  const sqlite = builtin?.("node:sqlite");
  if (sqlite) return new sqlite.DatabaseSync(file);
  const req = createRequire(path.join(process.cwd(), "package.json"));
  const Better = req("better-sqlite3");
  return new Better(file) as unknown as DatabaseSync;
}

function open(): DatabaseSync {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  const db = createDatabase(path.join(DATA_DIR, "instrukcije.sqlite"));
  db.exec(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS content (kind TEXT PRIMARY KEY, json TEXT NOT NULL, updated_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS history (id INTEGER PRIMARY KEY AUTOINCREMENT, json TEXT NOT NULL, created_at TEXT NOT NULL, lang TEXT NOT NULL DEFAULT 'sr');
    CREATE TABLE IF NOT EXISTS attempts (ip TEXT NOT NULL, ts INTEGER NOT NULL);
    CREATE INDEX IF NOT EXISTS attempts_ip ON attempts(ip, ts);
  `);
  try { db.exec("ALTER TABLE history ADD COLUMN lang TEXT NOT NULL DEFAULT 'sr'"); } catch { /* kolona već postoji */ }
  for (const lang of ["sr", "en"] as Lang[]) {
    if (!db.prepare("SELECT 1 FROM content WHERE kind=?").get(key("published", lang))) {
      const json = JSON.stringify(defaultContent(lang));
      const now = new Date().toISOString();
      db.prepare("INSERT INTO content(kind,json,updated_at) VALUES(?,?,?)").run(key("published", lang), json, now);
      db.prepare("INSERT OR IGNORE INTO content(kind,json,updated_at) VALUES(?,?,?)").run(key("draft", lang), json, now);
    }
  }
  return db;
}

export function db(): DatabaseSync {
  const g = globalThis as G;
  return (g.__pwDb ??= open());
}

function read(kind: "published" | "draft", lang: Lang): Content {
  const row = db().prepare("SELECT json FROM content WHERE kind=?").get(key(kind, lang)) as { json: string } | undefined;
  const raw = row ? JSON.parse(row.json) : null;
  const parsed = ContentSchema.safeParse(raw);
  if (!parsed.success) return defaultContent(lang);
  const c = parsed.data;
  if (raw && !("promos" in raw)) c.promos = defaultContent(lang).promos; // sadržaj sačuvan pre uvođenja promocija
  return remapAssets(c);
}
export const getPublished = (lang: Lang = "sr") => read("published", lang);
export const getDraft = (lang: Lang = "sr") => read("draft", lang);

export function hasUnpublishedChanges(lang: Lang = "sr"): boolean {
  const a = db().prepare("SELECT json FROM content WHERE kind=?").get(key("draft", lang)) as { json: string } | undefined;
  const b = db().prepare("SELECT json FROM content WHERE kind=?").get(key("published", lang)) as { json: string } | undefined;
  return !!a && !!b && a.json !== b.json;
}
export function saveDraft(c: Content, lang: Lang = "sr") {
  db().prepare("INSERT INTO content(kind,json,updated_at) VALUES(?,?,?) ON CONFLICT(kind) DO UPDATE SET json=excluded.json, updated_at=excluded.updated_at")
    .run(key("draft", lang), JSON.stringify(c), new Date().toISOString());
}
export function publishDraft(lang: Lang = "sr") {
  const d = db();
  const draft = d.prepare("SELECT json FROM content WHERE kind=?").get(key("draft", lang)) as { json: string };
  const now = new Date().toISOString();
  const cur = d.prepare("SELECT json FROM content WHERE kind=?").get(key("published", lang)) as { json: string } | undefined;
  if (cur) d.prepare("INSERT INTO history(json,created_at,lang) VALUES(?,?,?)").run(cur.json, now, lang);
  d.prepare("DELETE FROM history WHERE lang=? AND id NOT IN (SELECT id FROM history WHERE lang=? ORDER BY id DESC LIMIT 20)").run(lang, lang);
  d.prepare("INSERT INTO content(kind,json,updated_at) VALUES(?,?,?) ON CONFLICT(kind) DO UPDATE SET json=excluded.json, updated_at=excluded.updated_at")
    .run(key("published", lang), draft.json, now);
}
export function discardDraft(lang: Lang = "sr") {
  const pub = db().prepare("SELECT json FROM content WHERE kind=?").get(key("published", lang)) as { json: string };
  saveDraft(JSON.parse(pub.json), lang);
}
export function resetDraftToDefaults(lang: Lang = "sr") {
  saveDraft(defaultContent(lang), lang);
}
export function listHistory(lang: Lang = "sr"): { id: number; created_at: string }[] {
  return db().prepare("SELECT id, created_at FROM history WHERE lang=? ORDER BY id DESC").all(lang) as { id: number; created_at: string }[];
}
export function restoreHistory(id: number, lang: Lang = "sr"): boolean {
  const row = db().prepare("SELECT json FROM history WHERE id=? AND lang=?").get(id, lang) as { json: string } | undefined;
  if (!row) return false;
  saveDraft(JSON.parse(row.json), lang);
  return true;
}

/* rate limiting prijave */
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 6;
export function loginBlocked(ip: string): boolean {
  const since = Date.now() - WINDOW_MS;
  db().prepare("DELETE FROM attempts WHERE ts < ?").run(since);
  const r = db().prepare("SELECT COUNT(*) c FROM attempts WHERE ip=? AND ts>=?").get(ip, since) as { c: number };
  return r.c >= MAX_ATTEMPTS;
}
export function recordFailedLogin(ip: string) {
  db().prepare("INSERT INTO attempts(ip,ts) VALUES(?,?)").run(ip, Date.now());
}
export function clearAttempts(ip: string) {
  db().prepare("DELETE FROM attempts WHERE ip=?").run(ip);
}
