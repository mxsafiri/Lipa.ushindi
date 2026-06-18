import Link from "next/link";
import { redirect } from "next/navigation";
import StatusBar from "@/components/StatusBar";
import BottomNav from "@/components/BottomNav";
import { getSession } from "@/lib/session";
import { getStats } from "@/lib/queries";

export const dynamic = "force-dynamic";

// Countdown to the end of the current ISO week (Sunday 20:00 local, demo value).
function countdown() {
  const now = new Date();
  const end = new Date(now);
  const daysToSun = (7 - now.getDay()) % 7;
  end.setDate(now.getDate() + daysToSun);
  end.setHours(20, 0, 0, 0);
  if (end <= now) end.setDate(end.getDate() + 7);
  const ms = end.getTime() - now.getTime();
  const days = Math.floor(ms / 86400000);
  const hrs = Math.floor((ms % 86400000) / 3600000);
  const min = Math.floor((ms % 3600000) / 60000);
  return { days, hrs, min };
}

const EARN = [
  {
    label: "Scan a new receipt",
    points: "+1",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2F8C4B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 8h2.5L8 6h8l1.5 2H20v11H4z" />
        <circle cx="12" cy="13" r="3.4" />
      </svg>
    ),
  },
  {
    label: "Refer a friend",
    points: "+2",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2F8C4B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="9" cy="8" r="3.2" />
        <path d="M3 21a6 6 0 0 1 12 0" />
        <path d="M17 9l2 2 3-3" />
      </svg>
    ),
  },
  {
    label: "Daily check-in",
    points: "+1",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2F8C4B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </svg>
    ),
  },
];

export default async function Draw() {
  const session = getSession();
  if (!session) redirect("/signin");

  const stats = await getStats(session.id);
  const { days, hrs, min } = countdown();
  const tickets = stats.weekCount;

  return (
    <div className="app-shell bg-forest flex flex-col min-h-[100dvh]">
      <StatusBar />

      <div className="px-7 pt-[14px] pb-[18px] text-center">
        <div className="text-[18px] font-bold text-white">Prize Draw</div>
        <div className="text-[12.5px] text-white/65 mt-[3px]">Every genuine receipt is a ticket</div>
      </div>

      <div className="flex-1 bg-white rounded-t-[32px] flex flex-col min-h-0">
        <div className="flex-1 px-[26px] pt-6 pb-2 overflow-y-auto no-scrollbar">
          {/* grand prize */}
          <div className="rounded-[24px] p-6 relative overflow-hidden" style={{ background: "linear-gradient(150deg,#1C4A2A,#2B6B40)" }}>
            <div className="absolute -right-[26px] -bottom-[26px] w-[130px] h-[130px] rounded-full" style={{ background: "rgba(239,160,60,.18)" }} />
            <div className="flex items-center gap-2 relative">
              <div className="w-[30px] h-[30px] rounded-[9px] bg-amber flex items-center justify-center">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="8" width="18" height="13" rx="2" />
                  <path d="M12 8v13M3 12h18M12 8S9.5 3.5 7 5s2 3 5 3M12 8s2.5-4.5 5-3-2 3-5 3" />
                </svg>
              </div>
              <span className="text-[13px] font-bold text-white/80">This week&apos;s grand prize</span>
            </div>
            <div className="text-[36px] font-extrabold text-white tracking-[-.02em] mt-[14px] relative">TZS 5,000,000</div>
            <div className="flex gap-2 mt-4 relative">
              {[
                { v: days, l: "days" },
                { v: hrs, l: "hrs" },
                { v: min, l: "min" },
              ].map((b) => (
                <div key={b.l} className="rounded-[11px] px-3 py-2 text-center bg-white/10">
                  <div className="text-[18px] font-extrabold text-white">{b.v}</div>
                  <div className="text-[10px] text-white/70">{b.l}</div>
                </div>
              ))}
              <div className="flex-1 flex items-center justify-end">
                <span className="text-[11.5px] text-white/65">until draw</span>
              </div>
            </div>
          </div>

          {/* tickets */}
          <div className="flex items-center gap-[15px] rounded-[18px] px-[18px] py-4 mt-4" style={{ background: "#FFF6EC", border: "1.5px solid #F6DCB8" }}>
            <div className="text-center">
              <div className="text-[30px] font-extrabold text-ink leading-none">{tickets}</div>
              <div className="text-[10px] font-semibold mt-[3px]" style={{ color: "#9A7B49" }}>entries</div>
            </div>
            <div className="flex-1">
              <div className="text-[14px] font-extrabold text-ink">You hold {tickets} tickets</div>
              <div className="text-[12px] mt-[2px]" style={{ color: "#9A7B49" }}>
                Each verified receipt = 1 entry. Add more to raise your odds.
              </div>
            </div>
          </div>

          <div className="text-[11px] font-bold tracking-[.12em] uppercase text-muted-2 mt-[22px] mb-3 mx-[2px]">
            Earn more entries
          </div>

          {EARN.map((e, i) => (
            <Link
              href={i === 0 ? "/capture" : "#"}
              key={e.label}
              className={`flex items-center gap-[13px] py-[10px] ${i < EARN.length - 1 ? "border-b border-[#F1F4F1]" : ""}`}
            >
              <div className="w-10 h-10 rounded-[12px] bg-tint-green flex items-center justify-center">{e.icon}</div>
              <div className="flex-1 text-[13.5px] font-bold text-ink">{e.label}</div>
              <div className="text-[13px] font-extrabold text-leaf-deep">{e.points}</div>
            </Link>
          ))}
        </div>

        <BottomNav active="draw" />
      </div>
    </div>
  );
}
