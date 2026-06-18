import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

// Lazily construct the Neon client so that simply importing this module during
// `next build` (page-data collection) never touches the connection string.
// The real DATABASE_URL is read on the first query, at runtime.
let client: NeonQueryFunction<false, false> | null = null;

/**
 * Normalise a connection string. Neon's dashboard offers a "psql" snippet like
 *   psql 'postgresql://user:pass@host/db?...'
 * which is easy to paste into an env var by mistake. Strip the `psql ` prefix
 * and any surrounding quotes/whitespace so either form works.
 */
function cleanConnectionString(raw: string): string {
  let s = raw.trim();
  if (s.toLowerCase().startsWith("psql ")) s = s.slice(5).trim();
  if ((s.startsWith("'") && s.endsWith("'")) || (s.startsWith('"') && s.endsWith('"'))) {
    s = s.slice(1, -1).trim();
  }
  return s;
}

function getClient(): NeonQueryFunction<false, false> {
  if (!client) {
    const raw = process.env.DATABASE_URL;
    if (!raw) {
      throw new Error("DATABASE_URL is not set — set it in your Netlify env vars.");
    }
    client = neon(cleanConnectionString(raw));
  }
  return client;
}

// A callable proxy that supports both usages of the neon function:
//   sql`select ...`            (tagged template)
//   sql("select ...", params)  (plain string)
export const sql = ((...args: unknown[]) =>
  // @ts-expect-error — forwarding both overloads to the underlying client
  getClient()(...args)) as NeonQueryFunction<false, false>;
