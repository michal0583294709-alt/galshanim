import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { getCurrentCustomer } from "@/lib/auth/current";
import { ltr, money } from "@/lib/format";
import { Empty } from "@/components/ui";

type SP = { q?: string; size?: string; color?: string; material?: string; instock?: string };

export default async function CatalogPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const me = await getCurrentCustomer();

  const variantFilter: Prisma.ProductVariantWhereInput = {
    ...(sp.size && { size: sp.size }),
    ...(sp.color && { color: sp.color }),
    ...(sp.material && { material: sp.material }),
    ...(sp.instock && { stock_quantity: { gt: 0 } }),
  };
  const hasVariantFilter = Object.keys(variantFilter).length > 0;

  const [products, facets] = await Promise.all([
    db.product.findMany({
      where: {
        is_active: true,
        ...(sp.q && { name: { contains: sp.q, mode: "insensitive" } }),
        ...(hasVariantFilter && { variants: { some: variantFilter } }),
      },
      include: { variants: true, images: { orderBy: { sort_order: "asc" } } },
      orderBy: { name: "asc" },
    }),
    db.productVariant.findMany({
      where: { product: { is_active: true } },
      select: { size: true, color: true, material: true },
    }),
  ]);

  const uniq = (xs: (string | null)[]) => [...new Set(xs.filter(Boolean) as string[])].sort();
  const sizes = uniq(facets.map((f) => f.size));
  const colors = uniq(facets.map((f) => f.color));
  const materials = uniq(facets.map((f) => f.material));

  return (
    <div className="grid md:grid-cols-[220px_1fr] gap-6">
      <aside>
        <form className="card space-y-4 md:sticky md:top-4">
          <h2 className="h2">סינון</h2>
          <input className="input" name="q" placeholder="חיפוש דגם…" defaultValue={sp.q} />
          <Select name="size" label="מידה" options={sizes} value={sp.size} />
          <Select name="color" label="צבע" options={colors} value={sp.color} />
          <Select name="material" label="חומר" options={materials} value={sp.material} />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="instock" value="1" defaultChecked={!!sp.instock} /> רק במלאי
          </label>
          <div className="flex gap-2">
            <button className="btn btn-sm flex-1">סינון</button>
            <Link href="/catalog" className="btn-secondary btn-sm">ניקוי</Link>
          </div>
        </form>
      </aside>

      <section>
        <div className="flex items-baseline justify-between mb-4">
          <h1 className="h1">קטלוג גלשנים</h1>
          <span className="text-sm text-muted">{products.length} דגמים</span>
        </div>
        {!me && (
          <div className="card mb-4 text-sm">
            המחירים מוצגים ללקוחות רשומים. <Link href="/register" className="link">הרשמה</Link> או{" "}
            <Link href="/login" className="link">התחברות</Link>.
          </div>
        )}
        {products.length === 0 ? (
          <Empty>לא נמצאו דגמים מתאימים</Empty>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((p) => {
              const img = (sp.color && p.images.find((i) => i.color === sp.color)) || p.images[0];
              const stock = p.variants.reduce((s, v) => s + v.stock_quantity, 0);
              const pColors = uniq(p.variants.map((v) => v.color));
              return (
                <Link
                  key={p.id}
                  href={`/products/${p.id}${sp.color ? `?color=${encodeURIComponent(sp.color)}` : ""}`}
                  className="card p-0 overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="aspect-square bg-surface">
                    {img && <img src={img.image_url} alt={p.name} className="w-full h-full object-cover" />}
                  </div>
                  <div className="p-4 space-y-1">
                    <div className="font-bold">{p.name}</div>
                    <div className="text-xs text-muted">
                      {uniq(p.variants.map((v) => v.size)).map(ltr).join(" · ")} | {pColors.join(", ")}
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <span className="font-extrabold text-brand">{me ? money(p.price) : "—"}</span>
                      <span className={`text-xs ${stock > 0 ? "text-ok" : "text-bad"}`}>
                        {stock > 0 ? `${stock} במלאי` : "אזל מהמלאי"}
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function Select({ name, label, options, value }: { name: string; label: string; options: string[]; value?: string }) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      <select name={name} className="input" defaultValue={value ?? ""}>
        <option value="">הכל</option>
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    </label>
  );
}
