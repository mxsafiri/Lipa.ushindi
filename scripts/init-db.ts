/**
 * One-time database setup + demo seed.
 *   DATABASE_URL=postgres://... npm run db:init
 *
 * Creates the schema and populates a demo leaderboard roster so the deployed
 * app looks alive immediately. Re-runnable: it won't duplicate seed users.
 */
import { neon } from "@neondatabase/serverless";
import { readFileSync } from "fs";
import { join } from "path";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("✗ DATABASE_URL is not set. Export it and re-run.");
  process.exit(1);
}
const sql = neon(url);

// Demo competitors — names + weekly receipt counts straight from the design.
const ROSTER: { phone: string; name: string; count: number }[] = [
  { phone: "+255700000001", name: "Neema Joseph", count: 41 },
  { phone: "+255700000002", name: "Baraka Mushi", count: 38 },
  { phone: "+255700000003", name: "Zawadi Said", count: 35 },
  { phone: "+255700000004", name: "Juma Rashid", count: 31 },
  { phone: "+255700000005", name: "Fatma Mohamed", count: 29 },
  { phone: "+255700000006", name: "Halima Ally", count: 27 },
  { phone: "+255700000007", name: "Salama Omary", count: 26 },
  { phone: "+255700000008", name: "Tatu Bakari", count: 25 },
  { phone: "+255700000009", name: "Rehema Hassan", count: 25 },
  { phone: "+255700000010", name: "Mwajuma Iddi", count: 24 },
  { phone: "+255700000011", name: "Asha Komba", count: 24 },
  { phone: "+255700000012", name: "Daudi Ng'wale", count: 24 },
  { phone: "+255700000013", name: "Upendo Kile", count: 23 },
];

async function main() {
  const schema = readFileSync(join(process.cwd(), "db", "schema.sql"), "utf8");
  // neon http driver runs one statement per call; split on ; safely.
  for (const stmt of schema.split(/;\s*$/m).map((s) => s.trim()).filter(Boolean)) {
    await sql(stmt);
  }
  console.log("✓ schema ready");

  for (const u of ROSTER) {
    const rows = (await sql`
      insert into users (phone, name) values (${u.phone}, ${u.name})
      on conflict (phone) do update set name = excluded.name
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
  console.log(`✓ seeded ${ROSTER.length} demo collectors`);
  console.log("Done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
