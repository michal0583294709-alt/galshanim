import "server-only";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { getStore } from "@netlify/blobs";

const ALLOWED = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/svg+xml": "svg" } as const;
const MAX = 5 * 1024 * 1024;
export const IMAGE_STORE = "product-images";

/** האם האתר רץ ב-Netlify (שם אין דיסק קבוע – שומרים ב-Netlify Blobs) */
export function onNetlify() {
  return Boolean(
    process.env.NETLIFY ||
      process.env.NETLIFY_BLOBS_CONTEXT ||
      (globalThis as { netlifyBlobsContext?: unknown }).netlifyBlobsContext,
  );
}

/**
 * שמירת תמונת מוצר.
 * ב-Netlify: ב-Netlify Blobs, ומוגשת דרך /images/<key>.
 * בהרצה מקומית: בתיקייה .uploads (מוגשת דרך אותו נתיב).
 */
export async function saveImage(file: File): Promise<string> {
  const ext = ALLOWED[file.type as keyof typeof ALLOWED];
  if (!ext) throw new Error("סוג קובץ לא נתמך (JPG, PNG, WEBP, SVG)");
  if (file.size > MAX) throw new Error("הקובץ גדול מ-5MB");
  const name = `${randomUUID()}.${ext}`;
  const data = await file.arrayBuffer();

  if (onNetlify()) {
    await getStore(IMAGE_STORE).set(name, data, { metadata: { contentType: file.type } });
    return `/images/${name}`;
  }

  await mkdir(LOCAL_DIR, { recursive: true });
  await writeFile(path.join(LOCAL_DIR, name), Buffer.from(data));
  return `/images/${name}`;
}

const LOCAL_DIR = path.join(process.cwd(), ".uploads");
const TYPE_BY_EXT: Record<string, string> = Object.fromEntries(Object.entries(ALLOWED).map(([t, e]) => [e, t]));

/** קריאת תמונה שנשמרה (מ-Blobs או מהדיסק המקומי) */
export async function readImage(key: string): Promise<{ data: ArrayBuffer; contentType: string } | null> {
  if (onNetlify()) {
    const res = await getStore(IMAGE_STORE).getWithMetadata(key, { type: "arrayBuffer" });
    if (!res) return null;
    return { data: res.data, contentType: String(res.metadata?.contentType ?? "application/octet-stream") };
  }
  try {
    const buf = await readFile(path.join(LOCAL_DIR, key));
    return { data: buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer, contentType: TYPE_BY_EXT[key.split(".").pop()!] };
  } catch {
    return null;
  }
}
