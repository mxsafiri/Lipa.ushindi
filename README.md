# Risiti · Receipt Rally (Lipa Ushindi)

A receipt-leaderboard promo app. Scan a receipt's QR, store its **unique
verification code**, climb the leaderboard, earn prize-draw entries. The
leaderboard is ranked by the **count of unique receipts** — more genuine
receipts = higher rank — so it's clean and hard to game even before TRA
verification is wired in.

**Stack:** Next.js 14 (App Router) · Tailwind CSS · Neon (Postgres) · Netlify.

## The integrity guard

The whole thing stays honest on one idea: a receipt is counted **once, ever**.

1. **Unique QR code** — the receipt's verification code is read client-side,
   normalised, and stored with a `UNIQUE` constraint. Submit the same receipt
   twice → rejected as a duplicate.
2. **Perceptual image hash** — an average-hash (aHash) of the captured frame is
   stored too, so the same photo re-uploaded is caught even if the code read
   fails.

When TRA's "simple API" lands, it verifies against the exact same code — so the
upgrade is a drop-in in `lib/queries.ts` / the receipts route, not a rewrite.

## Local development

```bash
npm install
cp .env.example .env          # then fill in DATABASE_URL + SESSION_SECRET
npm run db:init               # creates schema + seeds a demo leaderboard
npm run dev                   # http://localhost:3000
```

Sign-in is **phone + a 5-digit PIN** — no SMS. Create an account with a
username + phone + PIN, or sign in with phone + PIN. PINs are stored as a
salted scrypt hash (`lib/pin.ts`) and the login route locks an account after
repeated wrong tries. Forgotten PINs are reset by support (admin-side).
The seed (`npm run db:init`) creates demo accounts whose PIN is `12345`.

## Database

Neon Postgres. Schema in `db/schema.sql`, applied + seeded by `npm run db:init`.

- `users` — id, phone (unique, private payout number), username (unique, public), pin_hash, lockout fields
- `receipts` — id, user_id, **code (unique)**, image_hash, created_at

## Deploy on Netlify (auto-deploy from `main`)

1. In Netlify: **Add new site → Import from Git** → pick this repo.
2. Build settings are read from `netlify.toml` (no changes needed).
3. Set **environment variables** (Site settings → Environment):
   - `DATABASE_URL` — your Neon pooled connection string
   - `SESSION_SECRET` — `openssl rand -base64 32`
4. Run the one-time DB setup against Neon (locally or a Netlify build hook):
   `DATABASE_URL=... npm run db:init`
5. Every `git push` to `main` triggers a deploy automatically.

## Screens

1. **Sign in** — phone + 5-digit PIN (new players also pick a username)
2. **Capture receipt** — live QR scan (jsQR) + gallery upload + manual entry
3. **Receipt verified** — success ticket with the coral integrity-guard box
4. **Leaderboard** — ranked by unique receipts, This week / All time, your-rank highlight
5. **Home** — entries hero + recent receipts
6. **Prize draw** — grand prize, countdown, your tickets, ways to earn entries
