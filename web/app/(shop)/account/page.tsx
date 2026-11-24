import { requireCustomer } from "@/lib/auth/current";
import { CUSTOMER_TYPE_LABEL } from "@/lib/format";
import { Field, Notice } from "@/components/ui";
import { updateAccountAction } from "../actions";

export default async function AccountPage({ searchParams }: { searchParams: Promise<{ error?: string; ok?: string }> }) {
  const me = await requireCustomer();
  const sp = await searchParams;
  return (
    <div className="max-w-2xl mx-auto card">
      <h1 className="h1 mb-4">פרטי העסק</h1>
      <Notice error={sp.error} ok={sp.ok} />
      <form action={updateAccountAction} className="grid sm:grid-cols-2 gap-4">
        <Field label="שם העסק" name="business_name" required defaultValue={me.business_name} />
        <Field label="ח.פ / ע.מ" name="business_tax_id" required dir="ltr" defaultValue={me.business_tax_id} />
        <Field label="איש קשר" name="contact_name" required defaultValue={me.contact_name} />
        <Field label="טלפון" name="phone" dir="ltr" defaultValue={me.phone} />
        <label className="block">
          <span className="label">סוג העסק</span>
          <select name="customer_type" className="input" defaultValue={me.customer_type ?? ""}>
            <option value="">—</option>
            {Object.entries(CUSTOMER_TYPE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </label>
        <Field label="כתובת העסק" name="address" defaultValue={me.address} />
        <div className="sm:col-span-2 text-sm text-muted">
          מייל: <span dir="ltr">{me.email}</span>
          {me.is_net_terms_approved && <> · מאושר לתנאי תשלום שוטף+{me.net_terms_days ?? 30}</>}
        </div>
        <div className="sm:col-span-2"><button className="btn">שמירה</button></div>
      </form>
    </div>
  );
}
