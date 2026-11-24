import Link from "next/link";
import { requireCustomer } from "@/lib/auth/current";
import { loadCart } from "@/lib/cart-view";
import { money } from "@/lib/format";
import { Empty, Notice } from "@/components/ui";
import { Totals } from "@/components/totals";
import { removeFromCartAction, updateCartAction } from "../actions";

export default async function CartPage({ searchParams }: { searchParams: Promise<{ error?: string; ok?: string }> }) {
  await requireCustomer();
  const sp = await searchParams;
  const { items, totals } = await loadCart();

  if (items.length === 0) {
    return (
      <div className="card">
        <h1 className="h1 mb-2">העגלה</h1>
        <Empty>
          העגלה ריקה. <Link href="/catalog" className="link">לקטלוג</Link>
        </Empty>
      </div>
    );
  }

  return (
    <div className="grid lg:grid-cols-[1fr_320px] gap-6 items-start">
      <div className="card overflow-x-auto">
        <h1 className="h1 mb-4">העגלה</h1>
        <Notice error={sp.error} ok={sp.ok} />
        <form id="cart" action={updateCartAction}>
          <table className="table min-w-[560px]">
            <thead>
              <tr><th></th><th>דגם</th><th>וריאציה</th><th>מחיר</th><th>כמות</th><th>סה&quot;כ</th><th></th></tr>
            </thead>
            <tbody>
              {items.map((it) => (
                <tr key={it.variant.id}>
                  <td className="w-14">{it.image && <img src={it.image} alt="" className="w-12 h-12 rounded object-cover" />}</td>
                  <td className="font-medium">{it.variant.product.name}</td>
                  <td className="text-muted text-xs">
                    <span dir="ltr">{it.variant.size}</span> · {it.variant.color}
                    {it.variant.material && ` · ${it.variant.material}`}
                    {it.overStock && <div className="text-bad">במלאי רק {it.variant.stock_quantity}</div>}
                  </td>
                  <td>{money(it.unitPrice)}</td>
                  <td>
                    <input
                      type="number"
                      name={`qty_${it.variant.id}`}
                      defaultValue={it.quantity}
                      min={0}
                      max={it.variant.stock_quantity}
                      className="input h-8 w-20"
                    />
                  </td>
                  <td className="font-medium">{money(it.lineTotal)}</td>
                  <td>
                    <button form={`rm-${it.variant.id}`} className="text-bad text-xs cursor-pointer">
                      הסרה
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button className="btn-secondary btn-sm mt-4">עדכון כמויות</button>
        </form>
        {items.map((it) => (
          <form key={it.variant.id} id={`rm-${it.variant.id}`} action={removeFromCartAction} className="hidden">
            <input type="hidden" name="variantId" value={it.variant.id} />
          </form>
        ))}
      </div>
      <aside className="card space-y-4">
        <h2 className="h2">סיכום</h2>
        <Totals {...totals} />
        <Link href="/checkout" className="btn w-full">המשך למשלוח ותשלום</Link>
      </aside>
    </div>
  );
}
