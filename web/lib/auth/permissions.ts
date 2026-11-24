/** רשימת היכולות הקבועה שהמנהלת מסמנת לכל עובד (החלטה: רשימה קבועה, לא תפקידים) */
export const PERMISSIONS = {
  products: "מוצרים ומלאי",
  orders: "הזמנות ומשלוחים",
  customers: "לקוחות",
  invoices: "חשבוניות",
  reports: "דוחות",
  providers: "ספקים",
} as const;

export type Permission = keyof typeof PERMISSIONS;

export const ALL_PERMISSIONS = Object.keys(PERMISSIONS) as Permission[];

export type StaffLike = { role: "admin" | "employee"; permissions: unknown; is_active: boolean };

export function parsePermissions(raw: unknown): Permission[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((p): p is Permission => ALL_PERMISSIONS.includes(p as Permission));
}

export function can(user: StaffLike | null, perm: Permission | "admin"): boolean {
  if (!user || !user.is_active) return false;
  if (user.role === "admin") return true;
  if (perm === "admin") return false;
  return parsePermissions(user.permissions).includes(perm);
}
