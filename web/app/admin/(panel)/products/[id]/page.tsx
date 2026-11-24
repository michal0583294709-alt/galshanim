import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireStaff } from "@/lib/auth/current";
import { Field, Notice } from "@/components/ui";
import {
  addImageAction, addVariantAction, deleteImageAction, deleteProductAction,
  deleteVariantAction, moveImageAction, saveVariantsAction, updateProductAction,
} from "../actions";

export default async function EditProductPage({
  params, searchParams,
}: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string; ok?: string }> }) {
  await requireStaff("products");
  const { id } = await params;
  const sp = await searchParams;
  const p = await db.product.findUnique({
    where: { id },
    include: {
      variants: { orderBy: [{ color: "asc" }, { size: "asc" }] },
      images: { orderBy: [{ color: "asc" }, { sort_order: "asc" }] },
    },
  });
  if (!p) notFound();
  const colors = [...new Set(p.variants.map((v) => v.color))];

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center gap-3">
        <Link href="/admin/products" className="link text-sm">→ דגמים</Link>
        <h1 className="h1">{p.name}</h1>
      </div>
      <Notice error={sp.error} ok={sp.ok} />

      <section className="card">
        <h2 className="h2 mb-4">פרטי הדגם ומחיר</h2>
        <form action={updateProductAction} className="grid sm:grid-cols-2 gap-4">
          <input type="hidden" name="id" value={p.id} />
          <Field label="שם" name="name" required defaultValue={p.name} />
          <Field label="מחיר (₪, כולל מע״מ) – זהה לכל הווריאציות" name="price" required dir="ltr" defaultValue={p.price.toFixed(2)} />
          <label className="block sm:col-span-2"><span className="label">תיאור</span><textarea name="description" className="input" rows={2} defaultValue={p.description ?? ""} /></label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="is_active" defaultChecked={p.is_active} /> מוצג באתר</label>
          <div className="sm:col-span-2 flex gap-3">
            <button className="btn">שמירה</button>
            <button formAction={deleteProductAction} className="btn-danger ms-auto">מחיקת הדגם</button>
          </div>
        </form>
      </section>

      <section className="card overflow-x-auto">
        <h2 className="h2 mb-4">וריאציות ומלאי</h2>
        <form action={saveVariantsAction}>
          <input type="hidden" name="product_id" value={p.id} />
          <table className="table min-w-[560px]">
            <thead><tr><th>מידה</th><th>צבע</th><th>חומר</th><th>מלאי</th><th></th></tr></thead>
            <tbody>
              {p.variants.map((v) => (
                <tr key={v.id}>
                  <td><input name={`size_${v.id}`} defaultValue={v.size} className="input h-8" dir="ltr" /></td>
                  <td><input name={`color_${v.id}`} defaultValue={v.color} className="input h-8" /></td>
                  <td><input name={`material_${v.id}`} defaultValue={v.material ?? ""} className="input h-8" /></td>
                  <td><input name={`stock_${v.id}`} type="number" min={0} defaultValue={v.stock_quantity} className={`input h-8 w-24 ${v.stock_quantity <= 3 ? "border-amber-400" : ""}`} /></td>
                  <td>
                    <button form={`del-${v.id}`} className="text-bad text-xs cursor-pointer">מחיקה</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button className="btn mt-4">שמירת מלאי ווריאציות</button>
        </form>
        {p.variants.map((v) => (
          <form key={v.id} id={`del-${v.id}`} action={deleteVariantAction} className="hidden">
            <input type="hidden" name="product_id" value={p.id} />
            <input type="hidden" name="variant_id" value={v.id} />
          </form>
        ))}
        <form action={addVariantAction} className="grid grid-cols-2 sm:grid-cols-5 gap-3 items-end mt-6 pt-6 border-t border-line">
          <input type="hidden" name="product_id" value={p.id} />
          <Field label="מידה" name="size" required dir="ltr" />
          <Field label="צבע" name="color" required />
          <Field label="חומר" name="material" />
          <Field label="מלאי" name="stock_quantity" type="number" min={0} defaultValue={0} />
          <button className="btn-secondary">+ הוספת וריאציה</button>
        </form>
      </section>

      <section className="card">
        <h2 className="h2 mb-1">תמונות לפי צבע</h2>
        <p className="text-sm text-muted mb-4">כשהלקוח בוחר צבע, מוצגות התמונות של אותו צבע. הראשונה היא התמונה הראשית.</p>
        {colors.map((c) => {
          const imgs = p.images.filter((i) => i.color === c);
          return (
            <div key={c} className="mb-5">
              <div className="font-bold mb-2">{c}</div>
              <div className="flex flex-wrap gap-3">
                {imgs.length === 0 && <span className="text-sm text-muted">אין תמונות</span>}
                {imgs.map((i, idx) => (
                  <div key={i.id} className="w-28 text-center">
                    <img src={i.image_url} alt="" className="w-28 h-28 rounded-lg border border-line object-cover" />
                    <div className="flex justify-center gap-2 text-xs mt-1">
                      {idx > 0 && <ImgBtn action={moveImageAction} productId={p.id} imageId={i.id} dir="up" label="→" />}
                      {idx < imgs.length - 1 && <ImgBtn action={moveImageAction} productId={p.id} imageId={i.id} dir="down" label="←" />}
                      <ImgBtn action={deleteImageAction} productId={p.id} imageId={i.id} label="מחיקה" danger />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
        {colors.length > 0 && (
          <form action={addImageAction} className="grid sm:grid-cols-4 gap-3 items-end pt-4 border-t border-line">
            <input type="hidden" name="product_id" value={p.id} />
            <label className="block"><span className="label">צבע</span>
              <select name="color" className="input">{colors.map((c) => <option key={c}>{c}</option>)}</select>
            </label>
            <label className="block"><span className="label">קובץ תמונה</span><input type="file" name="file" accept="image/*" className="input pt-1.5" /></label>
            <Field label="או כתובת תמונה" name="image_url" dir="ltr" />
            <button className="btn-secondary">+ הוספת תמונה</button>
          </form>
        )}
      </section>
    </div>
  );
}

function ImgBtn({
  action, productId, imageId, dir, label, danger,
}: {
  action: (fd: FormData) => Promise<void>; productId: string; imageId: string; dir?: string; label: string; danger?: boolean;
}) {
  return (
    <form action={action}>
      <input type="hidden" name="product_id" value={productId} />
      <input type="hidden" name="image_id" value={imageId} />
      {dir && <input type="hidden" name="dir" value={dir} />}
      <button className={`${danger ? "text-bad" : "link"} cursor-pointer`}>{label}</button>
    </form>
  );
}
