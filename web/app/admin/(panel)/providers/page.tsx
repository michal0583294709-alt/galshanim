import Link from "next/link";
import { db } from "@/lib/db";
import { requireStaff } from "@/lib/auth/current";
import { PROVIDER_TYPE_LABEL } from "@/lib/format";
import { Empty, Notice } from "@/components/ui";
import { ProviderFields } from "./form";
import { createProviderAction } from "./actions";

export default async function ProvidersPage({ searchParams }: { searchParams: Promise<{ error?: string; ok?: string }> }) {
  await requireStaff("providers");
  const sp = await searchParams;
  const providers = await db.provider.findMany({ orderBy: [{ type: "asc" }, { name: "asc" }] });
  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="h1">ספקים</h1>
        <p className="text-sm text-muted mt-1">ספקי סליקה, חשבוניות ושילוח. חברות השילוח שמוגדרות כאן מופיעות לבחירה בדף ההזמנה.</p>
      </div>
      <Notice error={sp.error} ok={sp.ok} />
      <div className="card p-0 overflow-x-auto">
        {providers.length === 0 ? <Empty>עדיין לא הוגדרו ספקים</Empty> : (
          <table className="table min-w-[560px]">
            <thead><tr><th>סוג</th><th>שם</th><th>אתר</th><th>הערות</th><th>מצב</th></tr></thead>
            <tbody>
              {providers.map((p) => (
                <tr key={p.id}>
                  <td>{PROVIDER_TYPE_LABEL[p.type]}</td>
                  <td><Link href={`/admin/providers/${p.id}`} className="link font-medium">{p.name}</Link></td>
                  <td dir="ltr" className="text-end">{p.website ?? "—"}</td>
                  <td className="text-muted max-w-xs truncate">{p.notes ?? "—"}</td>
                  <td>{p.is_active ? "פעיל" : <span className="text-muted">לא פעיל</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <section className="card">
        <h2 className="h2 mb-4">הוספת ספק</h2>
        <form action={createProviderAction} className="space-y-4">
          <ProviderFields />
          <button className="btn">הוספה</button>
        </form>
      </section>
    </div>
  );
}
