import Link from "next/link";
import { Field, Notice } from "@/components/ui";
import { loginAction } from "../actions";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string; next?: string }> }) {
  const { error, next } = await searchParams;
  return (
    <div className="max-w-md mx-auto card">
      <h1 className="h1 mb-6">התחברות לקוחות</h1>
      <Notice error={error} />
      <form action={loginAction} className="space-y-4">
        <input type="hidden" name="next" value={next?.startsWith("/") ? next : ""} />
        <Field label="מייל" name="email" type="email" required dir="ltr" />
        <Field label="סיסמה" name="password" type="password" required dir="ltr" />
        <button className="btn w-full">כניסה</button>
      </form>
      <p className="text-sm text-muted mt-4">
        עדיין אין חשבון? <Link href="/register" className="link">הרשמה</Link>
      </p>
    </div>
  );
}
