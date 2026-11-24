import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

const COLOR_FILE: Record<string, string> = {
  כחול: "blue", לבן: "white", אדום: "red", ירוק: "green", צהוב: "yellow", שחור: "black",
};

const products = [
  { name: "Longboard קלאסי", price: 2400, desc: "גלשן ארוך ויציב, מתאים לבתי ספר ולמתחילים.", sizes: ["9'0", "9'6"], colors: ["כחול", "לבן"], materials: ["PU", "Epoxy"] },
  { name: "Shortboard ביצועים", price: 1950, desc: "גלשן קצר ומהיר לגולשים מנוסים.", sizes: ["5'10", "6'2", "6'6"], colors: ["אדום", "שחור"], materials: ["Epoxy"] },
  { name: "Soft-top לימוד", price: 890, desc: "גלשן ספוג בטיחותי ללימוד ולהשכרה.", sizes: ["7'0", "8'0"], colors: ["צהוב", "ירוק", "כחול"], materials: ["Foam"] },
  { name: "Funboard משפחתי", price: 1650, desc: "גלשן ביניים נוח לכל המשפחה.", sizes: ["7'6"], colors: ["ירוק", "לבן"], materials: ["PU"] },
];

async function main() {
  if ((await db.staffUser.count()) > 0) {
    console.log("כבר קיימים משתמשים – דילוג על seed");
    return;
  }
  const pw = (p: string) => bcrypt.hash(p, 12);
  const demo = process.env.SEED_DEMO === "1";
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (adminEmail && adminPassword) {
    if (adminPassword.length < 8) throw new Error("ADMIN_PASSWORD צריך להכיל לפחות 8 תווים");
    await db.staffUser.create({
      data: { full_name: "מנהלת המערכת", email: adminEmail, password_hash: await pw(adminPassword), role: "admin" },
    });
    console.log(`נוצר משתמש מנהלת: ${adminEmail}`);
  } else if (demo) {
    await db.staffUser.create({
      data: { full_name: "מנהלת המערכת", email: "admin@galshanim.local", password_hash: await pw("admin1234"), role: "admin" },
    });
  } else {
    console.log("לא הוגדרו ADMIN_EMAIL ו-ADMIN_PASSWORD – לא נוצר משתמש מנהלת");
    return;
  }

  if (!demo) {
    console.log("seed הושלם (ללא נתוני דוגמה)");
    return;
  }

  await db.staffUser.create({
    data: { full_name: "עובד מחסן", email: "warehouse@galshanim.local", password_hash: await pw("employee1234"), role: "employee", permissions: ["products", "orders"] },
  });

  let stock = 3;
  for (const p of products) {
    const variants = p.sizes.flatMap((size) =>
      p.colors.flatMap((color) => p.materials.map((material) => ({ size, color, material, stock_quantity: (stock = (stock * 7) % 23) }))),
    );
    await db.product.create({
      data: {
        name: p.name,
        description: p.desc,
        price: p.price,
        variants: { create: variants },
        images: {
          create: p.colors.flatMap((color) =>
            [1, 2].map((n) => ({ color, image_url: `/boards/${COLOR_FILE[color]}-${n}.svg`, sort_order: n })),
          ),
        },
      },
    });
  }

  await db.customer.createMany({
    data: [
      { business_name: "גלישה בים בע\"מ", business_tax_id: "514000001", contact_name: "יוסי כהן", email: "shop@example.com", phone: "050-0000001", password_hash: await pw("customer1234"), customer_type: "surf_shop", address: "רח' הים 1, תל אביב", is_net_terms_approved: true, net_terms_days: 30 },
      { business_name: "בית ספר גל כחול", business_tax_id: "514000002", contact_name: "דוד לוי", email: "school@example.com", password_hash: await pw("customer1234"), customer_type: "surf_school", address: "חוף הצוק, נתניה" },
    ],
  });

  await db.provider.createMany({
    data: [
      { type: "shipping", name: "חברת שילוח (דוגמה)", notes: "להחליף בספק האמיתי" },
    ],
  });

  console.log("seed הושלם");
}

main().finally(() => db.$disconnect());
