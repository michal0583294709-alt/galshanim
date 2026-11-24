import { Prisma } from "@prisma/client";

/** PRD §5.2 – דמי משלוח קבועים לכל הזמנה */
export const SHIPPING_FEE = new Prisma.Decimal(300);
/** PRD §5.2 – משלוח חינם כשסכום ההזמנה (כולל מע"מ) מעל סכום זה */
export const FREE_SHIPPING_THRESHOLD = new Prisma.Decimal(10000);

export type PricedLine = { unitPrice: Prisma.Decimal | number | string; quantity: number };

export function calcSubtotal(lines: PricedLine[]): Prisma.Decimal {
  return lines.reduce(
    (sum, l) => sum.plus(new Prisma.Decimal(l.unitPrice).times(l.quantity)),
    new Prisma.Decimal(0),
  );
}

export function calcShippingFee(subtotal: Prisma.Decimal): Prisma.Decimal {
  if (subtotal.lessThanOrEqualTo(0)) return new Prisma.Decimal(0);
  return subtotal.greaterThan(FREE_SHIPPING_THRESHOLD) ? new Prisma.Decimal(0) : SHIPPING_FEE;
}

export function calcTotals(lines: PricedLine[]) {
  const subtotal = calcSubtotal(lines);
  const shippingFee = calcShippingFee(subtotal);
  const total = subtotal.plus(shippingFee);
  const missingForFreeShipping = subtotal.greaterThan(FREE_SHIPPING_THRESHOLD)
    ? new Prisma.Decimal(0)
    : FREE_SHIPPING_THRESHOLD.minus(subtotal).plus(0.01);
  return { subtotal, shippingFee, total, missingForFreeShipping };
}
export const LOW_STOCK = 3;
