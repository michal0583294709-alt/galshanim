import { requireStaff } from "@/lib/auth/current";
import { can } from "@/lib/auth/permissions";
import { Notice } from "@/components/ui";
import { CustomerFields } from "../form";
import { createCustomerAction } from "../actions";

export default async function NewCustomerPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const me = await requireStaff("customers");
  const { error } = await searchParams;
  return (
    <div className="max-w-3xl card">
      <h1 className="h1 mb-4">לקוח חדש</h1>
      <Notice error={error} />
      <form action={createCustomerAction} className="space-y-4">
        <CustomerFields isAdmin={can(me, "admin")} />
        <button className="btn">יצירה</button>
      </form>
    </div>
  );
}
