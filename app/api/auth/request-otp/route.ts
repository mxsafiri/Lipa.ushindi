import { NextRequest, NextResponse } from "next/server";
import { phoneIsValid } from "@/lib/util";

export const runtime = "nodejs";

/**
 * Mock OTP request. In production this would call Twilio Verify (or similar)
 * to send a real SMS. For now it just validates the phone and returns ok.
 */
export async function POST(req: NextRequest) {
  const { phone } = await req.json().catch(() => ({}));
  if (!phone || !phoneIsValid(phone)) {
    return NextResponse.json({ error: "invalid_phone" }, { status: 400 });
  }
  // Dev hint: the mock verify step accepts any 5-digit code.
  return NextResponse.json({ ok: true, dev_code: "42910" });
}
