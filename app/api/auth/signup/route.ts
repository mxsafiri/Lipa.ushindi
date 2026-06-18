import { NextRequest, NextResponse } from "next/server";
import { createUser } from "@/lib/queries";
import { setSessionCookie } from "@/lib/session";
import { phoneIsValid, usernameIsValid } from "@/lib/util";
import { hashPin, isValidPin } from "@/lib/pin";

export const runtime = "nodejs";

/**
 * Create an account: { phone, username, pin }.
 * phone (private, the M-Pesa payout number) and username (public) are UNIQUE.
 * The 5-digit PIN is hashed, never stored raw.
 */
export async function POST(req: NextRequest) {
  const { phone, username, pin } = await req.json().catch(() => ({}));
  const cleanPhone = String(phone ?? "").replace(/\s/g, "");
  const name = String(username ?? "").trim();
  const p = String(pin ?? "");

  if (!phoneIsValid(cleanPhone)) return NextResponse.json({ error: "invalid_phone" }, { status: 400 });
  if (!usernameIsValid(name)) return NextResponse.json({ error: "invalid_username" }, { status: 400 });
  if (!isValidPin(p)) return NextResponse.json({ error: "invalid_pin" }, { status: 400 });

  try {
    const result = await createUser(cleanPhone, name, hashPin(p));
    if (result.status === "taken") {
      return NextResponse.json({ error: "taken", field: result.field }, { status: 409 });
    }
    setSessionCookie({ id: result.user.id, username: result.user.username, phone: result.user.phone });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("signup failed", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
