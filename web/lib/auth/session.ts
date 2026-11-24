import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

export type SessionKind = "customer" | "staff";

const COOKIE: Record<SessionKind, string> = { customer: "cust_session", staff: "staff_session" };
const MAX_AGE = 60 * 60 * 24 * 7; // שבוע

function key() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) throw new Error("SESSION_SECRET חסר או קצר מדי");
  return new TextEncoder().encode(secret);
}

export async function createSession(kind: SessionKind, userId: string) {
  const token = await new SignJWT({ kind })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(key());
  (await cookies()).set(COOKIE[kind], token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function readSession(kind: SessionKind): Promise<string | null> {
  const token = (await cookies()).get(COOKIE[kind])?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key());
    return payload.kind === kind && typeof payload.sub === "string" ? payload.sub : null;
  } catch {
    return null;
  }
}

export async function destroySession(kind: SessionKind) {
  (await cookies()).delete(COOKIE[kind]);
}
