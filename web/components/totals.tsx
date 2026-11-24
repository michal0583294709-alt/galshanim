import type { Prisma } from "@prisma/client";
import { money } from "@/lib/format";

export function Totals({
  subtotal,
  shippingFee,
  total,
  missingForFreeShipping,
}: {
  subtotal: Prisma.Decimal;
  shippingFee: Prisma.Decimal;
  total: Prisma.Decimal;
  missingForFreeShipping?: Prisma.Decimal;
}) {
  return (
    <dl className="space-y-2 text-sm">
      <div className="flex justify-between"><dt>סכום ביניים (כולל מע&quot;מ)</dt><dd>{money(subtotal)}</dd></div>
      <div className="flex justify-between">
        <dt>דמי משלוח</dt>
        <dd>{shippingFee.isZero() ? <span className="text-ok font-medium">חינם</span> : money(shippingFee)}</dd>
      </div>
      {missingForFreeShipping && missingForFreeShipping.greaterThan(0) && subtotal.greaterThan(0) && (
        <div className="text-xs text-muted bg-surface rounded-md px-2 py-1.5">
          עוד {money(missingForFreeShipping)} למשלוח חינם (מעל 10,000 ₪)
        </div>
      )}
      <div className="flex justify-between border-t border-line pt-2 text-base font-extrabold">
        <dt>סה&quot;כ לתשלום</dt><dd>{money(total)}</dd>
      </div>
    </dl>
  );
}
