import { redirect } from "next/navigation";

export function str(fd: FormData, key: string): string {
  const v = fd.get(key);
  return typeof v === "string" ? v.trim() : "";
}

export function optStr(fd: FormData, key: string): string | null {
  return str(fd, key) || null;
}

export function int(fd: FormData, key: string): number | null {
  const s = str(fd, key);
  if (!s) return null;
  const n = Number(s);
  return Number.isInteger(n) ? n : null;
}

/** חזרה לדף עם הודעה (שגיאה או הצלחה) בפרמטר בכתובת */
export function back(path: string, msg: { error?: string; ok?: string }): never {
  const u = new URL(path, "http://x");
  if (msg.error) u.searchParams.set("error", msg.error);
  if (msg.ok) u.searchParams.set("ok", msg.ok);
  redirect(u.pathname + u.search);
}

export function isUniqueViolation(e: unknown) {
  return typeof e === "object" && e !== null && "code" in e && (e as { code: string }).code === "P2002";
}

export function isFkViolation(e: unknown) {
  return typeof e === "object" && e !== null && "code" in e && ["P2003", "P2014"].includes((e as { code: string }).code);
}
