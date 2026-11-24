import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireCustomer } from "@/lib/auth/current";
import { money } from "@/lib/format";
import { mockPayAction } from "../../actions";

/** דף תשלום מדומה – יוחלף בדף של ספק הסליקה כשייבחר */
export default async function MockPayPage({ params }: { params: Promise<{ id: string }> }) {
  const me = await requireCustomer();
  const { id } = await params;
  const o = await db.order.findFirst({ where: { id, customer_id: me.id } });
  if (!o) notFound();
  if (o.payment_status !== "pending" || o.payment_method !== "credit_card") redirect(`/orders/${o.id}`);
  return (
    <div className="max-w-md mx-auto card space-y-4 text-center">
      <h1 className="h1">תשלום בכרטיס אשראי</h1>
      <p>הזמנה {o.order_number} · {money(o.total_amount)}</p>
      <div className="alert-error text-start">
        עדיין לא חובר ספק סליקה. זהו דף תשלום <b>לבדיקה בלבד</b>. לא מזינים כאן פרטי כרטיס.
      </div>
      <form action={mockPayAction}>
        <input type="hidden" name="orderId" value={o.id} />
        <button className="btn w-full">אישור תשלום (בדיקה)</button>
      </form>
    </div>
  );
}
