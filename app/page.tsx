import Link from "next/link";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-[11px]">
      <div className="w-[38px] h-[38px] rounded-xl bg-amber flex items-center justify-center">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 6L9 17l-5-5" />
        </svg>
      </div>
      <span className="text-[21px] font-extrabold text-white tracking-[-.01em]">Risiti</span>
    </Link>
  );
}

const STEPS = [
  {
    n: "1",
    title: "Scan the receipt",
    body: "Point your camera at the QR on any genuine receipt. We read its verification code instantly — or type it in.",
  },
  {
    n: "2",
    title: "It counts once, ever",
    body: "Each unique code is locked in with an integrity guard, so no one can flood the board with copies. Fair play, by design.",
  },
  {
    n: "3",
    title: "Climb & win",
    body: "Every verified receipt lifts your rank and adds a ticket to the weekly prize draw. More genuine receipts, better odds.",
  },
];

export default function Landing() {
  const session = getSession();
  const ctaHref = session ? "/home" : "/signin";
  const ctaLabel = session ? "Open the app" : "Get started";

  return (
    <main className="relative min-h-[100dvh] w-full overflow-hidden bg-forest text-white">
      {/* backdrop */}
      <div className="pointer-events-none absolute inset-0">
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(120% 80% at 85% -10%, rgba(82,177,106,.45), transparent 55%), radial-gradient(90% 70% at 0% 0%, rgba(16,42,27,.6), transparent 60%)",
          }}
        />
        <div className="absolute -top-24 -right-24 h-[320px] w-[320px] rounded-full bg-leaf/20 blur-3xl" />
        <div className="absolute bottom-0 -left-20 h-[280px] w-[280px] rounded-full bg-amber/10 blur-3xl" />
      </div>

      <div className="relative mx-auto w-full max-w-6xl px-6 sm:px-8">
        {/* nav */}
        <header className="flex items-center justify-between py-6">
          <Logo />
          <Link
            href={ctaHref}
            className="rounded-full px-5 py-[10px] text-[14px] font-bold text-white/90 transition hover:text-white"
            style={{ border: "1.5px solid rgba(255,255,255,.22)" }}
          >
            {session ? "Open app" : "Sign in"}
          </Link>
        </header>

        {/* hero */}
        <section className="relative grid items-center gap-10 pb-16 pt-6 lg:grid-cols-2 lg:gap-10 lg:pb-24 lg:pt-12">
          {/* celebratory confetti, concentrated on the right around the mockup */}
          <svg
            viewBox="0 0 1920 1080"
            preserveAspectRatio="xMidYMid slice"
            aria-hidden
            className="pointer-events-none absolute inset-0 z-0 h-full w-full opacity-90"
          >
            {/* flowing ribbon streamers */}
            <g fill="none" strokeWidth={8} strokeLinecap="round" opacity={0.5}>
              <path d="M1280 -40 C 1230 160, 1360 280, 1280 470" stroke="#7BD897" strokeWidth={6} />
              <path d="M1560 -40 C 1640 200, 1480 360, 1600 580 S 1700 840, 1580 1120" stroke="#52B16A" />
              <path d="M1860 40 C 1780 240, 1900 400, 1820 620 S 1740 880, 1850 1060" stroke="#EFA03C" />
            </g>
            {/* little squiggles */}
            <g opacity={0.6} strokeWidth={5} strokeLinecap="round" fill="none">
              <path d="M1330 120 q 20 -24 40 0 t 40 0" stroke="#fff" />
              <path d="M1700 220 q 20 26 40 0 t 40 0" stroke="#3FA9D6" />
              <path d="M1500 880 q 20 -24 40 0 t 40 0" stroke="#fff" />
            </g>
            {/* squares, dots & triangles */}
            <g opacity={0.75}>
              <rect x="1300" y="80" width="20" height="20" rx="3" fill="#3FA9D6" transform="rotate(18 1310 90)" />
              <rect x="1740" y="120" width="20" height="20" rx="3" fill="#E04646" transform="rotate(-12 1750 130)" />
              <rect x="1620" y="60" width="18" height="18" rx="3" fill="#EFA03C" />
              <rect x="1840" y="300" width="20" height="20" rx="3" fill="#7BD897" transform="rotate(22 1850 310)" />
              <rect x="1280" y="360" width="18" height="18" rx="3" fill="#cfd8d2" transform="rotate(14 1289 369)" />
              <rect x="1700" y="900" width="20" height="20" rx="3" fill="#52B16A" transform="rotate(-16 1710 910)" />
              <circle cx="1380" cy="60" r="9" fill="#52B16A" />
              <circle cx="1800" cy="180" r="8" fill="#EFA03C" />
              <circle cx="1300" cy="240" r="8" fill="#E04646" />
              <circle cx="1870" cy="500" r="9" fill="#3FA9D6" />
              <circle cx="1560" cy="940" r="8" fill="#EFA03C" />
              <path d="M1450 90 l22 13 l-22 13 z" fill="#EFA03C" />
              <path d="M1830 760 l-18 -13 l0 26 z" fill="#E04646" />
              <path d="M1340 820 l22 13 l-22 13 z" fill="#3FA9D6" />
            </g>
          </svg>

          <div className="relative z-10">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-[14px] py-[7px] text-[12.5px] font-semibold text-white/85 ring-1 ring-white/15">
              <span className="h-[7px] w-[7px] rounded-full bg-leaf" />
              Receipt Rally · Tanzania
            </span>

            <h1 className="mt-5 text-[38px] font-extrabold leading-[1.04] tracking-[-.03em] sm:text-[52px] lg:text-[60px]">
              Every receipt is a
              <span className="text-amber"> ticket to win.</span>
            </h1>

            <p className="mt-5 max-w-[30rem] text-[16px] leading-[1.6] text-white/75 sm:text-[17px]">
              Scan a receipt&apos;s QR, store its unique verification code, and climb a leaderboard
              that&apos;s impossible to game. Every genuine receipt is an entry into the weekly prize draw.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href={ctaHref}
                className="flex items-center justify-center gap-2 rounded-[18px] bg-leaf px-7 py-[17px] text-[16px] font-bold text-white transition active:scale-[.98]"
                style={{ boxShadow: "0 16px 30px -12px rgba(82,177,106,.85)" }}
              >
                {ctaLabel}
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 6l6 6-6 6" />
                </svg>
              </Link>
              <Link
                href="#how"
                className="flex items-center justify-center rounded-[18px] px-7 py-[17px] text-[15px] font-bold text-white/90 transition hover:bg-white/5"
                style={{ border: "1.5px solid rgba(255,255,255,.22)" }}
              >
                How it works
              </Link>
            </div>

            <div className="mt-8 flex items-start gap-[10px] text-[12.5px] text-white/65">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#52B16A" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="mt-[1px] flex-none">
                <path d="M12 3l7 3v5c0 5-3.5 8-7 9-3.5-1-7-4-7-9V6z" />
                <path d="M9 12l2 2 4-4" />
              </svg>
              <span>
                Integrity guard: a unique code &amp; image hash mean each receipt counts exactly once.
              </span>
            </div>
          </div>

          {/* phone preview (desktop only) */}
          <div className="relative z-10 hidden justify-center lg:flex">
            <PhonePreview />
          </div>
        </section>

        {/* how it works */}
        <section id="how" className="scroll-mt-8 pb-16 lg:pb-24">
          <div className="text-center">
            <div className="text-[12px] font-bold uppercase tracking-[.16em] text-leaf">How it works</div>
            <h2 className="mt-3 text-[28px] font-extrabold tracking-[-.02em] sm:text-[34px]">
              Three taps to the top
            </h2>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {STEPS.map((s) => (
              <div key={s.n} className="rounded-3xl bg-white/[.06] p-7 ring-1 ring-white/10">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-leaf text-[18px] font-extrabold text-white">
                  {s.n}
                </div>
                <div className="mt-5 text-[18px] font-extrabold">{s.title}</div>
                <p className="mt-2 text-[14px] leading-[1.6] text-white/70">{s.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* prize strip */}
        <section className="pb-20">
          <div
            className="relative overflow-hidden rounded-[28px] px-8 py-10 text-center sm:px-12 sm:py-12"
            style={{ background: "linear-gradient(135deg,#F4AE54,#EB9233)", boxShadow: "0 30px 60px -28px rgba(236,148,51,.8)" }}
          >
            <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/15" />
            <div className="relative">
              <div className="text-[13px] font-bold uppercase tracking-[.16em] text-white/85">This week&apos;s grand prize</div>
              <div className="mt-3 text-[44px] font-extrabold tracking-[-.02em] sm:text-[60px]">TZS 5,000,000</div>
              <p className="mx-auto mt-3 max-w-md text-[14.5px] text-white/90">
                Drawn every week. Every verified receipt is one ticket — start collecting today.
              </p>
              <Link
                href={ctaHref}
                className="mt-7 inline-flex items-center justify-center gap-2 rounded-[16px] bg-forest px-7 py-[15px] text-[15px] font-bold text-white transition active:scale-[.98]"
              >
                {ctaLabel}
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 6l6 6-6 6" />
                </svg>
              </Link>
            </div>
          </div>
        </section>

        {/* footer */}
        <footer className="flex flex-col items-center justify-between gap-4 border-t border-white/10 py-8 text-[13px] text-white/55 sm:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-amber">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6L9 17l-5-5" />
              </svg>
            </div>
            <span>Risiti · Receipt Rally</span>
          </div>
          <span>© {new Date().getFullYear()} Lipa Ushindi. Play fair, win big.</span>
        </footer>
      </div>
    </main>
  );
}

/** Static, decorative phone mock that teases the real app on the landing page. */
function PhonePreview() {
  const rows = [
    { r: 1, name: "Neema J.", initials: "NJ", c: "#52B16A", n: 32, you: true },
    { r: 2, name: "Baraka M.", initials: "BM", c: "#5B8DEF", n: 28 },
    { r: 3, name: "Tatu B.", initials: "TB", c: "#CE8A5B", n: 24 },
  ];
  return (
    <div
      className="animate-float w-[300px] rounded-[40px] bg-forest p-3"
      style={{ boxShadow: "0 50px 90px -30px rgba(0,0,0,.55), 0 0 0 1px rgba(255,255,255,.08)" }}
    >
      <div className="overflow-hidden rounded-[30px] bg-forest">
        <div className="px-5 pb-3 pt-6">
          <div className="text-[12px] text-white/65">Habari,</div>
          <div className="text-[18px] font-extrabold">Neema Joseph</div>
          <div
            className="mt-3 rounded-[20px] p-4"
            style={{ background: "linear-gradient(135deg,#F4AE54,#EB9233)" }}
          >
            <div className="text-[11.5px] font-semibold text-white/90">Draw entries this week</div>
            <div className="mt-1 text-[36px] font-extrabold leading-none">32</div>
            <div className="mt-2 text-[11px] text-white/90">Rank #1 · 41 unique receipts</div>
          </div>
        </div>
        <div className="rounded-t-[26px] bg-white px-4 pb-5 pt-4">
          <div className="mb-2 text-[10.5px] font-bold uppercase tracking-[.12em] text-muted-2">
            Leaderboard · this week
          </div>
          {rows.map((row) => (
            <div
              key={row.r}
              className={`mb-[6px] flex items-center gap-3 rounded-2xl px-3 py-[10px] ${
                row.you ? "bg-tint-green" : ""
              }`}
            >
              <span className="w-4 text-center text-[13px] font-extrabold text-ink">{row.r}</span>
              <span
                className="flex h-9 w-9 items-center justify-center rounded-xl text-[12px] font-extrabold text-white"
                style={{ background: row.c }}
              >
                {row.initials}
              </span>
              <span className="flex-1 text-[13.5px] font-bold text-ink">
                {row.you ? "You · " : ""}
                {row.name}
              </span>
              <span className="text-[15px] font-extrabold text-ink">{row.n}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
