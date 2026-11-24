import Link from "next/link";
import { getCurrentCustomer } from "@/lib/auth/current";
import { readCart } from "@/lib/cart";
import { logoutAction } from "./actions";

export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  const me = await getCurrentCustomer();
  const count = me ? (await readCart()).reduce((s, l) => s + l.quantity, 0) : 0;
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white border-b border-line">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center gap-4 sm:gap-6">
          <Link href="/catalog" className="font-extrabold text-xl text-ink">
            🏄 גלשנים <span className="text-brand text-sm font-medium hidden sm:inline">סיטונאי</span>
          </Link>
          {me ? (
            <nav className="flex items-center gap-3 sm:gap-5 text-sm ms-auto">
              <Link href="/catalog" className="hover:text-brand">קטלוג</Link>
              <Link href="/orders" className="hover:text-brand">ההזמנות שלי</Link>
              <Link href="/account" className="hover:text-brand hidden sm:inline">{me.business_name}</Link>
              <Link href="/cart" className="btn btn-sm">
                עגלה{count > 0 && <span className="bg-white text-brand rounded-full px-1.5 text-xs">{count}</span>}
              </Link>
              <form action={logoutAction}>
                <button className="text-muted hover:text-ink cursor-pointer">יציאה</button>
              </form>
            </nav>
          ) : (
            <nav className="flex items-center gap-3 text-sm ms-auto">
              <Link href="/login" className="btn-secondary btn-sm">התחברות</Link>
              <Link href="/register" className="btn btn-sm">הרשמה</Link>
            </nav>
          )}
        </div>
      </header>
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8">{children}</main>
      <footer className="text-center text-xs text-muted py-6">משלוחים בישראל בלבד · כל המחירים כוללים מע&quot;מ</footer>
    </div>
  );
}
