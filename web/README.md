# גלשנים – אפליקציית האתר ומערכת הניהול

Next.js 15 (App Router) · TypeScript · PostgreSQL · Prisma · Tailwind (RTL)

## הרצה מקומית

דרישות: Node 22, PostgreSQL 16.

```bash
cp .env.example .env        # לעדכן DATABASE_URL ו-SESSION_SECRET (32 תווים לפחות)
npm install
npx prisma migrate deploy   # יצירת הטבלאות
npm run db:seed             # נתוני דוגמה
npm run dev                 # http://localhost:3000
```

## משתמשי דוגמה (מה-seed)

| מי | כתובת | מייל | סיסמה |
|---|---|---|---|
| מנהלת | `/admin/login` | admin@galshanim.local | admin1234 |
| עובד (מוצרים + הזמנות) | `/admin/login` | warehouse@galshanim.local | employee1234 |
| לקוח מאושר לשוטף+30 | `/login` | shop@example.com | customer1234 |
| לקוח רגיל | `/login` | school@example.com | customer1234 |

**חשוב:** להחליף סיסמאות לפני העלאה לאוויר.

## בדיקות

```bash
npm test                  # בדיקות יחידה (חישוב סכומים ומשלוח)
npm run test:integration  # בדיקות מול מסד הנתונים (מלאי, הזמנות מקבילות, שוטף)
npm run lint && npm run typecheck
```

## מבנה

- `app/(shop)` – אתר הלקוחות: הרשמה, קטלוג, דף מוצר, עגלה, קופה, הזמנות, פרטי עסק
- `app/admin` – מערכת הניהול: דשבורד ודוחות, מוצרים ומלאי, הזמנות, לקוחות, ספקים, עובדים
- `lib/orders.ts` – יצירת הזמנה בטרנזקציה (נעילת מלאי), מעברי סטטוס, חשבוניות
- `lib/pricing.ts` – סכומים ודמי משלוח (300 ₪, חינם מעל 10,000 ₪)
- `lib/auth` – התחברות (cookie חתום), סיסמאות מוצפנות, הרשאות
- `lib/integrations/payments.ts` – ממשק לספק סליקה (כרגע תשלום מדומה)
- `lib/uploads.ts` – שמירת תמונות (כרגע מקומית; בפרודקשן להחליף לאחסון ענן)
- `prisma/schema.prisma` – מודל הנתונים לפי ה-ERD
