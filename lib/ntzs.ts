// nTZS (NEDA Pay) disbursement client.
//
// Pays nTZS out to a recipient's mobile-money number via the WaaS partner
// withdrawals endpoint. Matched to the open-source nTZS server contract
// (apps/web/src/app/api/v1/withdrawals/route.ts):
//
//   POST {BASE}/api/v1/withdrawals
//   Authorization: Bearer <NTZS_API_KEY>
//   { userId, amountTzs, phoneNumber }
//     - userId      = your source nTZS account (the wallet that gets burned)
//     - amountTzs   = integer TZS
//     - phoneNumber = recipient's mobile-money number
//   -> { id, status: 'requested'|'burn_submitted'|'burned'|'failed', ... }
//
// Inert until NTZS_API_BASE + NTZS_API_KEY + NTZS_USER_ID are set, so the
// manual payout path is unaffected. Sandbox-test a small amount first.

const BASE = process.env.NTZS_API_BASE || "https://www.ntzs.co.tz";
const KEY = process.env.NTZS_API_KEY; // partner API key (Bearer)
const USER_ID = process.env.NTZS_USER_ID; // source nTZS account id to burn from

export function ntzsConfigured(): boolean {
  return Boolean(BASE && KEY && USER_ID);
}

export type DisburseInput = { phone: string; amount: number; reference: string; note?: string };
export type DisburseResult =
  | { ok: true; reference: string; status: string; raw: unknown }
  | { ok: false; error: string; status?: number; raw?: unknown };

function buildRequest(input: DisburseInput): { url: string; init: RequestInit } {
  return {
    url: `${BASE}/api/v1/withdrawals`,
    init: {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${KEY}` },
      body: JSON.stringify({
        userId: USER_ID,
        amountTzs: Math.trunc(input.amount),
        phoneNumber: input.phone,
      }),
    },
  };
}

function parseResult(raw: Record<string, unknown>, fallbackRef: string): { reference: string; status: string } {
  // The server returns the burn-request `id`; the settlement webhook later
  // references it as data.metadata.burn_request_id.
  return {
    reference: String(raw.id ?? fallbackRef),
    status: String(raw.status ?? "requested"),
  };
}

export async function disburse(input: DisburseInput): Promise<DisburseResult> {
  if (!ntzsConfigured()) return { ok: false, error: "not_configured" };
  try {
    const { url, init } = buildRequest(input);
    const res = await fetch(url, init);
    const raw = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (!res.ok) return { ok: false, error: "provider_error", status: res.status, raw };
    const { reference, status } = parseResult(raw, input.reference);
    if (status === "failed") return { ok: false, error: "burn_failed", raw };
    return { ok: true, reference, status, raw };
  } catch (e) {
    return { ok: false, error: "network_error", raw: String(e) };
  }
}

/** Provider/webhook status strings that mean the payout fully settled / failed. */
export function isSettled(status: string): boolean {
  return /completed|settled|success|paid/i.test(status);
}
export function isFailed(status: string): boolean {
  return /failed|reject|cancel|reversed|declin/i.test(status);
}

// --- Deposits: fund treasury liquidity via mobile money ----------------------
// Only NTZS_API_KEY is required (base URL defaults above).
export type DepositInput = { amountTzs: number; phoneNumber: string };
export type DepositResult =
  | { ok: true; id: string; status: string; instructions: string; raw: unknown }
  | { ok: false; error: string; status?: number; raw?: unknown };

export function ntzsDepositConfigured(): boolean {
  return Boolean(KEY);
}

/**
 * Top up the partner treasury via an M-Pesa STK push. Matched to
 * apps/web/.../api/v1/partners/fund-treasury (body { amountTzs, phoneNumber }).
 * If your live deposit endpoint differs, this is the one spot to adjust.
 */
export async function fundTreasury(input: DepositInput): Promise<DepositResult> {
  if (!KEY) return { ok: false, error: "not_configured" };
  try {
    const res = await fetch(`${BASE}/api/v1/partners/fund-treasury`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${KEY}` },
      body: JSON.stringify({ amountTzs: Math.trunc(input.amountTzs), phoneNumber: input.phoneNumber }),
    });
    const raw = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (!res.ok) return { ok: false, error: String(raw.error ?? "provider_error"), status: res.status, raw };
    return {
      ok: true,
      id: String(raw.id ?? ""),
      status: String(raw.status ?? "submitted"),
      instructions: String(raw.instructions ?? "Check your phone for the M-Pesa payment prompt."),
      raw,
    };
  } catch (e) {
    return { ok: false, error: "network_error", raw: String(e) };
  }
}
