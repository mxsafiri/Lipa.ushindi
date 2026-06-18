import { redirect } from "next/navigation";
import StatusBar from "@/components/StatusBar";
import BottomNav from "@/components/BottomNav";
import Avatar from "@/components/Avatar";
import LogoutButton from "@/components/LogoutButton";
import { getSession } from "@/lib/session";
import { getStats } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function Profile() {
  const session = getSession();
  if (!session) redirect("/signin");
  const stats = await getStats(session.id);

  return (
    <div className="app-shell bg-forest flex flex-col min-h-[100dvh]">
      <StatusBar />

      <div className="px-7 pt-[14px] pb-[26px] flex flex-col items-center">
        <Avatar name={session.username} size={72} radius={22} bg="#52B16A" />
        <div className="text-[21px] font-extrabold text-white mt-3">{session.username}</div>
        <div className="text-[13px] text-white/65 mt-1">{session.phone}</div>
      </div>

      <div className="flex-1 bg-white rounded-t-[32px] flex flex-col min-h-0">
        <div className="flex-1 px-[26px] pt-6 overflow-y-auto no-scrollbar">
          <div className="grid grid-cols-3 gap-3">
            <Stat label="This week" value={stats.weekCount} />
            <Stat label="All time" value={stats.allCount} />
            <Stat label="Rank" value={stats.rank ? `#${stats.rank}` : "—"} />
          </div>

          <div className="mt-6 rounded-[16px] bg-coral-bg border-[1.5px] border-coral-border px-[15px] py-[14px] flex items-start gap-[11px]">
            <div className="w-[30px] h-[30px] rounded-[9px] bg-coral flex-none flex items-center justify-center">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3l7 3v5c0 5-3.5 8-7 9-3.5-1-7-4-7-9V6z" />
                <path d="M9 12l2 2 4-4" />
              </svg>
            </div>
            <div>
              <div className="text-[12.5px] font-extrabold text-coral-text">Integrity guard</div>
              <div className="text-[12px] leading-[1.5] text-coral-text-soft mt-[2px]">
                Every receipt you add is checked for a unique code and image hash — fair play, counted once.
              </div>
            </div>
          </div>

          <LogoutButton />
        </div>

        <BottomNav active="profile" />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="bg-soft-green rounded-[16px] py-4 text-center">
      <div className="text-[24px] font-extrabold text-ink">{value}</div>
      <div className="text-[11px] font-semibold text-muted mt-1">{label}</div>
    </div>
  );
}
