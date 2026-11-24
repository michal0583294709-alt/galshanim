import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireStaff } from "@/lib/auth/current";
import { can } from "@/lib/auth/permissions";
import { NEXT_STATUSES } from "@/lib/orders";
import { date, money, ORDER_STATUS_LABEL, PAYMENT_METHOD_LABEL, PAYMENT_STATUS_LABEL } from "@/lib/format";
import { Field, Notice, OrderStatusChip, PaymentStatusChip } from "@/components/ui";
import { Totals } from "@/components/totals";
import {
  changeStatusAction, issueInvoiceAction, setInvoiceDocAction, updatePaymentAction, updateShippingAction,
} from "../actions";

export default async function AdminOrderPage({
  params, searchParams,
}: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string; ok?: string }> }) {
  const me = await requireStaff("orders");
  const { id } = await params;
  const sp = await searchParams;
  const o = await db.order.findUnique({
    where: { id },
    include: { customer: true, invoice: true, items: { include: { product_variant: { include: { product: true } } } } },
  });
  if (!o) notFound();
  const carriers = await db.provider.findMany({ where: { type: "shipping", is_active: true }, orderBy: { name: "asc" } });
  const next = NEXT_STATUSES[o.status];

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-wrap items-center gap-3">
        <Link href="/admin/orders" className="link text-sm">→ הזמנות</Link>
        <h1 className="h1">הזמנה {o.order_number}</h1>
        <OrderStatusChip status={o.status} />
        <PaymentStatusChip status={o.payment_status} />
      </div>
      <Notice error={sp.error} ok={sp.ok} />

      <div className="grid lg:grid-cols-[1fr_320px] gap-6 items-start">
        <div className="space-y-6">
          <section className="card overflow-x-auto">
            <h2 className="h2 mb-3">שורות ההזמנה</h2>
            <table className="table min-w-[480px]">
              <thead><tr><th>דגם</th><th>מידה</th><th>צבע</th><th>חומר</th><th>כמות</th><th>מחיר</th><th>סה&quot;כ</th></tr></thead>
              <tbody>
                {o.items.map((it) => (
                  <tr key={it.id}>
                    <td>{it.product_variant.product.name}</td>
                    <td dir="ltr" className="text-end">{it.product_variant.size}</td>
                    <td>{it.product_variant.color}</td>
                    <td>{it.product_variant.material ?? "—"}</td>
                    <td className="font-bold">{it.quantity}</td>
                    <td>{money(it.unit_price)}</td>
                    <td>{money(it.unit_price.times(it.quantity))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section className="card">
            <h2 className="h2 mb-3">סטטוס הזמנה</h2>
            {next.length === 0 ? <p className="text-sm text-muted">ההזמנה בסטטוס סופי.</p> : (
              <div className="flex flex-wrap gap-2">
                {next.map((s) => (
                  <form key={s} action={changeStatusAction}>
                    <input type="hidden" name="id" value={o.id} />
                    <input type="hidden" name="status" value={s} />
                    <button className={s === "cancelled" ? "btn-danger" : "btn"}>
                      {s === "cancelled" ? "ביטול הזמנה (המלאי יוחזר)" : `העברה ל"${ORDER_STATUS_LABEL[s]}"`}
                    </button>
                  </form>
                ))}
              </div>
            )}
          </section>

          <section className="card">
            <h2 className="h2 mb-3">משלוח</h2>
            <form action={updateShippingAction} className="grid sm:grid-cols-3 gap-3 items-end">
              <input type="hidden" name="id" value={o.id} />
              <label className="block"><span className="label">חברת שילוח</span>
                <input name="shipping_carrier" list="carriers" className="input" defaultValue={o.shipping_carrier ?? ""} />
                <datalist id="carriers">{carriers.map((c) => <option key={c.id} value={c.name} />)}</datalist>
              </label>
              <Field label="מספר משלוח" name="tracking_number" dir="ltr" defaultValue={o.tracking_number} />
              <button className="btn-secondary">שמירה</button>
            </form>
            {o.shipped_at && <p className="text-xs text-muted mt-2">נשלחה ב-{date(o.shipped_at)}</p>}
          </section>

          <section className="card">
            <h2 className="h2 mb-3">חשבונית</h2>
            {o.invoice ? (
              <div className="space-y-3 text-sm">
                <div>חשבונית מס&apos; <b>{o.invoice.invoice_number}</b> · {money(o.invoice.amount)} · הופקה {date(o.invoice.issued_at)}</div>
                {o.invoice.document_url && <a href={o.invoice.document_url} target="_blank" className="link">פתיחת קובץ החשבונית</a>}
                {can(me, "invoices") && (
                  <form action={setInvoiceDocAction} className="flex gap-2 items-end">
                    <input type="hidden" name="id" value={o.id} />
                    <div className="flex-1"><Field label="קישור לקובץ החשבונית (מתוכנת החשבוניות)" name="document_url" dir="ltr" defaultValue={o.invoice.document_url} /></div>
                    <button className="btn-secondary">שמירה</button>
                  </form>
                )}
              </div>
            ) : can(me, "invoices") ? (
              <form action={issueInvoiceAction}>
                <input type="hidden" name="id" value={o.id} />
                <button className="btn" disabled={o.status === "cancelled"}>הפקת חשבונית</button>
              </form>
            ) : <p className="text-sm text-muted">טרם הופקה חשבונית.</p>}
          </section>
        </div>

        <aside className="space-y-6">
          <section className="card space-y-3 text-sm">
            <h2 className="h2">לקוח</h2>
            <div className="font-bold">{o.customer.business_name}</div>
            <div>{o.customer.contact_name} · <span dir="ltr">{o.customer.phone ?? o.customer.email}</span></div>
            <div className="text-muted whitespace-pre-line">{o.shipping_address}</div>
            {can(me, "customers") && <Link href={`/admin/customers/${o.customer.id}`} className="link">לכרטיס הלקוח</Link>}
          </section>
          <section className="card space-y-3 text-sm">
            <h2 className="h2">תשלום</h2>
            <div>{PAYMENT_METHOD_LABEL[o.payment_method]}</div>
            {o.payment_due_date && <div>לתשלום עד {date(o.payment_due_date)}</div>}
            <form action={updatePaymentAction} className="flex gap-2">
              <input type="hidden" name="id" value={o.id} />
              <select name="payment_status" className="input h-9" defaultValue={o.payment_status}>
                {Object.entries(PAYMENT_STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
              <button className="btn-secondary btn-sm h-9">עדכון</button>
            </form>
            <Totals subtotal={o.subtotal_amount} shippingFee={o.shipping_fee} total={o.total_amount} />
            <div className="text-xs text-muted">התקבלה {date(o.created_at)}</div>
          </section>
        </aside>
      </div>
    </div>
  );
}
