import { Prisma, type OrderStatus, type PaymentMethod } from "@prisma/client";
import { db } from "@/lib/db";
import { calcTotals } from "@/lib/pricing";

export class OrderError extends Error {}

export type CartLine = { variantId: string; quantity: number };

/**
 * יצירת הזמנה בטרנזקציה אחת (PRD §5.2, §6.1):
 * נעילת שורות המלאי, בדיקה שלא חורגים, הורדת מלאי, שמירת מחיר בזמן ההזמנה.
 */
export async function createOrder(input: {
  customerId: string;
  lines: CartLine[];
  paymentMethod: PaymentMethod;
  shippingAddress: string;
}) {
  const lines = mergeLines(input.lines);
  if (lines.length === 0) throw new OrderError("העגלה ריקה");
  if (!input.shippingAddress.trim()) throw new OrderError("חסרה כתובת משלוח");

  return db.$transaction(async (tx) => {
    const customer = await tx.customer.findUniqueOrThrow({ where: { id: input.customerId } });
    if (!customer.is_active) throw new OrderError("החשבון אינו פעיל");
    if (input.paymentMethod === "net_terms" && !customer.is_net_terms_approved) {
      throw new OrderError("תנאי תשלום מותרים רק ללקוח מאושר");
    }

    const ids = lines.map((l) => l.variantId);
    // נעילת השורות עד סוף הטרנזקציה – מונע מכירת יתר בהזמנות מקבילות
    await tx.$queryRaw`SELECT id FROM "ProductVariant" WHERE id IN (${Prisma.join(ids)}) FOR UPDATE`;
    const variants = await tx.productVariant.findMany({
      where: { id: { in: ids } },
      include: { product: true },
    });
    const byId = new Map(variants.map((v) => [v.id, v]));

    const priced = lines.map((l) => {
      const v = byId.get(l.variantId);
      if (!v || !v.product.is_active) throw new OrderError("אחד המוצרים בעגלה אינו זמין יותר");
      if (l.quantity > v.stock_quantity) {
        throw new OrderError(
          `במלאי יש רק ${v.stock_quantity} יח' של ${v.product.name} (${v.size}, ${v.color})`,
        );
      }
      return { variant: v, quantity: l.quantity, unitPrice: v.product.price };
    });

    const { subtotal, shippingFee, total } = calcTotals(priced);

    for (const p of priced) {
      await tx.productVariant.update({
        where: { id: p.variant.id },
        data: { stock_quantity: { decrement: p.quantity } },
      });
    }

    const [{ nextval }] = await tx.$queryRaw<{ nextval: bigint }[]>`SELECT nextval('order_number_seq')`;
    const isTerms = input.paymentMethod === "net_terms";
    const due = isTerms ? new Date(Date.now() + (customer.net_terms_days ?? 30) * 86_400_000) : null;

    return tx.order.create({
      data: {
        customer_id: customer.id,
        order_number: `G-${nextval}`,
        payment_method: input.paymentMethod,
        payment_status: isTerms ? "on_terms" : "pending",
        payment_due_date: due,
        subtotal_amount: subtotal,
        shipping_fee: shippingFee,
        total_amount: total,
        shipping_address: input.shippingAddress.trim(),
        items: {
          create: priced.map((p) => ({
            product_variant_id: p.variant.id,
            quantity: p.quantity,
            unit_price: p.unitPrice,
          })),
        },
      },
    });
  });
}

/** מעברי סטטוס מותרים (PRD §6.2) */
export const NEXT_STATUSES: Record<OrderStatus, OrderStatus[]> = {
  new: ["processing", "cancelled"],
  processing: ["shipped", "cancelled"],
  shipped: ["delivered"],
  delivered: [],
  cancelled: [],
};

export async function changeOrderStatus(orderId: string, to: OrderStatus) {
  return db.$transaction(async (tx) => {
    const order = await tx.order.findUniqueOrThrow({ where: { id: orderId }, include: { items: true } });
    if (!NEXT_STATUSES[order.status].includes(to)) {
      throw new OrderError("מעבר סטטוס לא חוקי");
    }
    if (to === "cancelled") {
      // ביטול מחזיר את הכמויות למלאי
      for (const it of order.items) {
        await tx.productVariant.update({
          where: { id: it.product_variant_id },
          data: { stock_quantity: { increment: it.quantity } },
        });
      }
    }
    return tx.order.update({
      where: { id: orderId },
      data: { status: to, shipped_at: to === "shipped" ? new Date() : undefined },
    });
  });
}

export async function issueInvoice(orderId: string) {
  return db.$transaction(async (tx) => {
    const order = await tx.order.findUniqueOrThrow({ where: { id: orderId }, include: { invoice: true } });
    if (order.invoice) throw new OrderError("כבר הופקה חשבונית להזמנה זו");
    if (order.status === "cancelled") throw new OrderError("לא מפיקים חשבונית להזמנה מבוטלת");
    const [{ nextval }] = await tx.$queryRaw<{ nextval: bigint }[]>`SELECT nextval('invoice_number_seq')`;
    return tx.invoice.create({
      data: { order_id: order.id, invoice_number: String(nextval), amount: order.total_amount },
    });
  });
}

function mergeLines(lines: CartLine[]): CartLine[] {
  const m = new Map<string, number>();
  for (const l of lines) {
    const q = Math.floor(l.quantity);
    if (q > 0) m.set(l.variantId, (m.get(l.variantId) ?? 0) + q);
  }
  return [...m].map(([variantId, quantity]) => ({ variantId, quantity }));
}
