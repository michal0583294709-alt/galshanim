import Link from "next/link";
import { db } from "@/lib/db";
import { requireStaff } from "@/lib/auth/current";
import { CUSTOMER_TYPE_LABEL, money } from "@/lib/format";
import { Empty, Notice } from "@/components/ui";

export default async function AdminCustomersPage({ searchParams }: { searchParams: Promise<{ q?: string; ok?: string }> }) {
  await requireStaff("customers");
  const sp = await searchParams;
  const customers = await db.customer.findMany({
    where: sp.q ? {
      OR: [
        { business_name: { contains: sp.q, mode: "insensitive" } },
        { contact_name: { contains: sp.q, mode: "insensitive" } },
        { email: { contains: sp.q, mode: "insensitive" } },
        { business_tax_id: { contains: sp.q } },
      ],
    } : undefined,
    orderBy: { business_name: "asc" },
  });
  const sums = await db.order.groupBy({
    by: ["customer_id"],
    where: { status: { not: "cancelled" } },
    _sum: { total_amount: true },
    _count: true,
  });
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="h1">לקוחות</h1>
        <form className="ms-auto"><input name="q" className="input h-9 w-56" placeholder="חיפוש שם / מייל / ח.פ" defaultValue={sp.q} /></form>
        <Link href="/admin/customers/new" className="btn">+ לקוח חדש</Link>
      </div>
      <Notice ok={sp.ok} />
      <div className="card p-0 overflow-x-auto">
        {customers.length === 0 ? <Empty>אין לקוחות</Empty> : (
          <table className="table min-w-[760px]">
            <thead><tr><th>עסק</th><th>סוג</th><th>איש קשר</th><th>ח.פ</th><th>הזמנות</th><th>סה&quot;כ רכישות</th><th>שוטף</th><th>מצב</th></tr></thead>
            <tbody>
              {customers.map((c) => {
                const s = sums.find((x) => x.customer_id === c.id);
                return (
                  <tr key={c.id}>
                    <td><Link href={`/admin/customers/${c.id}`} className="link font-medium">{c.business_name}</Link></td>
                    <td>{c.customer_type ? CUSTOMER_TYPE_LABEL[c.customer_type] : "—"}</td>
                    <td>{c.contact_name}</td>
                    <td dir="ltr" className="text-end">{c.business_tax_id}</td>
                    <td>{s?._count ?? 0}</td>
                    <td>{money(s?._sum.total_amount ?? 0)}</td>
                    <td>{c.is_net_terms_approved ? `שוטף+${c.net_terms_days ?? 30}` : "—"}</td>
                    <td>{c.is_active ? "פעיל" : <span className="text-muted">מושבת</span>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
