import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

// Lazily construct the Neon client so that simply importing this module during
// `next build` (page-data collection) never touches the connection string.
// The real DATABASE_URL is read on the first query, at runtime.
let client: NeonQueryFunction<false, false> | null = null;

function getClient(): NeonQueryFunction<false, false> {
  if (!client) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("DATABASE_URL is not set — set it in your Netlify env vars.");
    }
    client = neon(connectionString);
  }
  return client;
}

// A callable proxy that supports both usages of the neon function:
//   sql`select ...`            (tagged template)
//   sql("select ...", params)  (plain string)
export const sql = ((...args: unknown[]) =>
  // @ts-expect-error — forwarding both overloads to the underlying client
  getClient()(...args)) as NeonQueryFunction<false, false>;
