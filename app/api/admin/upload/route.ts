import { randomBytes } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { requireAdmin } from "@/lib/auth";
import { UPLOAD_DIR } from "@/lib/db";

const MAX_BYTES = 10 * 1024 * 1024;

export async function POST(req: Request) {
  const denied = await requireAdmin(req);
  if (denied) return denied;
  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return Response.json({ error: "Fajl nije poslat." }, { status: 400 });
  if (file.size > MAX_BYTES) return Response.json({ error: "Slika je prevelika (maks. 10 MB)." }, { status: 413 });
  const input = Buffer.from(await file.arrayBuffer());
  try {
    const img = sharp(input, { limitInputPixels: 50_000_000 });
    const meta = await img.metadata();
    if (!meta.format || !["jpeg", "png", "webp"].includes(meta.format)) {
      return Response.json({ error: "Dozvoljeni formati: JPG, PNG, WebP." }, { status: 415 });
    }
    const id = randomBytes(10).toString("hex");
    const big = await img.rotate().resize({ width: 1600, withoutEnlargement: true }).webp({ quality: 85 }).toBuffer({ resolveWithObject: true });
    const small = await sharp(big.data).resize({ width: 800, withoutEnlargement: true }).webp({ quality: 82 }).toBuffer();
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
    await fs.writeFile(path.join(UPLOAD_DIR, `${id}-1600.webp`), big.data);
    await fs.writeFile(path.join(UPLOAD_DIR, `${id}-800.webp`), small);
    return Response.json({ src: `/media/${id}`, w: big.info.width, h: big.info.height });
  } catch {
    return Response.json({ error: "Fajl nije ispravna slika." }, { status: 415 });
  }
}
