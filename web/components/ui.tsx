import type { OrderStatus, PaymentStatus } from "@prisma/client";
import { ORDER_STATUS_LABEL, PAYMENT_STATUS_LABEL } from "@/lib/format";

const STATUS_CLS: Record<OrderStatus, string> = {
  new: "bg-blue-50 text-blue-800",
  processing: "bg-amber-50 text-amber-800",
  shipped: "bg-indigo-50 text-indigo-800",
  delivered: "bg-emerald-50 text-emerald-800",
  cancelled: "bg-zinc-100 text-zinc-600",
};

export function OrderStatusChip({ status }: { status: OrderStatus }) {
  return <span className={`chip ${STATUS_CLS[status]}`}>{ORDER_STATUS_LABEL[status]}</span>;
}

const PAY_CLS: Record<PaymentStatus, string> = {
  pending: "bg-amber-50 text-amber-800",
  paid: "bg-emerald-50 text-emerald-800",
  on_terms: "bg-violet-50 text-violet-800",
};

export function PaymentStatusChip({ status }: { status: PaymentStatus }) {
  return <span className={`chip ${PAY_CLS[status]}`}>{PAYMENT_STATUS_LABEL[status]}</span>;
}

export function Notice({ error, ok }: { error?: string | string[]; ok?: string | string[] }) {
  if (error) return <div className="alert-error mb-4">{String(error)}</div>;
  if (ok) return <div className="alert-ok mb-4">{String(ok)}</div>;
  return null;
}

export function Field({
  label,
  name,
  type = "text",
  defaultValue,
  required,
  placeholder,
  dir,
  min,
  step,
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string | number | null;
  required?: boolean;
  placeholder?: string;
  dir?: "ltr" | "rtl";
  min?: number;
  step?: string;
}) {
  return (
    <label className="block">
      <span className="label">
        {label}
        {required && <span className="text-bad"> *</span>}
      </span>
      <input
        className="input"
        name={name}
        type={type}
        defaultValue={defaultValue ?? undefined}
        required={required}
        placeholder={placeholder}
        dir={dir}
        min={min}
        step={step}
      />
    </label>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <div className="text-center text-muted py-12">{children}</div>;
}
