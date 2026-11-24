import "server-only";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const ALLOWED = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/svg+xml": "svg" } as const;
const MAX = 5 * 1024 * 1024;

/**
 * שמירת תמונה. כרגע לתיקייה public/uploads (פיתוח).
 * בפרודקשן יש להחליף לאחסון ענן (S3/R2) – רק הפונקציה הזו משתנה.
 */
export async function saveImage(file: File): Promise<string> {
  const ext = ALLOWED[file.type as keyof typeof ALLOWED];
  if (!ext) throw new Error("סוג קובץ לא נתמך (JPG, PNG, WEBP, SVG)");
  if (file.size > MAX) throw new Error("הקובץ גדול מ-5MB");
  const dir = path.join(process.cwd(), "public", "uploads");
  await mkdir(dir, { recursive: true });
  const name = `${randomUUID()}.${ext}`;
  await writeFile(path.join(dir, name), Buffer.from(await file.arrayBuffer()));
  return `/uploads/${name}`;
}
