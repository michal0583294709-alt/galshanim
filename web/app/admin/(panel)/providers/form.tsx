import type { Provider } from "@prisma/client";
import { PROVIDER_TYPE_LABEL } from "@/lib/format";
import { Field } from "@/components/ui";

export function ProviderFields({ p }: { p?: Provider }) {
  return (
    <div className="grid sm:grid-cols-2 gap-4">
      <label className="block"><span className="label">סוג ספק <span className="text-bad">*</span></span>
        <select name="type" className="input" defaultValue={p?.type ?? "shipping"} required>
          {Object.entries(PROVIDER_TYPE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </label>
      <Field label="שם הספק" name="name" required defaultValue={p?.name} />
      <Field label="אתר / כתובת" name="website" dir="ltr" defaultValue={p?.website} />
      <label className="flex items-center gap-2 text-sm self-end pb-2">
        <input type="checkbox" name="is_active" defaultChecked={p?.is_active ?? true} /> פעיל
      </label>
      <label className="block sm:col-span-2"><span className="label">הערות (איש קשר, תנאים…)</span>
        <textarea name="notes" className="input" rows={2} defaultValue={p?.notes ?? ""} />
      </label>
    </div>
  );
}
