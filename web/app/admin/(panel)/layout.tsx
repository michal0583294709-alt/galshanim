import Link from "next/link";
import { requireStaff } from "@/lib/auth/current";
import { can, type Permission } from "@/lib/auth/permissions";
import { staffLogoutAction } from "../auth-actions";

const NAV: { href: string; label: string; perm: Permission | "admin" | null }[] = [
  { href: "/admin", label: "דשבורד ודוחות", perm: "reports" },
  { href: "/admin/products", label: "דגמים ומלאי", perm: "products" },
  { href: "/admin/orders", label: "הזמנות", perm: "orders" },
  { href: "/admin/customers", label: "לקוחות", perm: "customers" },
  { href: "/admin/providers", label: "ספקים", perm: "providers" },
  { href: "/admin/users", label: "עובדים והרשאות", perm: "admin" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const me = await requireStaff();
  return (
    <div className="min-h-screen md:flex">
      <aside className="bg-ink text-[#c9d3d8] md:w-56 md:min-h-screen flex md:flex-col gap-1 p-3 overflow-x-auto text-sm">
        <div className="text-white font-extrabold text-base px-3 py-2 whitespace-nowrap">🏄 ניהול גלשנים</div>
        {NAV.filter((n) => !n.perm || can(me, n.perm)).map((n) => (
          <Link key={n.href} href={n.href} className="px-3 py-2 rounded-md hover:bg-ink-2 hover:text-white whitespace-nowrap">
            {n.label}
          </Link>
        ))}
        <div className="md:mt-auto px-3 py-2 text-xs whitespace-nowrap">
          <div className="text-white">{me.full_name}</div>
          <div>{me.role === "admin" ? "מנהלת" : "עובד/ת"}</div>
          <form action={staffLogoutAction}>
            <button className="underline mt-1 cursor-pointer">יציאה</button>
          </form>
        </div>
      </aside>
      <main className="flex-1 p-4 md:p-8 min-w-0">{children}</main>
    </div>
  );
}
