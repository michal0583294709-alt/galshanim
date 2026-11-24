import type { StaffUser } from "@prisma/client";
import { PERMISSIONS, parsePermissions } from "@/lib/auth/permissions";
import { Field } from "@/components/ui";

export function UserFields({ u }: { u?: StaffUser }) {
  const perms = parsePermissions(u?.permissions);
  return (
    <div className="grid sm:grid-cols-2 gap-4">
      <Field label="שם מלא" name="full_name" required defaultValue={u?.full_name} />
      <Field label="מייל (להתחברות)" name="email" type="email" required dir="ltr" defaultValue={u?.email} />
      <Field label={u ? "סיסמה חדשה (להשאיר ריק ללא שינוי)" : "סיסמה"} name="password" type="password" required={!u} dir="ltr" />
      <label className="block"><span className="label">תפקיד</span>
        <select name="role" className="input" defaultValue={u?.role ?? "employee"}>
          <option value="employee">עובד/ת – לפי הרשאות</option>
          <option value="admin">מנהל/ת – גישה מלאה</option>
        </select>
      </label>
      <fieldset className="sm:col-span-2 border border-line rounded-lg p-4">
        <legend className="text-sm font-bold px-1">הרשאות לעובד/ת (לא רלוונטי למנהל/ת)</legend>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {Object.entries(PERMISSIONS).map(([k, v]) => (
            <label key={k} className="flex items-center gap-2 text-sm">
              <input type="checkbox" name={`perm_${k}`} defaultChecked={perms.includes(k as keyof typeof PERMISSIONS)} /> {v}
            </label>
          ))}
        </div>
      </fieldset>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="is_active" defaultChecked={u?.is_active ?? true} /> משתמש פעיל
      </label>
    </div>
  );
}
