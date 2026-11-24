import "server-only";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { readSession } from "./session";
import { can, type Permission } from "./permissions";

export async function getCurrentCustomer() {
  const id = await readSession("customer");
  if (!id) return null;
  const c = await db.customer.findUnique({ where: { id } });
  return c && c.is_active ? c : null;
}

export async function requireCustomer() {
  const c = await getCurrentCustomer();
  if (!c) redirect("/login");
  return c;
}

export async function getCurrentStaff() {
  const id = await readSession("staff");
  if (!id) return null;
  const u = await db.staffUser.findUnique({ where: { id } });
  return u && u.is_active ? u : null;
}

/** כל פעולה במערכת הניהול עוברת כאן (PRD §8) */
export async function requireStaff(perm?: Permission | "admin") {
  const u = await getCurrentStaff();
  if (!u) redirect("/admin/login");
  if (perm && !can(u, perm)) redirect("/admin?denied=1");
  return u;
}
