import { describe, expect, it } from "vitest";
import { calcShippingFee, calcTotals } from "@/lib/pricing";
import { Prisma } from "@prisma/client";

const D = (n: number) => new Prisma.Decimal(n);

describe("דמי משלוח (PRD §5.2)", () => {
  it("300 ₪ להזמנה רגילה", () => {
    expect(calcShippingFee(D(2500)).toNumber()).toBe(300);
  });
  it("בדיוק 10,000 ₪ – עדיין משלמים משלוח", () => {
    expect(calcShippingFee(D(10000)).toNumber()).toBe(300);
  });
  it("מעל 10,000 ₪ – משלוח חינם", () => {
    expect(calcShippingFee(D(10000.01)).toNumber()).toBe(0);
  });
  it("עגלה ריקה – ללא משלוח", () => {
    expect(calcShippingFee(D(0)).toNumber()).toBe(0);
  });
});

describe("חישוב סכומים", () => {
  it("מחשב subtotal ו-total בדיוק עשרוני", () => {
    const t = calcTotals([
      { unitPrice: "1890.10", quantity: 3 },
      { unitPrice: "0.20", quantity: 1 },
    ]);
    expect(t.subtotal.toString()).toBe("5670.5");
    expect(t.total.toString()).toBe("5970.5");
  });
  it("משלוח חינם מעל הסף", () => {
    const t = calcTotals([{ unitPrice: 2100, quantity: 5 }]);
    expect(t.shippingFee.toNumber()).toBe(0);
    expect(t.total.toNumber()).toBe(10500);
  });
});
