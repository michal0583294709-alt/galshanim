"use server";

import { OrderStatus, PaymentStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { requireStaff } from "@/lib/auth/current";
import { changeOrderStatus, issueInvoice, OrderError } from "@/lib/orders";
import { back, optStr, str } from "@/lib/forms";

export async function changeStatusAction(fd: FormData) {
  await requireStaff("orders");
  const id = str(fd, "id");
  const to = str(fd, "status") as OrderStatus;
  try {
    await changeOrderStatus(id, to);
  } catch (e) {
    if (e instanceof OrderError) back(`/admin/orders/${id}`, { error: e.message });
    throw e;
  }
  back(`/admin/orders/${id}`, { ok: "הסטטוס עודכן" });
}

export async function updatePaymentAction(fd: FormData) {
  await requireStaff("orders");
  const id = str(fd, "id");
  const s = str(fd, "payment_status") as PaymentStatus;
  if (!Object.values(PaymentStatus).includes(s)) back(`/admin/orders/${id}`, { error: "סטטוס תשלום לא חוקי" });
  await db.order.update({ where: { id }, data: { payment_status: s } });
  back(`/admin/orders/${id}`, { ok: "סטטוס התשלום עודכן" });
}

export async function updateShippingAction(fd: FormData) {
  await requireStaff("orders");
  const id = str(fd, "id");
  await db.order.update({
    where: { id },
    data: { shipping_carrier: optStr(fd, "shipping_carrier"), tracking_number: optStr(fd, "tracking_number") },
  });
  back(`/admin/orders/${id}`, { ok: "פרטי המשלוח נשמרו" });
}

export async function issueInvoiceAction(fd: FormData) {
  await requireStaff("invoices");
  const id = str(fd, "id");
  try {
    await issueInvoice(id);
  } catch (e) {
    if (e instanceof OrderError) back(`/admin/orders/${id}`, { error: e.message });
    throw e;
  }
  back(`/admin/orders/${id}`, { ok: "החשבונית הופקה" });
}

export async function setInvoiceDocAction(fd: FormData) {
  await requireStaff("invoices");
  const id = str(fd, "id");
  await db.invoice.update({ where: { order_id: id }, data: { document_url: optStr(fd, "document_url") } });
  back(`/admin/orders/${id}`, { ok: "קישור החשבונית נשמר" });
}
