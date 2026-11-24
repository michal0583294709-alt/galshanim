"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { verifyPassword } from "@/lib/auth/password";
import { createSession, destroySession } from "@/lib/auth/session";
import { back, str } from "@/lib/forms";

export async function staffLoginAction(fd: FormData) {
  const u = await db.staffUser.findUnique({ where: { email: str(fd, "email").toLowerCase() } });
  if (!u || !u.is_active || !(await verifyPassword(str(fd, "password"), u.password_hash))) {
    back("/admin/login", { error: "מייל או סיסמה שגויים" });
  }
  await createSession("staff", u.id);
  redirect("/admin");
}

export async function staffLogoutAction() {
  await destroySession("staff");
  redirect("/admin/login");
}
