"use server";

import { ProviderType } from "@prisma/client";
import { db } from "@/lib/db";
import { requireStaff } from "@/lib/auth/current";
import { back, optStr, str } from "@/lib/forms";

function data(fd: FormData) {
  const type = str(fd, "type") as ProviderType;
  const name = str(fd, "name");
  if (!Object.values(ProviderType).includes(type) || !name) return null;
  return { type, name, website: optStr(fd, "website"), notes: optStr(fd, "notes"), is_active: fd.get("is_active") === "on" };
}

export async function createProviderAction(fd: FormData) {
  await requireStaff("providers");
  const d = data(fd);
  if (!d) back("/admin/providers", { error: "יש לבחור סוג ולמלא שם" });
  await db.provider.create({ data: d });
  back("/admin/providers", { ok: "הספק נוסף" });
}

export async function updateProviderAction(fd: FormData) {
  await requireStaff("providers");
  const id = str(fd, "id");
  const d = data(fd);
  if (!d) back(`/admin/providers/${id}`, { error: "יש לבחור סוג ולמלא שם" });
  await db.provider.update({ where: { id }, data: d });
  back("/admin/providers", { ok: "הספק נשמר" });
}

export async function deleteProviderAction(fd: FormData) {
  await requireStaff("providers");
  await db.provider.delete({ where: { id: str(fd, "id") } });
  back("/admin/providers", { ok: "הספק נמחק" });
}
