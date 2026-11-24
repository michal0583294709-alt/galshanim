import Link from "next/link";
import { redirect } from "next/navigation";
import { requireCustomer } from "@/lib/auth/current";
import { loadCart } from "@/lib/cart-view";
import { Notice } from "@/components/ui";
import { Totals } from "@/components/totals";
import { placeOrderAction } from "../actions";

export default async function CheckoutPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const me = await requireCustomer();
  const { error } = await searchParams;
  const { items, totals } = await loadCart();
  if (items.length === 0 && !error) redirect("/cart");

  return (
    <form action={placeOrderAction} className="grid lg:grid-cols-[1fr_320px] gap-6 items-start">
      <div className="space-y-6">
        <h1 className="h1">משלוח ותשלום</h1>
        <Notice error={error} />
        <section className="card space-y-3">
          <h2 className="h2">כתובת משלוח</h2>
          <textarea name="shipping_address" className="input" rows={3} required defaultValue={me.address ?? ""} />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="country_il" defaultChecked required /> הכתובת בישראל (משלוחים לישראל בלבד)
          </label>
        </section>
        <section className="card space-y-3">
          <h2 className="h2">אמצעי תשלום</h2>
          <Radio value="credit_card" title="כרטיס אשראי" desc="תשלום מאובטח דרך ספק סליקה. פרטי הכרטיס לא נשמרים אצלנו." defaultChecked />
          <Radio value="bank_transfer" title="העברה בנקאית" desc="פרטי החשבון יופיעו באישור ההזמנה. ההזמנה תטופל לאחר קבלת התשלום." />
          {me.is_net_terms_approved ? (
            <Radio value="net_terms" title={`תנאי תשלום – שוטף+${me.net_terms_days ?? 30}`} desc="אושר לחשבון שלכם על ידי העסק." />
          ) : (
            <p className="text-xs text-muted">תנאי תשלום (שוטף) זמינים ללקוחות שאושרו על ידי העסק.</p>
          )}
        </section>
      </div>
      <aside className="card space-y-4 lg:mt-12">
        <h2 className="h2">סיכום ({items.length} שורות)</h2>
        <Totals {...totals} />
        <button className="btn w-full" disabled={items.length === 0}>ביצוע הזמנה</button>
        <Link href="/cart" className="link text-sm block text-center">חזרה לעגלה</Link>
      </aside>
    </form>
  );
}

function Radio({ value, title, desc, defaultChecked }: { value: string; title: string; desc: string; defaultChecked?: boolean }) {
  return (
    <label className="flex gap-3 items-start border border-line rounded-lg p-3 cursor-pointer has-[:checked]:border-brand has-[:checked]:bg-brand/5">
      <input type="radio" name="payment_method" value={value} defaultChecked={defaultChecked} className="mt-1" />
      <span>
        <span className="font-bold block">{title}</span>
        <span className="text-xs text-muted">{desc}</span>
      </span>
    </label>
  );
}
