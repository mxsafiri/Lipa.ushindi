import Link from "next/link";
import { redirect } from "next/navigation";
import StatusBar from "@/components/StatusBar";
import BottomNav from "@/components/BottomNav";
import Avatar from "@/components/Avatar";
import { getSession } from "@/lib/session";
import { getStats, getRecentReceipts } from "@/lib/queries";
import { prettyCode } from "@/lib/util";

export const dynamic = "force-dynamic";

function whenLabel(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  const yest = new Date(now);
  yest.setDate(now.getDate() - 1);
  const isYest = d.toDateString() === yest.toDateString();
  const time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  const day = sameDay ? "Today" : isYest ? "Yesterday" : d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return `${day} · ${time}`;
}

export default async function Home() {
  const session = getSession();
  if (!session) redirect("/signin");

  const [stats, recent] = await Promise.all([
    getStats(session.id),
    getRecentReceipts(session.id, 6),
  ]);

  return (
    <div className="app-shell bg-forest flex flex-col min-h-[100dvh]">
      <StatusBar />

      <div className="flex items-center justify-between px-[26px] pt-4 pb-4">
        <div>
          <div className="text-[13px] text-white/70">Habari,</div>
          <div className="text-[21px] font-extrabold text-white tracking-[-.01em]">{session.username}</div>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/draw" className="w-[42px] h-[42px] rounded-[13px] flex items-center justify-center relative" style={{ border: "1.5px solid rgba(255,255,255,.2)" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 9a6 6 0 1 1 12 0c0 5 2 6 2 6H4s2-1 2-6z" />
              <path d="M10 21h4" />
            </svg>
            <div className="absolute top-[9px] right-[10px] w-2 h-2 rounded-full bg-amber" style={{ border: "2px solid #1C4A2A" }} />
          </Link>
          <Link href="/profile">
            <Avatar name={session.username} size={44} radius={14} bg="#52B16A" />
          </Link>
        </div>
      </div>

      {/* orange entries hero */}
      <div className="px-[26px] pb-[18px]">
        <div
          className="rounded-[24px] p-[22px] relative overflow-hidden"
          style={{ background: "linear-gradient(135deg,#F4AE54,#EB9233)", boxShadow: "0 18px 32px -14px rgba(236,148,51,.7)" }}
        >
          <div className="absolute -right-[30px] -top-[30px] w-[120px] h-[120px] rounded-full bg-white/10" />
          <div className="flex justify-between items-start relative">
            <div>
              <div className="text-[13px] font-semibold text-white/90">Your draw entries this week</div>
              <div className="text-[46px] font-extrabold text-white leading-[1.05] mt-[6px]">{stats.weekCount}</div>
            </div>
            <div className="w-[46px] h-[46px] rounded-[14px] bg-white/20 flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 4h12v4a6 6 0 0 1-12 0z" />
                <path d="M9 16h6M12 12v4" />
                <path d="M6 5H3v1a4 4 0 0 0 4 4M18 5h3v1a4 4 0 0 1-4 4" />
              </svg>
            </div>
          </div>
          <div className="flex gap-6 mt-5 relative">
            <div className="text-[13px] text-white">Rank <span className="font-extrabold">#{stats.rank ?? "—"}</span></div>
            <div className="text-[13px] text-white">Unique receipts <span className="font-extrabold">{stats.allCount}</span></div>
          </div>
        </div>
      </div>

      <div className="flex-1 bg-white rounded-t-[32px] flex flex-col min-h-0">
        <div className="flex-1 px-[26px] pt-6 pb-2 overflow-y-auto no-scrollbar">
          <Link
            href="/capture"
            className="flex items-center gap-[14px] bg-leaf rounded-[18px] px-5 py-[17px]"
            style={{ boxShadow: "0 14px 26px -12px rgba(82,177,106,.85)" }}
          >
            <div className="w-[44px] h-[44px] rounded-[14px] bg-white/20 flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 8h2.5L8 6h8l1.5 2H20v11H4z" />
                <circle cx="12" cy="13" r="3.4" />
              </svg>
            </div>
            <div className="flex-1">
              <div className="text-[16px] font-extrabold text-white">Add a receipt</div>
              <div className="text-[12px] text-white/85">Scan the QR · +1 entry</div>
            </div>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 6l6 6-6 6" />
            </svg>
          </Link>

          <div className="flex items-center justify-between mt-[22px] mb-3 mx-[2px]">
            <div className="text-[11px] font-bold tracking-[.12em] uppercase text-muted-2">Recent receipts</div>
            <div className="text-[12.5px] font-bold text-leaf">See all</div>
          </div>

          {recent.length === 0 ? (
            <div className="text-center text-[13px] text-muted py-8">
              No receipts yet. Tap <span className="font-bold text-leaf">Add a receipt</span> to start your streak.
            </div>
          ) : (
            recent.map((r, i) => (
              <div key={r.code} className={`flex items-center gap-[13px] py-[11px] ${i < recent.length - 1 ? "border-b border-[#F1F4F1]" : ""}`}>
                <div className="w-[42px] h-[42px] rounded-[13px] bg-soft-green flex items-center justify-center">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1C4A2A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 3v18l2-1.5L9 21l2-1.5L13 21l2-1.5L17 21V3l-2 1.5L13 3l-2 1.5L9 3 7 4.5z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="text-[14px] font-bold text-ink font-mono">{prettyCode(r.code)}</div>
                  <div className="text-[11.5px] text-muted">{whenLabel(r.created_at)}</div>
                </div>
                <div className="flex items-center gap-[5px] bg-tint-green rounded-full px-[11px] py-[5px]">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#2F8C4B" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                  <span className="text-[11px] font-bold text-leaf-deep">Counted</span>
                </div>
              </div>
            ))
          )}
        </div>

        <BottomNav active="home" />
      </div>
    </div>
  );
}
