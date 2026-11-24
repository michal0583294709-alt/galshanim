import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireStaff } from "@/lib/auth/current";
import { can } from "@/lib/auth/permissions";
import { date, money } from "@/lib/format";
import { Notice, OrderStatusChip, PaymentStatusChip } from "@/components/ui";
import { CustomerFields } from "../form";
import { deleteCustomerAction, updateCustomerAction } from "../actions";

export default async function EditCustomerPage({
  params, searchParams,
}: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string; ok?: string }> }) {
  const me = await requireStaff("customers");
  const { id } = await params;
  const sp = await searchParams;
  const c = await db.customer.findUnique({ where: { id }, include: { orders: { orderBy: { created_at: "desc" } } } });
  if (!c) notFound();
  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center gap-3">
        <Link href="/admin/customers" className="link text-sm">→ לקוחות</Link>
        <h1 className="h1">{c.business_name}</h1>
      </div>
      <Notice error={sp.error} ok={sp.ok} />
      <section className="card">
        <form action={updateCustomerAction} className="space-y-4">
          <input type="hidden" name="id" value={c.id} />
          <CustomerFields c={c} isAdmin={can(me, "admin")} />
          <div className="flex gap-3">
            <button className="btn">שמירה</button>
            <button formAction={deleteCustomerAction} className="btn-danger ms-auto">מחיקת לקוח</button>
          </div>
        </form>
      </section>
      <section className="card overflow-x-auto">
        <h2 className="h2 mb-3">היסטוריית הזמנות ({c.orders.length})</h2>
        {c.orders.length === 0 ? <p className="text-sm text-muted">אין הזמנות</p> : (
          <table className="table min-w-[520px]">
            <thead><tr><th>מס&apos;</th><th>תאריך</th><th>סכום</th><th>תשלום</th><th>סטטוס</th></tr></thead>
            <tbody>
              {c.orders.map((o) => (
                <tr key={o.id}>
                  <td>{can(me, "orders") ? <Link href={`/admin/orders/${o.id}`} className="link">{o.order_number}</Link> : o.order_number}</td>
                  <td>{date(o.created_at)}</td>
                  <td>{money(o.total_amount)}</td>
                  <td><PaymentStatusChip status={o.payment_status} /></td>
                  <td><OrderStatusChip status={o.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
