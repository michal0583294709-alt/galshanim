import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentCustomer } from "@/lib/auth/current";
import { money } from "@/lib/format";
import { Notice } from "@/components/ui";
import { addToCartAction } from "../../actions";

export default async function ProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ color?: string; error?: string; ok?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const me = await getCurrentCustomer();
  const p = await db.product.findFirst({
    where: { id, is_active: true },
    include: {
      variants: { orderBy: [{ size: "asc" }, { material: "asc" }] },
      images: { orderBy: { sort_order: "asc" } },
    },
  });
  if (!p) notFound();

  const colors = [...new Set(p.variants.map((v) => v.color))];
  const color = sp.color && colors.includes(sp.color) ? sp.color : colors[0];
  const images = p.images.filter((i) => i.color === color);
  const variants = p.variants.filter((v) => v.color === color);

  return (
    <div>
      <Link href="/catalog" className="link text-sm">→ חזרה לקטלוג</Link>
      <div className="grid md:grid-cols-2 gap-8 mt-4">
        <div className="space-y-3">
          <div className="card p-0 overflow-hidden aspect-square">
            {images[0] ? (
              <img src={images[0].image_url} alt={`${p.name} ${color}`} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted">אין תמונה לצבע זה</div>
            )}
          </div>
          {images.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {images.slice(1).map((i) => (
                <img key={i.id} src={i.image_url} alt="" className="rounded-lg border border-line aspect-square object-cover" />
              ))}
            </div>
          )}
        </div>

        <div>
          <h1 className="h1">{p.name}</h1>
          {p.description && <p className="text-muted mt-2">{p.description}</p>}
          <div className="text-2xl font-extrabold text-brand mt-4">
            {me ? money(p.price) : <Link href={`/login?next=/products/${p.id}`} className="link text-base">התחברו לצפייה במחיר</Link>}
          </div>
          {me && <div className="text-xs text-muted">מחיר ליחידה, כולל מע&quot;מ, זהה לכל המידות והצבעים</div>}

          <div className="mt-6">
            <div className="label">צבע</div>
            <div className="flex flex-wrap gap-2">
              {colors.map((c) => (
                <Link
                  key={c}
                  href={`/products/${p.id}?color=${encodeURIComponent(c)}`}
                  className={c === color ? "btn btn-sm" : "btn-secondary btn-sm"}
                >
                  {c}
                </Link>
              ))}
            </div>
          </div>

          <div className="mt-6">
            <Notice error={sp.error} ok={sp.ok} />
            {sp.ok && <Link href="/cart" className="link text-sm block -mt-2 mb-3">מעבר לעגלה ←</Link>}
            <form action={addToCartAction}>
              <input type="hidden" name="productId" value={p.id} />
              <input type="hidden" name="color" value={color} />
              <table className="table bg-white border border-line rounded-lg">
                <thead>
                  <tr><th>מידה</th><th>חומר</th><th>מלאי זמין</th>{me && <th>כמות</th>}</tr>
                </thead>
                <tbody>
                  {variants.map((v) => (
                    <tr key={v.id}>
                      <td dir="ltr" className="text-end">{v.size}</td>
                      <td>{v.material ?? "—"}</td>
                      <td className={v.stock_quantity > 0 ? "text-ok" : "text-bad"}>
                        {v.stock_quantity > 0 ? v.stock_quantity : "אזל"}
                      </td>
                      {me && (
                        <td>
                          <input
                            type="number"
                            name={`qty_${v.id}`}
                            min={0}
                            max={v.stock_quantity}
                            defaultValue={0}
                            disabled={v.stock_quantity === 0}
                            className="input h-8 w-24"
                          />
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
              {me && <button className="btn mt-4">הוספה לעגלה</button>}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
