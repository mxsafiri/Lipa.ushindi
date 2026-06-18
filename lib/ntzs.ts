// nTZS (NEDA Pay) disbursement client.
//
// Sends nTZS / TZS to a recipient's mobile-money number via the WaaS partner
// "withdrawals" endpoint. It stays INERT until the env vars are set, so the
// admin's manual payout path is unaffected until you switch this on.
//
// ⚠️ CONFIRM AGAINST https://www.ntzs.co.tz/developers#withdrawals before going
// live: the exact base URL, the request field names (recipient identifier,
// amount, currency, reference, callback), the auth header, and the response
// field names. Those are isolated to `buildRequest()` / `parseResult()` below
// so finalizing is a one-spot change. Test in sandbox first.

const BASE = process.env.NTZS_API_BASE; // e.g. https://api.ntzs.co.tz (confirm)
const KEY = process.env.NTZS_API_KEY; // partner API key
const CALLBACK = process.env.NTZS_CALLBACK_URL; // your /api/webhooks/ntzs URL

export function ntzsConfigured(): boolean {
  return Boolean(BASE && KEY);
}

export type DisburseInput = { phone: string; amount: number; reference: string; note?: string };
export type DisburseResult =
  | { ok: true; reference: string; status: string; raw: unknown }
  | { ok: false; error: string; status?: number; raw?: unknown };

// --- contract-specific (adjust to match the nTZS withdrawals docs) -----------
function buildRequest(input: DisburseInput): { url: string; init: RequestInit } {
  return {
    url: `${BASE}/api/v1/withdrawals`,
    init: {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${KEY}` },
      body: JSON.stringify({
        phone: input.phone, // recipient mobile-money number
        amount: input.amount,
        currency: "TZS",
        reference: input.reference, // we use `award-<id>` so the webhook can match
        narration: input.note ?? "Risiti prize",
        ...(CALLBACK ? { callback_url: CALLBACK } : {}),
      }),
    },
  };
}

function parseResult(raw: Record<string, unknown>, fallbackRef: string): { reference: string; status: string } {
  return {
    reference: String(raw.reference ?? raw.id ?? raw.transactionId ?? fallbackRef),
    status: String(raw.status ?? raw.state ?? "processing"),
  };
}
// -----------------------------------------------------------------------------

export async function disburse(input: DisburseInput): Promise<DisburseResult> {
  if (!ntzsConfigured()) return { ok: false, error: "not_configured" };
  try {
    const { url, init } = buildRequest(input);
    const res = await fetch(url, init);
    const raw = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (!res.ok) return { ok: false, error: "provider_error", status: res.status, raw };
    const { reference, status } = parseResult(raw, input.reference);
    return { ok: true, reference, status, raw };
  } catch (e) {
    return { ok: false, error: "network_error", raw: String(e) };
  }
}

/** True when a provider status string means the payout has fully settled. */
export function isSettled(status: string): boolean {
  return /success|complete|paid|settled|approved/i.test(status);
}
export function isFailed(status: string): boolean {
  return /fail|reject|cancel|declin/i.test(status);
}
