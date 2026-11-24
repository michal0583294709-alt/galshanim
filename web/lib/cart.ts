import "server-only";
import { cookies } from "next/headers";
import type { CartLine } from "@/lib/orders";

const COOKIE = "cart";

export async function readCart(): Promise<CartLine[]> {
  const raw = (await cookies()).get(COOKIE)?.value;
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as Record<string, number>;
    return Object.entries(parsed)
      .filter(([, q]) => Number.isInteger(q) && q > 0)
      .map(([variantId, quantity]) => ({ variantId, quantity }));
  } catch {
    return [];
  }
}

export async function writeCart(lines: CartLine[]) {
  const obj: Record<string, number> = {};
  for (const l of lines) if (l.quantity > 0) obj[l.variantId] = l.quantity;
  (await cookies()).set(COOKIE, JSON.stringify(obj), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearCart() {
  (await cookies()).delete(COOKIE);
}
