import { requireStaff } from "@/lib/auth/current";
import { Field, Notice } from "@/components/ui";
import { createProductAction } from "../actions";

export default async function NewProductPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  await requireStaff("products");
  const { error } = await searchParams;
  return (
    <div className="max-w-xl card">
      <h1 className="h1 mb-4">דגם חדש</h1>
      <Notice error={error} />
      <form action={createProductAction} className="space-y-4">
        <Field label="שם הדגם" name="name" required />
        <Field label="מחיר ליחידה (₪, כולל מע״מ)" name="price" required dir="ltr" placeholder="1950.00" />
        <label className="block"><span className="label">תיאור</span><textarea name="description" className="input" rows={3} /></label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="is_active" defaultChecked /> מוצג באתר</label>
        <button className="btn">יצירה</button>
      </form>
    </div>
  );
}
