import { Field, Notice } from "@/components/ui";
import { staffLoginAction } from "../auth-actions";

export default async function StaffLoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return (
    <div className="min-h-screen flex items-center justify-center bg-ink px-4">
      <div className="card w-full max-w-sm">
        <h1 className="h1 mb-1">מערכת ניהול</h1>
        <p className="text-sm text-muted mb-6">כניסת צוות</p>
        <Notice error={error} />
        <form action={staffLoginAction} className="space-y-4">
          <Field label="מייל" name="email" type="email" required dir="ltr" />
          <Field label="סיסמה" name="password" type="password" required dir="ltr" />
          <button className="btn w-full">כניסה</button>
        </form>
      </div>
    </div>
  );
}
