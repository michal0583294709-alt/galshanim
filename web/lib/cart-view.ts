import "server-only";
import { db } from "@/lib/db";
import { readCart } from "@/lib/cart";
import { calcTotals } from "@/lib/pricing";

export async function loadCart() {
  const lines = await readCart();
  const variants = await db.productVariant.findMany({
    where: { id: { in: lines.map((l) => l.variantId) } },
    include: { product: { include: { images: { orderBy: { sort_order: "asc" } } } } },
  });
  const items = lines
    .map((l) => {
      const v = variants.find((x) => x.id === l.variantId);
      if (!v || !v.product.is_active) return null;
      const img = v.product.images.find((i) => i.color === v.color) ?? v.product.images[0];
      return {
        variant: v,
        quantity: l.quantity,
        unitPrice: v.product.price,
        lineTotal: v.product.price.times(l.quantity),
        image: img?.image_url,
        overStock: l.quantity > v.stock_quantity,
      };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);
  return { items, totals: calcTotals(items) };
}
