import Link from "next/link";
import { db } from "@/lib/db";
import { requireStaff } from "@/lib/auth/current";
import { PERMISSIONS, parsePermissions } from "@/lib/auth/permissions";
import { Notice } from "@/components/ui";

export default async function UsersPage({ searchParams }: { searchParams: Promise<{ ok?: string }> }) {
  await requireStaff("admin");
  const { ok } = await searchParams;
  const users = await db.staffUser.findMany({ orderBy: [{ role: "asc" }, { full_name: "asc" }] });
  return (
    <div className="space-y-4 max-w-5xl">
      <div className="flex items-center gap-3">
        <h1 className="h1">עובדים והרשאות</h1>
        <Link href="/admin/users/new" className="btn ms-auto">+ עובד חדש</Link>
      </div>
      <Notice ok={ok} />
      <div className="card p-0 overflow-x-auto">
        <table className="table min-w-[600px]">
          <thead><tr><th>שם</th><th>מייל</th><th>תפקיד</th><th>הרשאות</th><th>מצב</th></tr></thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td><Link href={`/admin/users/${u.id}`} className="link font-medium">{u.full_name}</Link></td>
                <td dir="ltr" className="text-end">{u.email}</td>
                <td>{u.role === "admin" ? "מנהל/ת" : "עובד/ת"}</td>
                <td className="text-xs">
                  {u.role === "admin" ? "גישה מלאה" : parsePermissions(u.permissions).map((p) => PERMISSIONS[p]).join(", ") || "—"}
                </td>
                <td>{u.is_active ? "פעיל" : <span className="text-muted">מושבת</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
