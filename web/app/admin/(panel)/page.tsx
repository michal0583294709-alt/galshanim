import Link from "next/link";
import { db } from "@/lib/db";
import { requireStaff } from "@/lib/auth/current";
import { can } from "@/lib/auth/permissions";
import { ltr, money } from "@/lib/format";
import { inventoryReport, salesReport } from "@/lib/reports";

type SP = { from?: string; to?: string; denied?: string };

const iso = (d: Date) => d.toISOString().slice(0, 10);

export default async function DashboardPage({ searchParams }: { searchParams: Promise<SP> }) {
  const me = await requireStaff();
  const sp = await searchParams;

  if (!can(me, "reports")) {
    return (
      <div className="space-y-4">
        {sp.denied && <div className="alert-error">אין לך הרשאה למסך הזה.</div>}
        <h1 className="h1">שלום {me.full_name}</h1>
        <p className="text-muted">בחרו מסך מהתפריט.</p>
      </div>
    );
  }

  const now = new Date();
  const from = sp.from ? new Date(sp.from) : new Date(now.getFullYear(), now.getMonth(), 1);
  const to = sp.to ? new Date(sp.to) : now;
  const toExclusive = new Date(new Date(iso(to)).getTime() + 86_400_000);

  const [sales, inv, openNew, openProcessing, pendingPay] = await Promise.all([
    salesReport(from, toExclusive),
    inventoryReport(),
    db.order.count({ where: { status: "new" } }),
    db.order.count({ where: { status: "processing" } }),
    db.order.aggregate({
      where: { status: { not: "cancelled" }, payment_status: { in: ["pending", "on_terms"] } },
      _sum: { total_amount: true },
      _count: true,
    }),
  ]);

  return (
    <div className="space-y-6">
      {sp.denied && <div className="alert-error">אין לך הרשאה למסך הזה.</div>}
      <div className="flex flex-wrap items-end gap-3">
        <h1 className="h1">דשבורד ודוחות</h1>
        <form className="ms-auto flex flex-wrap gap-2 items-end">
          <label className="block"><span className="label">מתאריך</span><input type="date" name="from" className="input h-9" defaultValue={iso(from)} /></label>
          <label className="block"><span className="label">עד</span><input type="date" name="to" className="input h-9" defaultValue={iso(to)} /></label>
          <button className="btn h-9">הצגה</button>
        </form>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi label="מכירות בתקופה" value={money(sales.revenue)} sub={`${sales.orderCount} הזמנות`} />
        <Kpi label="הזמנות חדשות לטיפול" value={String(openNew)} sub={`${openProcessing} בטיפול`} href="/admin/orders?status=new" />
        <Kpi label="ממתין לתשלום" value={money(pendingPay._sum.total_amount ?? 0)} sub={`${pendingPay._count} הזמנות`} />
        <Kpi label="מלאי נמוך" value={String(inv.low.length)} sub={`מתוך ${inv.variantCount} וריאציות · ${inv.totalUnits} יח'`} href="/admin/products" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Report title="מכירות לפי מוצר" head={["דגם", "יחידות", "הכנסה"]}
          rows={sales.byProduct.map((r) => [r.name, String(r.qty), money(r.revenue)])} />
        <Report title="מכירות לפי לקוח" head={["לקוח", "הזמנות", "הכנסה"]}
          rows={sales.byCustomer.map((r) => [r.name, String(r.orders), money(r.revenue)])} />
        <Report title="מכירות לפי חודש" head={["חודש", "הזמנות", "הכנסה"]}
          rows={sales.byMonth.map(([k, r]) => [k, String(r.orders), money(r.revenue)])} />
        <Report title="דוח מלאי נמוך" head={["דגם", "וריאציה", "מלאי"]}
          rows={inv.low.map((v) => [v.product.name, `${ltr(v.size)} · ${v.color}${v.material ? ` · ${v.material}` : ""}`, String(v.stock_quantity)])} />
      </div>
    </div>
  );
}

function Kpi({ label, value, sub, href }: { label: string; value: string; sub: string; href?: string }) {
  const body = (
    <>
      <div className="text-sm text-muted">{label}</div>
      <div className="text-2xl font-extrabold mt-1">{value}</div>
      <div className="text-xs text-muted mt-1">{sub}</div>
    </>
  );
  return href ? <Link href={href} className="card hover:border-brand">{body}</Link> : <div className="card">{body}</div>;
}

function Report({ title, head, rows }: { title: string; head: string[]; rows: string[][] }) {
  return (
    <section className="card p-0 overflow-x-auto">
      <h2 className="h2 px-5 pt-4 pb-3">{title}</h2>
      {rows.length === 0 ? <p className="text-sm text-muted px-5 pb-5">אין נתונים בתקופה</p> : (
        <table className="table">
          <thead><tr>{head.map((h) => <th key={h}>{h}</th>)}</tr></thead>
          <tbody>{rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j}>{c}</td>)}</tr>)}</tbody>
        </table>
      )}
    </section>
  );
}
