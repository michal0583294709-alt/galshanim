import { requireStaff } from "@/lib/auth/current";
import { Notice } from "@/components/ui";
import { UserFields } from "../form";
import { createUserAction } from "../actions";

export default async function NewUserPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  await requireStaff("admin");
  const { error } = await searchParams;
  return (
    <div className="max-w-3xl card">
      <h1 className="h1 mb-4">עובד חדש</h1>
      <Notice error={error} />
      <form action={createUserAction} className="space-y-4">
        <UserFields />
        <button className="btn">הוספה</button>
      </form>
    </div>
  );
}
