import Link from "next/link";
import { db } from "@/lib/db";
import { requireStaff } from "@/lib/auth/current";
import { money } from "@/lib/format";
import { LOW_STOCK } from "@/lib/pricing";
import { Empty, Notice } from "@/components/ui";



export default async function AdminProductsPage({ searchParams }: { searchParams: Promise<{ q?: string; ok?: string }> }) {
  await requireStaff("products");
  const sp = await searchParams;
  const products = await db.product.findMany({
    where: sp.q ? { name: { contains: sp.q, mode: "insensitive" } } : undefined,
    include: { variants: true, _count: { select: { images: true } } },
    orderBy: { name: "asc" },
  });
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="h1">דגמים ומלאי</h1>
        <form className="ms-auto flex gap-2">
          <input name="q" className="input h-9 w-48" placeholder="חיפוש…" defaultValue={sp.q} />
        </form>
        <Link href="/admin/products/new" className="btn">+ דגם חדש</Link>
      </div>
      <Notice ok={sp.ok} />
      <div className="card p-0 overflow-x-auto">
        {products.length === 0 ? <Empty>אין דגמים</Empty> : (
          <table className="table min-w-[640px]">
            <thead><tr><th>דגם</th><th>מחיר</th><th>וריאציות</th><th>מלאי כולל</th><th>מלאי נמוך</th><th>תמונות</th><th>מוצג באתר</th></tr></thead>
            <tbody>
              {products.map((p) => {
                const total = p.variants.reduce((s, v) => s + v.stock_quantity, 0);
                const low = p.variants.filter((v) => v.stock_quantity <= LOW_STOCK).length;
                return (
                  <tr key={p.id}>
                    <td><Link href={`/admin/products/${p.id}`} className="link font-medium">{p.name}</Link></td>
                    <td>{money(p.price)}</td>
                    <td>{p.variants.length}</td>
                    <td>{total}</td>
                    <td>{low > 0 ? <span className="chip bg-amber-50 text-amber-800">{low} וריאציות</span> : "—"}</td>
                    <td>{p._count.images}</td>
                    <td>{p.is_active ? "✓" : <span className="text-muted">מוסתר</span>}</td>
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
