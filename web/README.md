# גלשנים – אפליקציית האתר ומערכת הניהול

Next.js 15 (App Router) · TypeScript · PostgreSQL · Prisma · Tailwind (RTL)

## הרצה מקומית

דרישות: Node 22, PostgreSQL 16.

```bash
cp .env.example .env        # לעדכן DATABASE_URL, DIRECT_URL, SESSION_SECRET; SEED_DEMO=1 לנתוני דוגמה
npm install
npx prisma migrate deploy   # יצירת הטבלאות
npm run db:seed             # נתוני דוגמה
npm run dev                 # http://localhost:3000
```

## העלאה לאוויר ב-Netlify

הקוד כבר מוכן ל-Netlify (`netlify.toml`). תמונות שמעלים נשמרות ב-Netlify Blobs, ומסד הנתונים הוא PostgreSQL ב-Neon.

1. **מסד נתונים – Neon:** נכנסים ל-https://neon.tech, נרשמים (אפשר עם GitHub) ← *New Project* (אזור: Europe/Frankfurt) ← *Connect*. מעתיקים שתי כתובות:
   - עם *Connection pooling* מופעל (בכתובת מופיע `-pooler`) ← זו `DATABASE_URL`
   - עם *Connection pooling* כבוי ← זו `DIRECT_URL`
2. **Netlify:** נכנסים ל-https://app.netlify.com, נרשמים עם GitHub ← *Add new project* ← *Import an existing project* ← GitHub ← בוחרים את המאגר `galshanim`.
3. **הגדרות build:**
   - *Branch to deploy:* `claude/elegant-brahmagupta-zxfmlf` (או `main` אחרי מיזוג)
   - *Base directory:* `web`
   - שאר השדות נלקחים מ-`netlify.toml`
4. **Environment variables** (באותו מסך, או אחר כך ב-*Project configuration → Environment variables*):

   | שם | ערך |
   |---|---|
   | `DATABASE_URL` | כתובת ה-Pooled מ-Neon |
   | `DIRECT_URL` | כתובת ה-Direct מ-Neon |
   | `SESSION_SECRET` | מחרוזת אקראית של 32 תווים ומעלה |
   | `ADMIN_EMAIL` | המייל של המנהלת |
   | `ADMIN_PASSWORD` | סיסמת המנהלת (8 תווים ומעלה) |
   | `SEED_DEMO` | `1` אם רוצים מוצרים ולקוחות לדוגמה, אחרת `0` |

5. **Deploy.** בכל deploy רצות המיגרציות של מסד הנתונים. משתמש המנהלת נוצר רק בפעם הראשונה.
6. נכנסים ל-`https://<שם-האתר>.netlify.app/admin/login` עם המייל והסיסמה שהוגדרו.
7. דומיין משלכם (אופציונלי): *Domain management → Add a domain*.

## משתמשי דוגמה (כשמריצים seed עם SEED_DEMO=1 ובלי ADMIN_EMAIL)

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
- `lib/uploads.ts` – שמירת תמונות: Netlify Blobs באתר החי, תיקיית `.uploads` מקומית
- `prisma/schema.prisma` – מודל הנתונים לפי ה-ERD
