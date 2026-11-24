"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireStaff } from "@/lib/auth/current";
import { ALL_PERMISSIONS } from "@/lib/auth/permissions";
import { hashPassword } from "@/lib/auth/password";
import { back, isUniqueViolation, str } from "@/lib/forms";

function parse(fd: FormData) {
  const full_name = str(fd, "full_name");
  const email = str(fd, "email").toLowerCase();
  const role = str(fd, "role") === "admin" ? "admin" : "employee";
  if (full_name.length < 2) return { error: "שם מלא חסר" } as const;
  if (!z.email().safeParse(email).success) return { error: "מייל לא תקין" } as const;
  const permissions = role === "admin" ? [] : ALL_PERMISSIONS.filter((p) => fd.get(`perm_${p}`) === "on");
  return { data: { full_name, email, role, permissions, is_active: fd.get("is_active") === "on" } } as const;
}

export async function createUserAction(fd: FormData) {
  await requireStaff("admin");
  const r = parse(fd);
  if ("error" in r) back("/admin/users/new", { error: r.error });
  const password = str(fd, "password");
  if (password.length < 8) back("/admin/users/new", { error: "סיסמה – לפחות 8 תווים" });
  try {
    await db.staffUser.create({ data: { ...r.data, password_hash: await hashPassword(password) } });
  } catch (e) {
    if (isUniqueViolation(e)) back("/admin/users/new", { error: "כבר קיים משתמש עם המייל הזה" });
    throw e;
  }
  redirect(`/admin/users?ok=${encodeURIComponent("העובד נוסף")}`);
}

export async function updateUserAction(fd: FormData) {
  const me = await requireStaff("admin");
  const id = str(fd, "id");
  const r = parse(fd);
  if ("error" in r) back(`/admin/users/${id}`, { error: r.error });
  if (id === me.id && (r.data.role !== "admin" || !r.data.is_active)) {
    back(`/admin/users/${id}`, { error: "אי אפשר להוריד לעצמך הרשאת מנהלת או להשבית את עצמך" });
  }
  const password = str(fd, "password");
  if (password && password.length < 8) back(`/admin/users/${id}`, { error: "סיסמה – לפחות 8 תווים" });
  try {
    await db.staffUser.update({
      where: { id },
      data: { ...r.data, ...(password && { password_hash: await hashPassword(password) }) },
    });
  } catch (e) {
    if (isUniqueViolation(e)) back(`/admin/users/${id}`, { error: "כבר קיים משתמש עם המייל הזה" });
    throw e;
  }
  redirect(`/admin/users?ok=${encodeURIComponent("השינויים נשמרו")}`);
}

export async function deleteUserAction(fd: FormData) {
  const me = await requireStaff("admin");
  const id = str(fd, "id");
  if (id === me.id) back(`/admin/users/${id}`, { error: "אי אפשר למחוק את המשתמש שלך" });
  await db.staffUser.delete({ where: { id } });
  redirect(`/admin/users?ok=${encodeURIComponent("המשתמש נמחק")}`);
}
