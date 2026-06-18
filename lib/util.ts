/** Two-letter initials from a display name, e.g. "Amani Kessy" -> "AK". */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "··";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Normalise a raw QR / scanned string into a canonical verification code.
 * TRA receipt QRs encode a verification URL whose code is the last path or
 * query segment; we keep the meaningful token and upper-case it so the same
 * receipt always resolves to the same unique key.
 */
export function normalizeCode(raw: string): string {
  let v = raw.trim();
  try {
    if (/^https?:\/\//i.test(v)) {
      const u = new URL(v);
      // TRA verify URLs put the code in the query (?...=CODE) or final segment.
      const q = [...u.searchParams.values()].pop();
      const seg = u.pathname.split("/").filter(Boolean).pop();
      v = (q || seg || v).toString();
    }
  } catch {
    /* not a URL, use raw */
  }
  return v.replace(/\s+/g, "").toUpperCase();
}

/** Pretty-print a code into grouped blocks for display, e.g. TRA·9F3A·22K7·X. */
export function prettyCode(code: string): string {
  const clean = code.replace(/[^A-Z0-9]/gi, "").toUpperCase();
  if (clean.length <= 4) return clean;
  const groups: string[] = [];
  let i = 0;
  // Leading 3-letter prefix (TRA) reads nicely on its own.
  if (/^[A-Z]{3}/.test(clean)) {
    groups.push(clean.slice(0, 3));
    i = 3;
  }
  for (; i < clean.length; i += 4) {
    groups.push(clean.slice(i, i + 4));
  }
  return groups.join("·");
}

export function phoneIsValid(phone: string): boolean {
  return /^\+?\d{9,15}$/.test(phone.replace(/\s/g, ""));
}

/** Public display handle: 3–20 chars, letters/numbers/space/dot/underscore. */
export function usernameIsValid(name: string): boolean {
  const v = name.trim();
  return v.length >= 3 && v.length <= 20 && /^[A-Za-z0-9 ._]+$/.test(v);
}

const AVATAR_PALETTE = ["#5B8DEF", "#E45C5C", "#52B16A", "#8E63C9", "#3DAFA0", "#EFA03C", "#CE8A5B", "#D9719B"];

/** Deterministic avatar colour from a name, drawn from the design's palette. */
export function avatarColor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return AVATAR_PALETTE[h % AVATAR_PALETTE.length];
}
