import Link from "next/link";
import type { OrderStatus, Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { requireStaff } from "@/lib/auth/current";
import { date, money, ORDER_STATUS_LABEL, PAYMENT_METHOD_LABEL } from "@/lib/format";
import { Empty, OrderStatusChip, PaymentStatusChip } from "@/components/ui";

type SP = { status?: string; customer?: string; from?: string; to?: string };

export default async function AdminOrdersPage({ searchParams }: { searchParams: Promise<SP> }) {
  await requireStaff("orders");
  const sp = await searchParams;
  const where: Prisma.OrderWhereInput = {
    ...(sp.status && { status: sp.status as OrderStatus }),
    ...(sp.customer && { customer_id: sp.customer }),
    ...((sp.from || sp.to) && {
      created_at: {
        ...(sp.from && { gte: new Date(sp.from) }),
        ...(sp.to && { lt: new Date(new Date(sp.to).getTime() + 86_400_000) }),
      },
    }),
  };
  const [orders, customers, counts] = await Promise.all([
    db.order.findMany({ where, include: { customer: true }, orderBy: { created_at: "desc" }, take: 200 }),
    db.customer.findMany({ select: { id: true, business_name: true }, orderBy: { business_name: "asc" } }),
    db.order.groupBy({ by: ["status"], _count: true }),
  ]);
  const countOf = (s: string) => counts.find((c) => c.status === s)?._count ?? 0;

  return (
    <div className="space-y-4">
      <h1 className="h1">הזמנות</h1>
      <div className="flex flex-wrap gap-2 text-sm">
        <Link href="/admin/orders" className={!sp.status ? "btn btn-sm" : "btn-secondary btn-sm"}>הכל</Link>
        {Object.entries(ORDER_STATUS_LABEL).map(([k, v]) => (
          <Link key={k} href={`/admin/orders?status=${k}`} className={sp.status === k ? "btn btn-sm" : "btn-secondary btn-sm"}>
            {v} ({countOf(k)})
          </Link>
        ))}
      </div>
      <form className="card flex flex-wrap gap-3 items-end">
        {sp.status && <input type="hidden" name="status" value={sp.status} />}
        <label className="block"><span className="label">לקוח</span>
          <select name="customer" className="input" defaultValue={sp.customer ?? ""}>
            <option value="">כל הלקוחות</option>
            {customers.map((c) => <option key={c.id} value={c.id}>{c.business_name}</option>)}
          </select>
        </label>
        <label className="block"><span className="label">מתאריך</span><input type="date" name="from" className="input" defaultValue={sp.from} /></label>
        <label className="block"><span className="label">עד תאריך</span><input type="date" name="to" className="input" defaultValue={sp.to} /></label>
        <button className="btn">סינון</button>
      </form>
      <div className="card p-0 overflow-x-auto">
        {orders.length === 0 ? <Empty>אין הזמנות מתאימות</Empty> : (
          <table className="table min-w-[760px]">
            <thead><tr><th>מס&apos;</th><th>תאריך</th><th>לקוח</th><th>סכום</th><th>אמצעי תשלום</th><th>תשלום</th><th>סטטוס</th></tr></thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id}>
                  <td><Link href={`/admin/orders/${o.id}`} className="link font-medium">{o.order_number}</Link></td>
                  <td>{date(o.created_at)}</td>
                  <td>{o.customer.business_name}</td>
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
    </div>
  );
}
