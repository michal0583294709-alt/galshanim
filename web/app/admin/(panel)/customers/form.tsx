import type { Customer } from "@prisma/client";
import { CUSTOMER_TYPE_LABEL } from "@/lib/format";
import { Field } from "@/components/ui";

export function CustomerFields({ c, isAdmin }: { c?: Customer; isAdmin: boolean }) {
  return (
    <div className="grid sm:grid-cols-2 gap-4">
      <Field label="שם העסק" name="business_name" required defaultValue={c?.business_name} />
      <Field label="ח.פ / ע.מ" name="business_tax_id" required dir="ltr" defaultValue={c?.business_tax_id} />
      <Field label="איש קשר" name="contact_name" required defaultValue={c?.contact_name} />
      <Field label="מייל" name="email" type="email" required dir="ltr" defaultValue={c?.email} />
      <Field label="טלפון" name="phone" dir="ltr" defaultValue={c?.phone} />
      <label className="block"><span className="label">סוג העסק</span>
        <select name="customer_type" className="input" defaultValue={c?.customer_type ?? ""}>
          <option value="">—</option>
          {Object.entries(CUSTOMER_TYPE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </label>
      <label className="block sm:col-span-2"><span className="label">כתובת</span>
        <textarea name="address" className="input" rows={2} defaultValue={c?.address ?? ""} />
      </label>
      <Field label={c ? "סיסמה חדשה (להשאיר ריק ללא שינוי)" : "סיסמה ראשונית"} name="password" type="password" required={!c} dir="ltr" />
      <label className="flex items-center gap-2 text-sm self-end pb-2">
        <input type="checkbox" name="is_active" defaultChecked={c?.is_active ?? true} /> חשבון פעיל
      </label>
      <fieldset className="sm:col-span-2 border border-line rounded-lg p-4" disabled={!isAdmin}>
        <legend className="text-sm font-bold px-1">תנאי תשלום {!isAdmin && "(רק המנהלת יכולה לשנות)"}</legend>
        <div className="flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="is_net_terms_approved" defaultChecked={c?.is_net_terms_approved} /> מאושר לתשלום בשוטף
          </label>
          <label className="flex items-center gap-2 text-sm">
            שוטף + <input type="number" name="net_terms_days" min={0} defaultValue={c?.net_terms_days ?? 30} className="input h-8 w-20" /> ימים
          </label>
        </div>
      </fieldset>
    </div>
  );
}
