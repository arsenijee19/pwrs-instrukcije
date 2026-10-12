import { destroySession, requireAdmin } from "@/lib/auth";

export async function POST(req: Request) {
  const denied = await requireAdmin(req);
  if (denied) return denied;
  await destroySession();
  return Response.json({ ok: true });
}
