import { randomBytes, scryptSync, timingSafeEqual } from "crypto";

// PIN hashing for the phone + 5-digit-PIN login.
//
// A 5-digit PIN is only 100,000 combinations, so the raw PIN is NEVER stored —
// we keep a salted scrypt hash, and the login route adds per-account lockout so
// the small keyspace can't be brute-forced online.

const KEYLEN = 64;
const COST = 16384; // scrypt N (work factor)

/** A PIN is exactly 5 numeric digits. */
export function isValidPin(pin: string): boolean {
  return /^\d{5}$/.test(pin);
}

/** Hash a PIN as `saltHex:hashHex`. Never store the raw PIN. */
export function hashPin(pin: string): string {
  const salt = randomBytes(16);
  const derived = scryptSync(pin, salt, KEYLEN, { N: COST });
  return `${salt.toString("hex")}:${derived.toString("hex")}`;
}

/** Constant-time verify a PIN against a stored `saltHex:hashHex`. */
export function verifyPin(pin: string, stored: string): boolean {
  const [saltHex, hashHex] = stored.split(":");
  if (!saltHex || !hashHex) return false;
  const salt = Buffer.from(saltHex, "hex");
  const expected = Buffer.from(hashHex, "hex");
  const derived = scryptSync(pin, salt, expected.length, { N: COST });
  return derived.length === expected.length && timingSafeEqual(derived, expected);
}
