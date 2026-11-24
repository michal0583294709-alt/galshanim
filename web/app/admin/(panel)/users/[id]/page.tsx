import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireStaff } from "@/lib/auth/current";
import { Notice } from "@/components/ui";
import { UserFields } from "../form";
import { deleteUserAction, updateUserAction } from "../actions";

export default async function EditUserPage({
  params, searchParams,
}: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> }) {
  await requireStaff("admin");
  const { id } = await params;
  const { error } = await searchParams;
  const u = await db.staffUser.findUnique({ where: { id } });
  if (!u) notFound();
  return (
    <div className="max-w-3xl space-y-4">
      <Link href="/admin/users" className="link text-sm">→ עובדים</Link>
      <div className="card">
        <h1 className="h1 mb-4">{u.full_name}</h1>
        <Notice error={error} />
        <form action={updateUserAction} className="space-y-4">
          <input type="hidden" name="id" value={u.id} />
          <UserFields u={u} />
          <div className="flex gap-3">
            <button className="btn">שמירה</button>
            <button formAction={deleteUserAction} className="btn-danger ms-auto">מחיקה</button>
          </div>
        </form>
      </div>
    </div>
  );
}
