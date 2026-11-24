import Link from "next/link";
import { Field, Notice } from "@/components/ui";
import { CUSTOMER_TYPE_LABEL } from "@/lib/format";
import { registerAction } from "../actions";

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return (
    <div className="max-w-2xl mx-auto card">
      <h1 className="h1 mb-1">הרשמת לקוח עסקי</h1>
      <p className="text-muted text-sm mb-6">חנויות גלישה, בתי ספר, מועדונים ומלונות. לאחר ההרשמה אפשר לראות מחירים ולהזמין.</p>
      <Notice error={error} />
      <form action={registerAction} className="grid sm:grid-cols-2 gap-4">
        <Field label="שם העסק" name="business_name" required />
        <Field label="ח.פ / ע.מ" name="business_tax_id" required dir="ltr" />
        <Field label="איש קשר" name="contact_name" required />
        <Field label="טלפון" name="phone" type="tel" dir="ltr" />
        <label className="block">
          <span className="label">סוג העסק</span>
          <select name="customer_type" className="input" defaultValue="">
            <option value="">בחרו…</option>
            {Object.entries(CUSTOMER_TYPE_LABEL).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </label>
        <Field label="כתובת העסק" name="address" />
        <Field label="מייל (להתחברות)" name="email" type="email" required dir="ltr" />
        <Field label="סיסמה (8 תווים לפחות)" name="password" type="password" required dir="ltr" />
        <div className="sm:col-span-2 flex items-center gap-4 mt-2">
          <button className="btn">יצירת חשבון</button>
          <Link href="/login" className="link text-sm">כבר רשומים? התחברות</Link>
        </div>
      </form>
    </div>
  );
}
