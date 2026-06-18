/**
 * One-time database setup + demo seed.
 *   DATABASE_URL=postgres://... npm run db:init
 *
 * Creates the schema and populates a demo leaderboard roster so the deployed
 * app looks alive immediately. Re-runnable: it won't duplicate seed users.
 * Every demo account uses the PIN 12345 (sign in with its phone number).
 */
import { neon } from "@neondatabase/serverless";
import { readFileSync } from "fs";
import { join } from "path";
import { hashPin } from "../lib/pin";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("✗ DATABASE_URL is not set. Export it and re-run.");
  process.exit(1);
}
const sql = neon(url);

const DEMO_PIN = "12345";

// Demo competitors — usernames + weekly receipt counts straight from the design.
const ROSTER: { phone: string; username: string; count: number }[] = [
  { phone: "+255700000001", username: "Neema Joseph", count: 41 },
  { phone: "+255700000002", username: "Baraka Mushi", count: 38 },
  { phone: "+255700000003", username: "Zawadi Said", count: 35 },
  { phone: "+255700000004", username: "Juma Rashid", count: 31 },
  { phone: "+255700000005", username: "Fatma Mohamed", count: 29 },
  { phone: "+255700000006", username: "Halima Ally", count: 27 },
  { phone: "+255700000007", username: "Salama Omary", count: 26 },
  { phone: "+255700000008", username: "Tatu Bakari", count: 25 },
  { phone: "+255700000009", username: "Rehema Hassan", count: 25 },
  { phone: "+255700000010", username: "Mwajuma Iddi", count: 24 },
  { phone: "+255700000011", username: "Asha Komba", count: 24 },
  { phone: "+255700000012", username: "Daudi Ngwale", count: 24 },
  { phone: "+255700000013", username: "Upendo Kile", count: 23 },
];

async function main() {
  const schema = readFileSync(join(process.cwd(), "db", "schema.sql"), "utf8");
  // neon http driver runs one statement per call; split on ; safely.
  for (const stmt of schema.split(/;\s*$/m).map((s) => s.trim()).filter(Boolean)) {
    await sql(stmt);
  }
  console.log("✓ schema ready");

  const pinHash = hashPin(DEMO_PIN);
  for (const u of ROSTER) {
    const rows = (await sql`
      insert into users (phone, username, pin_hash)
      values (${u.phone}, ${u.username}, ${pinHash})
      on conflict (phone) do update set username = excluded.username
      returning id
    `) as { id: number }[];
    const id = rows[0].id;

    const have = (await sql`select count(*)::int as n from receipts where user_id = ${id}`) as {
      n: number;
    }[];
    const need = u.count - (have[0]?.n ?? 0);
    for (let i = 0; i < need; i++) {
      const code = `SEED-${u.phone.slice(-4)}-${Date.now()}-${i}`;
      // Spread created_at across the current week so day/week filters work.
      await sql`
        insert into receipts (user_id, code, created_at)
        values (${id}, ${code}, now() - (random() * interval '5 days'))
        on conflict (code) do nothing
      `;
    }
  }
  console.log(`✓ seeded ${ROSTER.length} demo collectors (every demo account's PIN is ${DEMO_PIN})`);
  console.log("Done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
