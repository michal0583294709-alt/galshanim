"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { requireStaff } from "@/lib/auth/current";
import { back, int, isFkViolation, optStr, str } from "@/lib/forms";
import { saveImage } from "@/lib/uploads";

function priceFrom(fd: FormData) {
  const s = str(fd, "price");
  if (!/^\d+(\.\d{1,2})?$/.test(s)) return null;
  return new Prisma.Decimal(s);
}

export async function createProductAction(fd: FormData) {
  await requireStaff("products");
  const name = str(fd, "name");
  const price = priceFrom(fd);
  if (!name || !price) back("/admin/products/new", { error: "יש למלא שם ומחיר תקין" });
  const p = await db.product.create({
    data: { name, price, description: optStr(fd, "description"), is_active: fd.get("is_active") === "on" },
  });
  redirect(`/admin/products/${p.id}?ok=${encodeURIComponent("הדגם נוצר – הוסיפו וריאציות ותמונות")}`);
}

export async function updateProductAction(fd: FormData) {
  await requireStaff("products");
  const id = str(fd, "id");
  const name = str(fd, "name");
  const price = priceFrom(fd);
  if (!name || !price) back(`/admin/products/${id}`, { error: "יש למלא שם ומחיר תקין" });
  await db.product.update({
    where: { id },
    data: { name, price, description: optStr(fd, "description"), is_active: fd.get("is_active") === "on" },
  });
  revalidatePath("/catalog");
  back(`/admin/products/${id}`, { ok: "הדגם נשמר" });
}

export async function deleteProductAction(fd: FormData) {
  await requireStaff("products");
  const id = str(fd, "id");
  const ordered = await db.orderItem.count({ where: { product_variant: { product_id: id } } });
  if (ordered > 0) {
    back(`/admin/products/${id}`, {
      error: "לדגם יש הזמנות קיימות ולכן אי אפשר למחוק אותו. אפשר להסתיר אותו מהאתר (לבטל 'מוצג באתר').",
    });
  }
  await db.$transaction([
    db.productVariant.deleteMany({ where: { product_id: id } }),
    db.product.delete({ where: { id } }),
  ]);
  back("/admin/products", { ok: "הדגם נמחק" });
}

export async function addVariantAction(fd: FormData) {
  await requireStaff("products");
  const product_id = str(fd, "product_id");
  const size = str(fd, "size");
  const color = str(fd, "color");
  const stock = int(fd, "stock_quantity") ?? 0;
  if (!size || !color || stock < 0) back(`/admin/products/${product_id}`, { error: "יש למלא מידה, צבע ומלאי תקין" });
  await db.productVariant.create({
    data: { product_id, size, color, material: optStr(fd, "material"), stock_quantity: stock },
  });
  back(`/admin/products/${product_id}`, { ok: "הווריאציה נוספה" });
}

/** עדכון מלאי ופרטים לכל הווריאציות בבת אחת */
export async function saveVariantsAction(fd: FormData) {
  await requireStaff("products");
  const product_id = str(fd, "product_id");
  const variants = await db.productVariant.findMany({ where: { product_id } });
  const updates = [];
  for (const v of variants) {
    const stock = int(fd, `stock_${v.id}`);
    const size = str(fd, `size_${v.id}`);
    const color = str(fd, `color_${v.id}`);
    if (stock === null || stock < 0 || !size || !color) {
      back(`/admin/products/${product_id}`, { error: "ערכים לא תקינים בטבלת הווריאציות" });
    }
    updates.push(
      db.productVariant.update({
        where: { id: v.id },
        data: { stock_quantity: stock, size, color, material: optStr(fd, `material_${v.id}`) },
      }),
    );
  }
  await db.$transaction(updates);
  back(`/admin/products/${product_id}`, { ok: "המלאי והווריאציות נשמרו" });
}

export async function deleteVariantAction(fd: FormData) {
  await requireStaff("products");
  const id = str(fd, "variant_id");
  const product_id = str(fd, "product_id");
  if ((await db.productVariant.count({ where: { product_id } })) <= 1) {
    back(`/admin/products/${product_id}`, { error: "לכל דגם חייבת להיות לפחות וריאציה אחת" });
  }
  try {
    await db.productVariant.delete({ where: { id } });
  } catch (e) {
    if (isFkViolation(e)) back(`/admin/products/${product_id}`, { error: "לווריאציה יש הזמנות – אי אפשר למחוק. אפשר לאפס מלאי." });
    throw e;
  }
  back(`/admin/products/${product_id}`, { ok: "הווריאציה נמחקה" });
}

export async function addImageAction(fd: FormData) {
  await requireStaff("products");
  const product_id = str(fd, "product_id");
  const color = str(fd, "color");
  const file = fd.get("file");
  let url = str(fd, "image_url");
  if (file instanceof File && file.size > 0) {
    try {
      url = await saveImage(file);
    } catch (e) {
      back(`/admin/products/${product_id}`, { error: (e as Error).message });
    }
  }
  if (!color || !url) back(`/admin/products/${product_id}`, { error: "יש לבחור צבע ולהעלות קובץ או להזין כתובת" });
  const colorExists = await db.productVariant.count({ where: { product_id, color } });
  if (!colorExists) back(`/admin/products/${product_id}`, { error: "הצבע חייב להתאים לאחת הווריאציות" });
  const max = await db.productImage.aggregate({ where: { product_id, color }, _max: { sort_order: true } });
  await db.productImage.create({
    data: { product_id, color, image_url: url, sort_order: (max._max.sort_order ?? 0) + 1 },
  });
  back(`/admin/products/${product_id}`, { ok: "התמונה נוספה" });
}

export async function deleteImageAction(fd: FormData) {
  await requireStaff("products");
  const product_id = str(fd, "product_id");
  await db.productImage.delete({ where: { id: str(fd, "image_id") } });
  back(`/admin/products/${product_id}`, { ok: "התמונה נמחקה" });
}

export async function moveImageAction(fd: FormData) {
  await requireStaff("products");
  const product_id = str(fd, "product_id");
  const img = await db.productImage.findUniqueOrThrow({ where: { id: str(fd, "image_id") } });
  const dir = str(fd, "dir") === "up" ? -1 : 1;
  const siblings = await db.productImage.findMany({
    where: { product_id, color: img.color },
    orderBy: { sort_order: "asc" },
  });
  const i = siblings.findIndex((s) => s.id === img.id);
  const j = i + dir;
  if (j >= 0 && j < siblings.length) {
    const reordered = [...siblings];
    [reordered[i], reordered[j]] = [reordered[j], reordered[i]];
    await db.$transaction(
      reordered.map((s, idx) => db.productImage.update({ where: { id: s.id }, data: { sort_order: idx + 1 } })),
    );
  }
  redirect(`/admin/products/${product_id}`);
}
