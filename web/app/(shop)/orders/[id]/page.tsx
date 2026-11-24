import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireCustomer } from "@/lib/auth/current";
import { date, money, PAYMENT_METHOD_LABEL } from "@/lib/format";
import { OrderStatusChip, PaymentStatusChip } from "@/components/ui";
import { Totals } from "@/components/totals";

export default async function MyOrderPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ placed?: string }>;
}) {
  const me = await requireCustomer();
  const { id } = await params;
  const { placed } = await searchParams;
  const o = await db.order.findFirst({
    where: { id, customer_id: me.id },
    include: { items: { include: { product_variant: { include: { product: true } } } }, invoice: true },
  });
  if (!o) notFound();

  return (
    <div className="space-y-6">
      {placed && (
        <div className="alert-ok text-base">
          ההזמנה <b>{o.order_number}</b> התקבלה בהצלחה. תודה!
          {o.payment_method === "bank_transfer" && " נא לבצע העברה בנקאית ולציין את מספר ההזמנה."}
        </div>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="h1">הזמנה {o.order_number}</h1>
        <OrderStatusChip status={o.status} />
        <PaymentStatusChip status={o.payment_status} />
        <Link href="/orders" className="link text-sm ms-auto">כל ההזמנות</Link>
      </div>
      <div className="grid lg:grid-cols-[1fr_320px] gap-6 items-start">
        <div className="card overflow-x-auto">
          <table className="table min-w-[480px]">
            <thead><tr><th>דגם</th><th>וריאציה</th><th>כמות</th><th>מחיר</th><th>סה&quot;כ</th></tr></thead>
            <tbody>
              {o.items.map((it) => (
                <tr key={it.id}>
                  <td>{it.product_variant.product.name}</td>
                  <td className="text-xs text-muted">
                    <span dir="ltr">{it.product_variant.size}</span> · {it.product_variant.color}
                    {it.product_variant.material && ` · ${it.product_variant.material}`}
                  </td>
                  <td>{it.quantity}</td>
                  <td>{money(it.unit_price)}</td>
                  <td>{money(it.unit_price.times(it.quantity))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <aside className="card space-y-4 text-sm">
          <Totals subtotal={o.subtotal_amount} shippingFee={o.shipping_fee} total={o.total_amount} />
          <dl className="space-y-1 border-t border-line pt-3">
            <div><dt className="text-muted inline">תאריך: </dt><dd className="inline">{date(o.created_at)}</dd></div>
            <div><dt className="text-muted inline">תשלום: </dt><dd className="inline">{PAYMENT_METHOD_LABEL[o.payment_method]}</dd></div>
            {o.payment_due_date && <div><dt className="text-muted inline">לתשלום עד: </dt><dd className="inline">{date(o.payment_due_date)}</dd></div>}
            <div><dt className="text-muted inline">כתובת: </dt><dd className="inline whitespace-pre-line">{o.shipping_address}</dd></div>
            {o.tracking_number && (
              <div><dt className="text-muted inline">משלוח: </dt><dd className="inline">{o.shipping_carrier} <span dir="ltr">{o.tracking_number}</span></dd></div>
            )}
            {o.invoice && <div><dt className="text-muted inline">חשבונית: </dt><dd className="inline">מס&apos; {o.invoice.invoice_number}</dd></div>}
          </dl>
          {o.payment_method === "credit_card" && o.payment_status === "pending" && o.status !== "cancelled" && (
            <Link href={`/pay/${o.id}`} className="btn w-full">להשלמת התשלום</Link>
          )}
        </aside>
      </div>
    </div>
  );
}
