import { NextRequest, NextResponse } from "next/server";
import { getUserByPhone, recordFailedAttempt, resetFailedAttempts } from "@/lib/queries";
import { setSessionCookie } from "@/lib/session";
import { phoneIsValid } from "@/lib/util";
import { isValidPin, verifyPin } from "@/lib/pin";

export const runtime = "nodejs";

/**
 * Sign in with { phone, pin }. Wrong tries are counted and the account is
 * temporarily locked after the limit, so the 5-digit PIN can't be brute-forced.
 * Responses are deliberately uniform so we don't leak which numbers exist.
 */
export async function POST(req: NextRequest) {
  const { phone, pin } = await req.json().catch(() => ({}));
  const cleanPhone = String(phone ?? "").replace(/\s/g, "");
  const p = String(pin ?? "");

  if (!phoneIsValid(cleanPhone) || !isValidPin(p)) {
    return NextResponse.json({ error: "invalid_credentials" }, { status: 401 });
  }

  try {
    const user = await getUserByPhone(cleanPhone);
    if (!user) return NextResponse.json({ error: "invalid_credentials" }, { status: 401 });

    if (user.locked_until && new Date(user.locked_until).getTime() > Date.now()) {
      return NextResponse.json({ error: "locked" }, { status: 423 });
    }

    if (!verifyPin(p, user.pin_hash)) {
      const { locked } = await recordFailedAttempt(user.id);
      return NextResponse.json(
        { error: locked ? "locked" : "invalid_credentials" },
        { status: locked ? 423 : 401 }
      );
    }

    await resetFailedAttempts(user.id);
    setSessionCookie({ id: user.id, username: user.username, phone: user.phone, is_admin: user.is_admin });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("login failed", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
