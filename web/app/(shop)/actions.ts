"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { CustomerType, PaymentMethod } from "@prisma/client";
import { db } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { createSession, destroySession } from "@/lib/auth/session";
import { requireCustomer } from "@/lib/auth/current";
import { readCart, writeCart, clearCart } from "@/lib/cart";
import { createOrder, OrderError } from "@/lib/orders";
import { paymentGateway } from "@/lib/integrations/payments";
import { back, int, isUniqueViolation, optStr, str } from "@/lib/forms";

const BusinessSchema = z.object({
  business_name: z.string().min(2, "שם העסק חסר"),
  business_tax_id: z.string().regex(/^\d{8,9}$/, "ח.פ / ע.מ צריך להכיל 8–9 ספרות"),
  contact_name: z.string().min(2, "שם איש הקשר חסר"),
  phone: z.string().nullable(),
  address: z.string().nullable(),
  customer_type: z.enum(CustomerType).nullable(),
});

function businessFrom(fd: FormData) {
  return BusinessSchema.safeParse({
    business_name: str(fd, "business_name"),
    business_tax_id: str(fd, "business_tax_id").replace(/\D/g, ""),
    contact_name: str(fd, "contact_name"),
    phone: optStr(fd, "phone"),
    address: optStr(fd, "address"),
    customer_type: optStr(fd, "customer_type"),
  });
}

export async function registerAction(fd: FormData) {
  const biz = businessFrom(fd);
  if (!biz.success) back("/register", { error: biz.error.issues[0].message });
  const email = str(fd, "email").toLowerCase();
  const password = str(fd, "password");
  if (!z.email().safeParse(email).success) back("/register", { error: "כתובת המייל אינה תקינה" });
  if (password.length < 8) back("/register", { error: "הסיסמה צריכה להכיל לפחות 8 תווים" });

  let id: string;
  try {
    const c = await db.customer.create({
      data: { ...biz.data, email, password_hash: await hashPassword(password) },
    });
    id = c.id;
  } catch (e) {
    if (isUniqueViolation(e)) back("/register", { error: "כבר קיים חשבון עם המייל הזה" });
    throw e;
  }
  await createSession("customer", id);
  redirect("/catalog");
}

export async function loginAction(fd: FormData) {
  const email = str(fd, "email").toLowerCase();
  const c = await db.customer.findUnique({ where: { email } });
  if (!c || !c.is_active || !(await verifyPassword(str(fd, "password"), c.password_hash))) {
    back("/login", { error: "מייל או סיסמה שגויים" });
  }
  await createSession("customer", c.id);
  redirect(str(fd, "next") || "/catalog");
}

export async function logoutAction() {
  await destroySession("customer");
  redirect("/login");
}

export async function updateAccountAction(fd: FormData) {
  const me = await requireCustomer();
  const biz = businessFrom(fd);
  if (!biz.success) back("/account", { error: biz.error.issues[0].message });
  await db.customer.update({ where: { id: me.id }, data: biz.data });
  back("/account", { ok: "הפרטים נשמרו" });
}

/** הוספת כמה וריאציות לעגלה בבת אחת (שדות qty_<variantId>) */
export async function addToCartAction(fd: FormData) {
  await requireCustomer();
  const productId = str(fd, "productId");
  const color = str(fd, "color");
  const cart = await readCart();
  const adds: { variantId: string; quantity: number }[] = [];
  for (const [k, v] of fd.entries()) {
    if (!k.startsWith("qty_")) continue;
    const q = Number(v);
    if (Number.isInteger(q) && q > 0) adds.push({ variantId: k.slice(4), quantity: q });
  }
  const backTo = `/products/${productId}?color=${encodeURIComponent(color)}`;
  if (adds.length === 0) back(backTo, { error: "לא נבחרה כמות" });

  const variants = await db.productVariant.findMany({ where: { id: { in: adds.map((a) => a.variantId) } } });
  for (const a of adds) {
    const v = variants.find((x) => x.id === a.variantId);
    if (!v) continue;
    const existing = cart.find((l) => l.variantId === a.variantId);
    const total = (existing?.quantity ?? 0) + a.quantity;
    if (total > v.stock_quantity) {
      back(backTo, { error: `אי אפשר להזמין יותר מהמלאי (${v.size}, ${v.color}: ${v.stock_quantity} יח')` });
    }
    if (existing) existing.quantity = total;
    else cart.push({ ...a });
  }
  await writeCart(cart);
  back(backTo, { ok: "נוסף לעגלה" });
}

export async function updateCartAction(fd: FormData) {
  await requireCustomer();
  const cart = await readCart();
  const variants = await db.productVariant.findMany({ where: { id: { in: cart.map((l) => l.variantId) } } });
  const next = [];
  for (const l of cart) {
    const q = int(fd, `qty_${l.variantId}`) ?? l.quantity;
    if (q <= 0) continue;
    const v = variants.find((x) => x.id === l.variantId);
    if (!v) continue;
    if (q > v.stock_quantity) back("/cart", { error: `במלאי יש רק ${v.stock_quantity} יח' (${v.size}, ${v.color})` });
    next.push({ variantId: l.variantId, quantity: q });
  }
  await writeCart(next);
  back("/cart", { ok: "העגלה עודכנה" });
}

export async function removeFromCartAction(fd: FormData) {
  await requireCustomer();
  const id = str(fd, "variantId");
  await writeCart((await readCart()).filter((l) => l.variantId !== id));
  redirect("/cart");
}

export async function placeOrderAction(fd: FormData) {
  const me = await requireCustomer();
  const method = str(fd, "payment_method") as PaymentMethod;
  if (!Object.values(PaymentMethod).includes(method)) back("/checkout", { error: "יש לבחור אמצעי תשלום" });
  if (str(fd, "country_il") !== "on") back("/checkout", { error: "משלוחים לישראל בלבד – יש לאשר" });

  let order;
  try {
    order = await createOrder({
      customerId: me.id,
      lines: await readCart(),
      paymentMethod: method,
      shippingAddress: str(fd, "shipping_address"),
    });
  } catch (e) {
    if (e instanceof OrderError) back("/checkout", { error: e.message });
    throw e;
  }
  await clearCart();
  if (method === "credit_card") {
    redirect(
      await paymentGateway.createPaymentUrl({
        id: order.id,
        order_number: order.order_number,
        total_amount: order.total_amount.toString(),
      }),
    );
  }
  redirect(`/orders/${order.id}?placed=1`);
}

/** תשלום מדומה – עד חיבור ספק סליקה אמיתי */
export async function mockPayAction(fd: FormData) {
  const me = await requireCustomer();
  const id = str(fd, "orderId");
  const order = await db.order.findFirst({ where: { id, customer_id: me.id } });
  if (!order) redirect("/orders");
  if (order.payment_method === "credit_card" && order.payment_status === "pending") {
    await db.order.update({ where: { id }, data: { payment_status: "paid" } });
  }
  redirect(`/orders/${id}?placed=1`);
}
