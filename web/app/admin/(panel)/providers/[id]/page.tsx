import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireStaff } from "@/lib/auth/current";
import { Notice } from "@/components/ui";
import { ProviderFields } from "../form";
import { deleteProviderAction, updateProviderAction } from "../actions";

export default async function EditProviderPage({
  params, searchParams,
}: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> }) {
  await requireStaff("providers");
  const { id } = await params;
  const { error } = await searchParams;
  const p = await db.provider.findUnique({ where: { id } });
  if (!p) notFound();
  return (
    <div className="max-w-3xl space-y-4">
      <Link href="/admin/providers" className="link text-sm">→ ספקים</Link>
      <div className="card">
        <h1 className="h1 mb-4">עריכת ספק</h1>
        <Notice error={error} />
        <form action={updateProviderAction} className="space-y-4">
          <input type="hidden" name="id" value={p.id} />
          <ProviderFields p={p} />
          <div className="flex gap-3">
            <button className="btn">שמירה</button>
            <button formAction={deleteProviderAction} className="btn-danger ms-auto">מחיקה</button>
          </div>
        </form>
      </div>
    </div>
  );
}
