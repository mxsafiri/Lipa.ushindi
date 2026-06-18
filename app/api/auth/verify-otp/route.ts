import { NextRequest, NextResponse } from "next/server";
import { upsertUser } from "@/lib/queries";
import { setSessionCookie } from "@/lib/session";
import { phoneIsValid } from "@/lib/util";

export const runtime = "nodejs";

/**
 * Mock OTP verification. Accepts any 5-digit code (swap for a real Twilio
 * Verify check later — only this handler changes). On success it finds/creates
 * the user in Neon and sets a signed session cookie.
 */
export async function POST(req: NextRequest) {
  const { phone, name, code } = await req.json().catch(() => ({}));

  if (!phone || !phoneIsValid(phone)) {
    return NextResponse.json({ error: "invalid_phone" }, { status: 400 });
  }
  if (!/^\d{5}$/.test(String(code ?? ""))) {
    return NextResponse.json({ error: "invalid_code" }, { status: 400 });
  }

  const cleanPhone = String(phone).replace(/\s/g, "");
  const displayName = (name && String(name).trim()) || "Player";

  try {
    const user = await upsertUser(cleanPhone, displayName);
    setSessionCookie({ id: user.id, name: user.name, phone: user.phone });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("verify-otp failed", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
