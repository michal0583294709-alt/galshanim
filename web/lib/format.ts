import type { Prisma } from "@prisma/client";

const ils = new Intl.NumberFormat("he-IL", { style: "currency", currency: "ILS", maximumFractionDigits: 2 });
const dateFmt = new Intl.DateTimeFormat("he-IL", { day: "2-digit", month: "2-digit", year: "numeric" });

export function money(v: Prisma.Decimal | number | string) {
  return ils.format(Number(v.toString()));
}

export function date(d: Date | null | undefined) {
  return d ? dateFmt.format(d) : "—";
}

export const ORDER_STATUS_LABEL = {
  new: "חדשה",
  processing: "בטיפול",
  shipped: "נשלחה",
  delivered: "נמסרה",
  cancelled: "בוטלה",
} as const;

export const PAYMENT_METHOD_LABEL = {
  credit_card: "כרטיס אשראי",
  bank_transfer: "העברה בנקאית",
  net_terms: "תנאי תשלום (שוטף)",
} as const;

export const PAYMENT_STATUS_LABEL = {
  pending: "ממתין",
  paid: "שולם",
  on_terms: "בתנאי תשלום",
} as const;

export const CUSTOMER_TYPE_LABEL = {
  surf_shop: "חנות גלישה",
  surf_school: "בית ספר לגלישה",
  club: "מועדון",
  hotel: "מלון",
  other: "אחר",
} as const;

export const PROVIDER_TYPE_LABEL = {
  payment: "סליקת אשראי",
  invoicing: "חשבוניות",
  shipping: "שילוח",
} as const;

/** בידוד טקסט משמאל לימין (מידות כמו 9'0) בתוך טקסט עברי */
export function ltr(s: string) {
  return `⁦${s}⁩`;
}
