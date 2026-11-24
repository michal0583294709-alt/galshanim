"use server";

import { z } from "zod";
import { CustomerType } from "@prisma/client";
import { db } from "@/lib/db";
import { requireStaff } from "@/lib/auth/current";
import { can } from "@/lib/auth/permissions";
import { hashPassword } from "@/lib/auth/password";
import { back, int, isUniqueViolation, optStr, str } from "@/lib/forms";
import { redirect } from "next/navigation";

const Schema = z.object({
  business_name: z.string().min(2, "שם העסק חסר"),
  business_tax_id: z.string().regex(/^\d{8,9}$/, "ח.פ / ע.מ צריך להכיל 8–9 ספרות"),
  contact_name: z.string().min(2, "שם איש הקשר חסר"),
  email: z.email("מייל לא תקין"),
  phone: z.string().nullable(),
  address: z.string().nullable(),
  customer_type: z.enum(CustomerType).nullable(),
  is_active: z.boolean(),
});

function parse(fd: FormData) {
  return Schema.safeParse({
    business_name: str(fd, "business_name"),
    business_tax_id: str(fd, "business_tax_id").replace(/\D/g, ""),
    contact_name: str(fd, "contact_name"),
    email: str(fd, "email").toLowerCase(),
    phone: optStr(fd, "phone"),
    address: optStr(fd, "address"),
    customer_type: optStr(fd, "customer_type"),
    is_active: fd.get("is_active") === "on",
  });
}

/** אישור שוטף – רק המנהלת (החלטה) */
async function netTermsFrom(fd: FormData) {
  const me = await requireStaff("customers");
  if (!can(me, "admin")) return {};
  const approved = fd.get("is_net_terms_approved") === "on";
  return { is_net_terms_approved: approved, net_terms_days: approved ? int(fd, "net_terms_days") ?? 30 : null };
}

export async function createCustomerAction(fd: FormData) {
  await requireStaff("customers");
  const r = parse(fd);
  if (!r.success) back("/admin/customers/new", { error: r.error.issues[0].message });
  const password = str(fd, "password");
  if (password.length < 8) back("/admin/customers/new", { error: "סיסמה ראשונית – לפחות 8 תווים" });
  let id: string;
  try {
    const c = await db.customer.create({
      data: { ...r.data, ...(await netTermsFrom(fd)), password_hash: await hashPassword(password) },
    });
    id = c.id;
  } catch (e) {
    if (isUniqueViolation(e)) back("/admin/customers/new", { error: "כבר קיים לקוח עם המייל הזה" });
    throw e;
  }
  redirect(`/admin/customers/${id}?ok=${encodeURIComponent("הלקוח נוצר")}`);
}

export async function updateCustomerAction(fd: FormData) {
  await requireStaff("customers");
  const id = str(fd, "id");
  const r = parse(fd);
  if (!r.success) back(`/admin/customers/${id}`, { error: r.error.issues[0].message });
  const password = str(fd, "password");
  if (password && password.length < 8) back(`/admin/customers/${id}`, { error: "סיסמה חדשה – לפחות 8 תווים" });
  try {
    await db.customer.update({
      where: { id },
      data: {
        ...r.data,
        ...(await netTermsFrom(fd)),
        ...(password && { password_hash: await hashPassword(password) }),
      },
    });
  } catch (e) {
    if (isUniqueViolation(e)) back(`/admin/customers/${id}`, { error: "כבר קיים לקוח עם המייל הזה" });
    throw e;
  }
  back(`/admin/customers/${id}`, { ok: "פרטי הלקוח נשמרו" });
}

export async function deleteCustomerAction(fd: FormData) {
  await requireStaff("customers");
  const id = str(fd, "id");
  const orders = await db.order.count({ where: { customer_id: id } });
  if (orders > 0) {
    // ERD: Customer → Order = restrict, כדי לשמור היסטוריית הזמנות
    back(`/admin/customers/${id}`, {
      error: `ללקוח יש ${orders} הזמנות ולכן אי אפשר למחוק אותו (ההיסטוריה נשמרת). אפשר להשבית אותו – לבטל "חשבון פעיל".`,
    });
  }
  await db.customer.delete({ where: { id } });
  back("/admin/customers", { ok: "הלקוח נמחק" });
}
