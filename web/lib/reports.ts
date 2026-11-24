import "server-only";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { LOW_STOCK } from "@/lib/pricing";

/** דוחות (PRD §6.6) – מחושבים מ-Order, OrderItem, ProductVariant. הזמנות מבוטלות לא נספרות. */
export async function salesReport(from: Date, toExclusive: Date) {
  const where: Prisma.OrderWhereInput = { status: { not: "cancelled" }, created_at: { gte: from, lt: toExclusive } };
  const [agg, items, orders] = await Promise.all([
    db.order.aggregate({ where, _sum: { total_amount: true, subtotal_amount: true }, _count: true }),
    db.orderItem.findMany({
      where: { order: where },
      include: { product_variant: { include: { product: true } } },
    }),
    db.order.findMany({ where, include: { customer: true } }),
  ]);

  const byProduct = new Map<string, { name: string; qty: number; revenue: Prisma.Decimal }>();
  for (const it of items) {
    const p = it.product_variant.product;
    const row = byProduct.get(p.id) ?? { name: p.name, qty: 0, revenue: new Prisma.Decimal(0) };
    row.qty += it.quantity;
    row.revenue = row.revenue.plus(it.unit_price.times(it.quantity));
    byProduct.set(p.id, row);
  }

  const byCustomer = new Map<string, { name: string; orders: number; revenue: Prisma.Decimal }>();
  const byMonth = new Map<string, { orders: number; revenue: Prisma.Decimal }>();
  for (const o of orders) {
    const c = byCustomer.get(o.customer_id) ?? { name: o.customer.business_name, orders: 0, revenue: new Prisma.Decimal(0) };
    c.orders += 1;
    c.revenue = c.revenue.plus(o.total_amount);
    byCustomer.set(o.customer_id, c);
    const key = `${o.created_at.getFullYear()}-${String(o.created_at.getMonth() + 1).padStart(2, "0")}`;
    const m = byMonth.get(key) ?? { orders: 0, revenue: new Prisma.Decimal(0) };
    m.orders += 1;
    m.revenue = m.revenue.plus(o.total_amount);
    byMonth.set(key, m);
  }

  const desc = <T extends { revenue: Prisma.Decimal }>(a: T, b: T) => b.revenue.comparedTo(a.revenue);
  return {
    revenue: agg._sum.total_amount ?? new Prisma.Decimal(0),
    orderCount: agg._count,
    byProduct: [...byProduct.values()].sort(desc),
    byCustomer: [...byCustomer.values()].sort(desc),
    byMonth: [...byMonth.entries()].sort(([a], [b]) => a.localeCompare(b)),
  };
}

export async function inventoryReport() {
  const variants = await db.productVariant.findMany({
    include: { product: true },
    orderBy: [{ stock_quantity: "asc" }],
  });
  return {
    totalUnits: variants.reduce((s, v) => s + v.stock_quantity, 0),
    low: variants.filter((v) => v.stock_quantity <= LOW_STOCK),
    variantCount: variants.length,
  };
}
