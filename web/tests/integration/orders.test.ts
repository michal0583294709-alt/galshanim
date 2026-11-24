import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { changeOrderStatus, createOrder, OrderError } from "@/lib/orders";

// דורש מסד נתונים (DATABASE_URL). מריצים: npm run test:integration
let customerId = "";
let netTermsCustomerId = "";
let variantId = "";
let productId = "";

beforeAll(async () => {
  const stamp = Date.now();
  const c = await db.customer.create({
    data: { business_name: "בדיקה", business_tax_id: "500000000", contact_name: "בדיקה", email: `t${stamp}@test.local`, password_hash: "x" },
  });
  const c2 = await db.customer.create({
    data: { business_name: "בדיקה שוטף", business_tax_id: "500000001", contact_name: "בדיקה", email: `t2${stamp}@test.local`, password_hash: "x", is_net_terms_approved: true, net_terms_days: 60 },
  });
  const p = await db.product.create({
    data: { name: `בדיקה ${stamp}`, price: 6000, variants: { create: [{ size: "6'0", color: "כחול", stock_quantity: 1 }] } },
    include: { variants: true },
  });
  customerId = c.id; netTermsCustomerId = c2.id; productId = p.id; variantId = p.variants[0].id;
});

afterAll(async () => {
  const ids = [customerId, netTermsCustomerId];
  await db.order.deleteMany({ where: { customer_id: { in: ids } } });
  await db.customer.deleteMany({ where: { id: { in: ids } } });
  await db.productVariant.deleteMany({ where: { product_id: productId } });
  await db.product.delete({ where: { id: productId } });
  await db.$disconnect();
});

describe("יצירת הזמנה", () => {
  it("שתי הזמנות מקבילות על הפריט האחרון – רק אחת מצליחה", async () => {
    const order = () => createOrder({ customerId, lines: [{ variantId, quantity: 1 }], paymentMethod: "bank_transfer", shippingAddress: "תל אביב" });
    const results = await Promise.allSettled([order(), order()]);
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    const rejected = results.find((r) => r.status === "rejected") as PromiseRejectedResult;
    expect(rejected.reason).toBeInstanceOf(OrderError);
    const v = await db.productVariant.findUniqueOrThrow({ where: { id: variantId } });
    expect(v.stock_quantity).toBe(0);
  });

  it("ביטול מחזיר מלאי, ומשלוח 300 ₪ מתחת לסף", async () => {
    const o = await db.order.findFirstOrThrow({ where: { customer_id: customerId } });
    expect(o.shipping_fee.toNumber()).toBe(300);
    expect(o.total_amount.toNumber()).toBe(6300);
    await changeOrderStatus(o.id, "cancelled");
    const v = await db.productVariant.findUniqueOrThrow({ where: { id: variantId } });
    expect(v.stock_quantity).toBe(1);
  });

  it("שוטף אסור ללקוח שלא אושר", async () => {
    await expect(
      createOrder({ customerId, lines: [{ variantId, quantity: 1 }], paymentMethod: "net_terms", shippingAddress: "x" }),
    ).rejects.toThrow("תנאי תשלום");
  });

  it("שוטף ללקוח מאושר – on_terms עם תאריך יעד", async () => {
    const o = await createOrder({ customerId: netTermsCustomerId, lines: [{ variantId, quantity: 1 }], paymentMethod: "net_terms", shippingAddress: "x" });
    expect(o.payment_status).toBe("on_terms");
    expect(o.payment_due_date).not.toBeNull();
  });
});
