import { NextRequest, NextResponse } from "next/server";
import { addReceipt } from "@/lib/queries";
import { getSession } from "@/lib/session";
import { normalizeCode } from "@/lib/util";

export const runtime = "nodejs";

/**
 * Add a receipt. Body: { raw: string, imageHash?: string }
 *  - `raw` is the scanned QR payload or manually-typed code.
 * The integrity guard (unique code + per-user image hash) lives in addReceipt.
 */
export async function POST(req: NextRequest) {
  const session = getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { raw, imageHash } = await req.json().catch(() => ({}));
  if (!raw || typeof raw !== "string") {
    return NextResponse.json({ error: "missing_code" }, { status: 400 });
  }

  const code = normalizeCode(raw);
  if (code.length < 3) {
    return NextResponse.json({ error: "invalid_code" }, { status: 400 });
  }

  try {
    const result = await addReceipt(session.id, code, imageHash ?? null);
    return NextResponse.json(result);
  } catch (e) {
    console.error("add receipt failed", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
