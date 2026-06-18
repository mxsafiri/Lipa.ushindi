import { cookies } from "next/headers";
import crypto from "crypto";

const COOKIE = "risiti_session";
const SECRET = process.env.SESSION_SECRET || "dev-insecure-secret-change-me";

export type SessionUser = { id: number; name: string; phone: string };

function sign(payload: string): string {
  return crypto.createHmac("sha256", SECRET).update(payload).digest("base64url");
}

/** Create a tamper-evident cookie value: base64(json).signature */
export function encodeSession(user: SessionUser): string {
  const payload = Buffer.from(JSON.stringify(user)).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function decodeSession(value: string | undefined): SessionUser | null {
  if (!value) return null;
  const [payload, sig] = value.split(".");
  if (!payload || !sig) return null;
  if (sign(payload) !== sig) return null;
  try {
    return JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  } catch {
    return null;
  }
}

export function setSessionCookie(user: SessionUser) {
  cookies().set(COOKIE, encodeSession(user), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export function clearSessionCookie() {
  cookies().delete(COOKIE);
}

export function getSession(): SessionUser | null {
  return decodeSession(cookies().get(COOKIE)?.value);
}

export const SESSION_COOKIE = COOKIE;
