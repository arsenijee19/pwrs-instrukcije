import { getSession, requireAdmin } from "@/lib/auth";
import { discardDraft, getDraft, hasUnpublishedChanges, listHistory, publishDraft, resetDraftToDefaults, restoreHistory, saveDraft } from "@/lib/db";
import { isLang, type Lang } from "@/lib/i18n";
import { ContentSchema } from "@/lib/types";

const langOf = (req: Request): Lang => { const l = new URL(req.url).searchParams.get("lang"); return isLang(l) ? l : "sr"; };

async function snapshot(lang: Lang) {
  const s = await getSession();
  return { csrf: s?.csrf, lang, draft: getDraft(lang), dirty: hasUnpublishedChanges(lang), history: listHistory(lang) };
}

export async function GET(req: Request) {
  const denied = await requireAdmin(req);
  if (denied) return denied;
  return Response.json(await snapshot(langOf(req)));
}

/** PUT = sačuvaj nacrt. */
export async function PUT(req: Request) {
  const denied = await requireAdmin(req);
  if (denied) return denied;
  const parsed = ContentSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return Response.json({ error: `Neispravni podaci: ${issue.path.join(".")}: ${issue.message}` }, { status: 400 });
  }
  saveDraft(parsed.data, langOf(req));
  return Response.json(await snapshot(langOf(req)));
}

/** POST {action: publish | discard | reset | restore, id?} */
export async function POST(req: Request) {
  const denied = await requireAdmin(req);
  if (denied) return denied;
  const body = (await req.json().catch(() => ({}))) as { action?: string; id?: number };
  const lang = langOf(req);
  switch (body.action) {
    case "publish": publishDraft(lang); break;
    case "discard": discardDraft(lang); break;
    case "reset": resetDraftToDefaults(lang); break;
    case "restore":
      if (!Number.isInteger(body.id) || !restoreHistory(body.id as number, lang)) return Response.json({ error: "Verzija nije pronađena." }, { status: 404 });
      break;
    default: return Response.json({ error: "Nepoznata akcija." }, { status: 400 });
  }
  return Response.json(await snapshot(lang));
}
