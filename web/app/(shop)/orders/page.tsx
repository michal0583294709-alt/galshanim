import Link from "next/link";
import { db } from "@/lib/db";
import { requireCustomer } from "@/lib/auth/current";
import { date, money, PAYMENT_METHOD_LABEL } from "@/lib/format";
import { Empty, OrderStatusChip, PaymentStatusChip } from "@/components/ui";

export default async function MyOrdersPage() {
  const me = await requireCustomer();
  const orders = await db.order.findMany({ where: { customer_id: me.id }, orderBy: { created_at: "desc" } });
  return (
    <div className="card overflow-x-auto">
      <h1 className="h1 mb-4">ההזמנות שלי</h1>
      {orders.length === 0 ? (
        <Empty>עדיין אין הזמנות. <Link href="/catalog" className="link">לקטלוג</Link></Empty>
      ) : (
        <table className="table min-w-[640px]">
          <thead>
            <tr><th>מס&apos; הזמנה</th><th>תאריך</th><th>סכום</th><th>תשלום</th><th>סטטוס תשלום</th><th>סטטוס</th></tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id}>
                <td><Link href={`/orders/${o.id}`} className="link font-medium">{o.order_number}</Link></td>
                <td>{date(o.created_at)}</td>
                <td>{money(o.total_amount)}</td>
                <td>{PAYMENT_METHOD_LABEL[o.payment_method]}</td>
                <td><PaymentStatusChip status={o.payment_status} /></td>
                <td><OrderStatusChip status={o.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
